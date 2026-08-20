import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from pydantic import ValidationError

from app.api.revisao_instrumento import (
    _buscar_municipios_oficiais,
    _carregar_revisao_salva,
    _persistir_municipio_revisao,
    _persistir_publico_alvo,
    _validar_municipio_adicionado,
    salvar_revisao_instrumento,
)
from app.schemas.auth import UsuarioAutenticado
from app.schemas.revisao_instrumento import (
    InstrumentoRevisaoInfo,
    LocalidadeRevisaoAlteracao,
    MunicipioOficialItem,
    MunicipioRevisaoAlteracao,
    PublicoAlvoRevisaoAlteracao,
    PublicoAlvoRevisaoItem,
    RevisaoInstrumentoCreate,
)


class _Mappings:
    def __init__(self, row=None):
        self.row = row

    def one_or_none(self):
        return self.row

    def one(self):
        return self.row

    def all(self):
        return self.row or []


class _Result:
    def __init__(self, row=None):
        self.row = row

    def mappings(self):
        return _Mappings(self.row)


class _Db:
    def __init__(self, result=None):
        self.info = {}
        self.execute = AsyncMock(return_value=result)
        self.commit = AsyncMock()
        self.rollback = AsyncMock()


def _instrumento():
    return InstrumentoRevisaoInfo(
        identificador_busca="123",
        tipo_instrumento="contrato_repasse",
        nr_instrumento="123",
        nr_proposta="456",
    )


def _projeto(populacao="100", descricao="Famílias da área rural"):
    return PublicoAlvoRevisaoItem(
        id_projeto_investimento="PROJ-1",
        populacao_beneficiada_original=populacao,
        desc_populacao_beneficiada_original=descricao,
    )


class PublicoAlvoPersistenciaTest(unittest.IsolatedAsyncioTestCase):
    async def _persistir(self, alteracao):
        db = _Db()
        projeto = _projeto()
        with patch(
            "app.api.revisao_instrumento._buscar_publico_alvo",
            new=AsyncMock(side_effect=[[projeto], [projeto]]),
        ):
            await _persistir_publico_alvo(db, 9, _instrumento(), [alteracao])
        sql = str(db.execute.await_args.args[0])
        params = db.execute.await_args.args[1]
        return sql, params

    async def test_persiste_status_populacao_normalizado(self):
        sql, params = await self._persistir(
            PublicoAlvoRevisaoAlteracao(
                id_projeto_investimento="PROJ-1",
                status_populacao_beneficiada="informacao_incorreta",
            )
        )
        self.assertEqual(params["status_populacao_beneficiada"], "informacao_incorreta")
        self.assertIn("ON CONFLICT (id_revisao, id_projeto_investimento)", sql)

    async def test_persiste_status_descricao(self):
        sql, params = await self._persistir(
            PublicoAlvoRevisaoAlteracao(
                id_projeto_investimento="PROJ-1",
                status_desc_populacao_beneficiada="sem_informacao",
            )
        )
        self.assertEqual(params["status_desc_populacao_beneficiada"], "sem_informacao")
        self.assertIn("status_desc_populacao_beneficiada", sql)

    async def test_persiste_conferencia_completa_no_mesmo_upsert(self):
        sql, params = await self._persistir(
            PublicoAlvoRevisaoAlteracao(
                id_projeto_investimento="PROJ-1",
                status_populacao_beneficiada="ok",
                status_desc_populacao_beneficiada="informacao_incorreta",
                observacao_publico_alvo="Descrição divergente.",
                status_correcao_solicitada="nao_necessaria",
            )
        )
        self.assertEqual(params["observacao_publico_alvo"], "Descrição divergente.")
        self.assertEqual(params["status_correcao_solicitada"], "nao_necessaria")
        self.assertIn("status_correcao_solicitada", sql)
        self.assertNotIn("rpa.correcao_solicitada", sql)

    async def test_rascunho_aceita_status_vazios(self):
        db = _Db()
        projeto = _projeto()
        with patch(
            "app.api.revisao_instrumento._buscar_publico_alvo",
            new=AsyncMock(side_effect=[[projeto], [projeto]]),
        ):
            await _persistir_publico_alvo(
                db,
                9,
                _instrumento(),
                [
                    PublicoAlvoRevisaoAlteracao(
                        id_projeto_investimento="PROJ-1",
                        status_populacao_beneficiada=None,
                        status_desc_populacao_beneficiada=None,
                    )
                ],
            )
        db.execute.assert_awaited_once()


class MunicipioPersistenciaTest(unittest.IsolatedAsyncioTestCase):
    async def test_municipio_sem_localidades_ou_obras_nao_usa_variavel_residual(self):
        db = _Db()
        with patch(
            "app.api.revisao_instrumento._buscar_datas_agregadas",
            new=AsyncMock(return_value={}),
        ):
            resposta = await _persistir_municipio_revisao(
                db, 9, 5300108, None, [], []
            )
        self.assertEqual(resposta.cod_municipio, 5300108)

    async def test_grava_municipio_valido_com_localidade_manual_normalizada(self):
        agora = datetime.now(timezone.utc)
        db = _Db()
        db.execute.side_effect = [
            _Result(None),
            _Result(None),
            _Result(None),
            _Result({"id_revisao_localidade": 20}),
            _Result(None),
            _Result(None),
            _Result(
                [
                    {
                        "id_revisao_localidade": 20,
                        "conferido_em": agora,
                        "valido_ate": agora,
                    }
                ]
            ),
        ]
        municipio = MunicipioRevisaoAlteracao(
            cod_municipio=5300108,
            origem_registro="adicionado_tecnico",
            acao_sugerida="adicionar",
        )
        localidade = LocalidadeRevisaoAlteracao(
            cod_municipio=5300108,
            nome_localidade_informada="  Vila   Nova  ",
            origem_registro="adicionado_tecnico",
            acao_sugerida="adicionar",
            qtde_familias_ben_sugerida=25,
        )
        with (
            patch(
                "app.api.revisao_instrumento._validar_municipio_adicionado",
                new=AsyncMock(
                    return_value=MunicipioOficialItem(
                        cod_municipio=5300108,
                        nome_municipio="Brasília",
                        cod_uf=53,
                        sigla_uf="DF",
                        nome_uf="Distrito Federal",
                    )
                ),
            ),
            patch(
                "app.api.revisao_instrumento._buscar_datas_agregadas",
                new=AsyncMock(return_value={}),
            ),
        ):
            resposta = await _persistir_municipio_revisao(
                db, 9, 5300108, municipio, [localidade], []
            )

        params_insert_localidade = db.execute.await_args_list[3].args[1]
        self.assertEqual(params_insert_localidade["nome_localidade_informada"], "Vila Nova")
        self.assertEqual(params_insert_localidade["qtde_familias_ben_sugerida"], 25)
        self.assertEqual(resposta.nome, "Brasília")
        self.assertEqual(resposta.localidades[0].acao_sugerida, "adicionar")

    async def test_aceita_municipio_oficial_com_origem_e_acao_corretas(self):
        db = _Db(
            _Result(
                {
                    "cod_municipio": 5300108,
                    "nome_municipio": "Brasília",
                    "cod_uf": 53,
                    "sigla_uf": "DF",
                    "nome_uf": "Distrito Federal",
                }
            )
        )
        item = await _validar_municipio_adicionado(
            db,
            MunicipioRevisaoAlteracao(
                cod_municipio=5300108,
                origem_registro="adicionado_tecnico",
                acao_sugerida="adicionar",
            ),
        )
        self.assertEqual(item.nome_municipio, "Brasília")
        self.assertIn("territorio.tb_municipio", str(db.execute.await_args.args[0]))
        self.assertIn("territorio.tb_uf", str(db.execute.await_args.args[0]))
        self.assertIn("BTRIM(uf.sigla_uf)", str(db.execute.await_args.args[0]))

    async def test_rejeita_codigo_inexistente_antes_do_insert(self):
        db = _Db(_Result(None))
        with self.assertRaises(HTTPException) as raised:
            await _validar_municipio_adicionado(
                db,
                MunicipioRevisaoAlteracao(
                    cod_municipio=9999999,
                    origem_registro="adicionado_tecnico",
                    acao_sugerida="adicionar",
                ),
            )
        self.assertEqual(raised.exception.status_code, 422)
        self.assertEqual(db.execute.await_count, 1)

    def test_rejeita_municipio_duplicado_no_payload(self):
        municipio = {
            "cod_municipio": 5300108,
            "origem_registro": "adicionado_tecnico",
            "acao_sugerida": "adicionar",
        }
        with self.assertRaises(ValidationError):
            RevisaoInstrumentoCreate(
                instrumento=_instrumento(),
                municipios=[municipio, municipio],
            )

    def test_payload_aceita_municipio_com_localidade_manual(self):
        payload = RevisaoInstrumentoCreate(
            instrumento=_instrumento(),
            municipios=[
                {
                    "cod_municipio": 5300108,
                    "nome": "Brasília",
                    "uf": "DF",
                    "origem_registro": "adicionado_tecnico",
                    "acao_sugerida": "adicionar",
                    "localidades": [
                        {
                            "cod_municipio": 5300108,
                            "cod_comunidade_rural": None,
                            "nome_localidade_informada": "  Vila Nova  ",
                            "origem_registro": "adicionado_tecnico",
                            "acao_sugerida": "adicionar",
                            "qtde_familias_ben_sugerida": 25,
                        }
                    ],
                }
            ],
        )
        localidade = payload.municipios[0].localidades[0]
        self.assertEqual(localidade.qtde_familias_ben_sugerida, 25)
        self.assertIsNone(localidade.cod_comunidade_rural)

    async def test_recarga_preserva_municipio_e_localidade_incluidos(self):
        db = _Db()
        db.execute.side_effect = [
            _Result(
                [
                    {
                        "cod_municipio": 5300108,
                        "nome": "Brasília",
                        "uf": "DF",
                        "origem_registro": "adicionado_tecnico",
                        "acao_sugerida": "adicionar",
                        "justificativa": None,
                        "conferido_em": "2026-08-14T08:00:00",
                        "valido_ate": "2026-09-13T08:00:00",
                    }
                ]
            ),
            _Result(
                [
                    {
                        "id_revisao_localidade": 20,
                        "cod_municipio": 5300108,
                        "cod_comunidade_rural": None,
                        "nome_localidade_informada": "Vila Nova",
                        "origem_registro": "adicionado_tecnico",
                        "acao_sugerida": "adicionar",
                        "qtde_familias_ben_original": None,
                        "qtde_familias_ben_sugerida": 25,
                        "justificativa": None,
                        "conferido_em": "2026-08-14T08:00:00",
                        "valido_ate": "2026-09-13T08:00:00",
                    }
                ]
            ),
            _Result([]),
        ]

        municipios, localidades, obras, _ = await _carregar_revisao_salva(db, 9)

        self.assertEqual(municipios[5300108]["nome"], "Brasília")
        self.assertEqual(localidades[0]["nome_localidade_informada"], "Vila Nova")
        self.assertEqual(localidades[0]["qtde_familias_ben_sugerida"], 25)
        self.assertEqual(obras, [])


class MunicipioOficialBuscaTest(unittest.IsolatedAsyncioTestCase):
    async def test_busca_retorna_contrato_oficial_e_usa_apenas_tabelas_territoriais(self):
        db = _Db(
            _Result(
                [
                    {
                        "cod_municipio": 2108256,
                        "nome_municipio": "Pedro do Rosário",
                        "cod_uf": 21,
                        "sigla_uf": "MA",
                        "nome_uf": "Maranhão",
                    }
                ]
            )
        )

        itens = await _buscar_municipios_oficiais(db, "  Pedro do Rosario/MA  ")

        self.assertEqual(
            itens[0].model_dump(),
            {
                "cod_municipio": 2108256,
                "nome_municipio": "Pedro do Rosário",
                "cod_uf": 21,
                "sigla_uf": "MA",
                "nome_uf": "Maranhão",
            },
        )
        sql = str(db.execute.await_args.args[0])
        params = db.execute.await_args.args[1]
        self.assertIn("territorio.tb_municipio AS m", sql)
        self.assertIn("territorio.tb_uf AS uf", sql)
        self.assertNotIn("vw_base_municipal", sql)
        self.assertIn("BTRIM(uf.sigla_uf)", sql)
        self.assertIn("m.nome_municipio || '/' || BTRIM(uf.sigla_uf)", sql)
        self.assertEqual(params["termo_codigo"], "Pedro do Rosario/MA")
        self.assertEqual(params["termo_texto"], "%pedro do rosario/ma%")
        self.assertEqual(params["limite"], 20)

    async def test_busca_normaliza_acentos_caixa_e_espacos_externos(self):
        db = _Db(_Result([]))

        await _buscar_municipios_oficiais(db, "  SÃO LUÍS  ")

        params = db.execute.await_args.args[1]
        self.assertEqual(params["termo_codigo"], "SÃO LUÍS")
        self.assertEqual(params["termo_texto"], "%sao luis%")


class TransacaoRevisaoTest(unittest.IsolatedAsyncioTestCase):
    async def test_falha_em_secao_posterior_faz_rollback_sem_commit(self):
        db = _Db()
        payload = RevisaoInstrumentoCreate(
            instrumento=_instrumento(),
            municipios=[
                {
                    "cod_municipio": 5300108,
                    "origem_registro": "adicionado_tecnico",
                    "acao_sugerida": "adicionar",
                }
            ],
            publico_alvo=[
                {
                    "id_projeto_investimento": "PROJ-1",
                    "status_populacao_beneficiada": "ok",
                    "status_desc_populacao_beneficiada": "ok",
                }
            ],
        )
        usuario = UsuarioAutenticado(
            id_usuario=1,
            nome="Técnica",
            email="tecnica@example.gov.br",
            perfil="tecnico",
        )
        with (
            patch("app.api.revisao_instrumento.exigir_permissao_edicao", new=AsyncMock()),
            patch(
                "app.api.revisao_instrumento._validar_municipios_adicionados_no_instrumento",
                new=AsyncMock(),
            ),
            patch(
                "app.api.revisao_instrumento._obter_ou_criar_revisao",
                new=AsyncMock(return_value={"id_revisao": 9}),
            ),
            patch(
                "app.api.revisao_instrumento._persistir_municipio_revisao",
                new=AsyncMock(return_value=SimpleNamespace()),
            ),
            patch(
                "app.api.revisao_instrumento._persistir_publico_alvo",
                new=AsyncMock(
                    side_effect=HTTPException(status_code=422, detail="Falha no público-alvo")
                ),
            ),
        ):
            with self.assertRaises(HTTPException):
                await salvar_revisao_instrumento(payload, usuario, db)

        db.rollback.assert_awaited_once()
        db.commit.assert_not_awaited()

    async def test_envio_muda_status_somente_depois_de_persistir_todas_as_secoes(self):
        eventos = []

        class _DbOrdenado:
            def __init__(self):
                self.info = {}
                self.rollback = AsyncMock()

            async def execute(self, *_args, **_kwargs):
                eventos.append("status-enviado")
                agora = datetime.now(timezone.utc)
                return _Result({"enviado_em": agora, "atualizado_em": agora})

            async def commit(self):
                eventos.append("commit")

        db = _DbOrdenado()
        agora = datetime.now(timezone.utc)
        payload = RevisaoInstrumentoCreate(
            status="enviado",
            instrumento=_instrumento(),
            publico_alvo=[
                {
                    "id_projeto_investimento": "PROJ-1",
                    "status_populacao_beneficiada": "ok",
                    "status_desc_populacao_beneficiada": "ok",
                }
            ],
        )
        usuario = UsuarioAutenticado(
            id_usuario=1,
            nome="Técnica",
            email="tecnica@example.gov.br",
            perfil="tecnico",
        )

        async def persistir_publico(*_args, **_kwargs):
            eventos.append("publico-alvo")
            return [
                _projeto().model_copy(
                    update={
                        "status_populacao_beneficiada": "ok",
                        "status_desc_populacao_beneficiada": "ok",
                    }
                )
            ]

        with (
            patch("app.api.revisao_instrumento.exigir_permissao_edicao", new=AsyncMock()),
            patch(
                "app.api.revisao_instrumento._validar_municipios_adicionados_no_instrumento",
                new=AsyncMock(),
            ),
            patch(
                "app.api.revisao_instrumento._obter_ou_criar_revisao",
                new=AsyncMock(
                    return_value={
                        "id_revisao": 9,
                        "criado_em": agora,
                        "atualizado_em": agora,
                        "enviado_em": None,
                    }
                ),
            ),
            patch(
                "app.api.revisao_instrumento._persistir_publico_alvo",
                new=persistir_publico,
            ),
            patch(
                "app.api.revisao_instrumento._montar_resposta_busca",
                new=AsyncMock(
                    return_value=SimpleNamespace(
                        completude={"possui_manifestacao": True},
                        status_revisao_geral="concluida",
                        status_revisao_geral_label="Revisão concluída",
                    )
                ),
            ),
        ):
            resposta = await salvar_revisao_instrumento(payload, usuario, db)

        self.assertEqual(resposta.status, "enviado")
        self.assertEqual(eventos, ["publico-alvo", "status-enviado", "commit"])


if __name__ == "__main__":
    unittest.main()
