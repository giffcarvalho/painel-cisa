import unittest
from datetime import datetime
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

from app.api.revisao_instrumento import (
    _carregar_estado_aplicado,
    _buscar_detalhe_revisao_enviada,
    _buscar_localidades_municipio,
    _buscar_obras_saneamento,
    _observacao_geral_atual,
    _revisao_corresponde_ao_identificador,
    _sobrepor_estado_aplicado,
)
from app.schemas.revisao_instrumento import (
    InstrumentoRevisaoInfo,
    LocalidadeRevisaoItem,
    MunicipioRevisaoItem,
)


class _Mappings:
    def __init__(self, rows):
        self.rows = rows

    def one_or_none(self):
        return self.rows[0] if self.rows else None

    def all(self):
        return self.rows


class _Result:
    def __init__(self, rows):
        self.rows = rows

    def mappings(self):
        return _Mappings(self.rows)


class VisualizacaoRevisaoEnviadaTest(unittest.IsolatedAsyncioTestCase):
    def test_estado_aplicado_vigente_vira_manter_sem_alterar_valor_oficial(self):
        agora = datetime(2026, 8, 25, 17, 8)
        validade = datetime(2026, 9, 25, 17, 8)
        municipio = MunicipioRevisaoItem(
            cod_municipio=2603009,
            nome="Cabrobó",
            uf="PE",
            localidades=[
                LocalidadeRevisaoItem(
                    cod_municipio=2603009,
                    cod_comunidade_rural=1,
                    nome_localidade="Localidade adicionada",
                    qtde_familias_ben_original=10,
                ),
                LocalidadeRevisaoItem(
                    cod_municipio=2603009,
                    cod_comunidade_rural=2,
                    nome_localidade="Vista Alegre",
                    qtde_familias_ben_original=20,
                ),
                LocalidadeRevisaoItem(
                    cod_municipio=2603009,
                    cod_comunidade_rural=3,
                    nome_localidade="Nunca analisada",
                    qtde_familias_ben_original=30,
                ),
            ],
        )

        _sobrepor_estado_aplicado(
            [municipio],
            {2603009: {"conferido_em": agora, "valido_ate": validade}},
            [
                {"cod_municipio": 2603009, "cod_comunidade_rural": 1,
                 "conferido_em": agora, "valido_ate": validade},
                {"cod_municipio": 2603009, "cod_comunidade_rural": 2,
                 "conferido_em": agora, "valido_ate": validade},
            ],
        )

        self.assertEqual(municipio.acao_sugerida, "manter")
        self.assertEqual(municipio.origem_registro, "base_atual")
        self.assertEqual(
            [item.acao_sugerida for item in municipio.localidades],
            ["manter", "manter", None],
        )
        self.assertEqual(municipio.localidades[1].qtde_familias_ben_original, 20)
        self.assertIsNone(municipio.localidades[1].qtde_familias_ben_sugerida)

    def test_observacao_do_rascunho_prevalece_sobre_a_aplicada(self):
        aplicada = {"observacao_geral": "teste obs geral"}
        self.assertEqual(_observacao_geral_atual(None, aplicada), "teste obs geral")
        self.assertEqual(
            _observacao_geral_atual({"observacao_geral": "nova"}, aplicada),
            "nova",
        )

    async def test_estado_aplicado_considera_ultima_avaliacao_valida_por_item(self):
        agora = datetime(2026, 8, 25, 17, 8)
        execute = AsyncMock(
            side_effect=[
                _Result([{"cod_municipio": 2603009, "conferido_em": agora,
                          "valido_ate": agora}]),
                _Result([{"id_revisao_localidade": 4, "cod_municipio": 2603009,
                          "cod_comunidade_rural": 77, "conferido_em": agora,
                          "valido_ate": agora}]),
            ]
        )
        instrumento = InstrumentoRevisaoInfo(
            identificador_busca="992794",
            tipo_instrumento="termo_compromisso",
            nr_instrumento="992794",
            nr_proposta="58/2026",
        )
        with patch("app.api.revisao_instrumento._execute_query", execute):
            municipios, localidades = await _carregar_estado_aplicado(
                AsyncMock(), instrumento
            )

        municipio_sql = execute.await_args_list[0].args[1]
        localidade_sql = execute.await_args_list[1].args[1]
        self.assertIn("DISTINCT ON (rm.cod_municipio)", municipio_sql)
        self.assertIn("e.status = 'sucesso'", municipio_sql)
        self.assertIn("valido_ate >= NOW()", municipio_sql)
        self.assertIn("LEFT JOIN LATERAL", localidade_sql)
        self.assertIn("DISTINCT ON (cod_municipio, cod_comunidade_atual)", localidade_sql)
        self.assertEqual(municipios[2603009]["conferido_em"], agora)
        self.assertEqual(localidades[0]["cod_comunidade_rural"], 77)

    async def test_localidades_disponiveis_usam_relacao_real_do_municipio(self):
        execute = AsyncMock(
            return_value=_Result(
                [{
                    "cod_municipio": 2603009,
                    "cod_comunidade_rural": 77,
                    "nome_localidade": "Vila Nova",
                }]
            )
        )
        with patch("app.api.revisao_instrumento._execute_query", execute):
            localidades = await _buscar_localidades_municipio(AsyncMock(), 2603009)

        sql, params = execute.await_args.args[1:3]
        self.assertIn("territorio.tb_comunidade_rural", sql)
        self.assertIn("cr.cod_municipio = :cod_municipio", sql)
        self.assertEqual(params["cod_municipio"], 2603009)
        self.assertEqual(localidades[0].cod_comunidade_rural, 77)

    async def test_obras_aplicadas_sobrepoem_estado_padrao(self):
        agora = datetime(2026, 8, 25, 17, 8)
        db = AsyncMock()
        db.execute.return_value = _Result(
            [{
                "id_obra": "OBRA-1",
                "cod_municipio": 2603009,
                "descricao": "Sistema de saneamento",
                "orgao": "MCID",
                "link_transferegov": None,
                "link_obrasgov": None,
                "relacao_instrumento": "sem_conflito_aparente",
                "confirmacao_status": "sem_conflito",
                "justificativa": "Conferida",
                "conferido_em": agora,
                "valido_ate": agora,
            }]
        )
        instrumento = InstrumentoRevisaoInfo(
            identificador_busca="123",
            tipo_instrumento="contrato_repasse",
            nr_instrumento="123",
            nr_proposta="456",
        )

        obras = await _buscar_obras_saneamento(db, [2603009], instrumento)

        sql = str(db.execute.await_args.args[0])
        params = db.execute.await_args.args[1]
        self.assertIn("instrumento.vw_obra_saneamento_revisada", sql)
        self.assertIn("revisada.valido_ate >= NOW()", sql)
        self.assertEqual(params["nr_proposta"], "456")
        self.assertEqual(obras[0].relacao_instrumento, "sem_conflito_aparente")
        self.assertEqual(obras[0].conferido_em, agora)

    def test_identificador_aceita_instrumento_proposta_ted_ou_busca_original(self):
        revisao = {
            "identificador_busca": "busca",
            "nr_instrumento": "123",
            "nr_proposta": "456",
            "nr_ted": None,
        }
        self.assertTrue(_revisao_corresponde_ao_identificador(revisao, "123"))
        self.assertTrue(_revisao_corresponde_ao_identificador(revisao, "456"))
        self.assertTrue(_revisao_corresponde_ao_identificador(revisao, "busca"))
        self.assertFalse(_revisao_corresponde_ao_identificador(revisao, "999"))

    async def test_consulta_historica_usa_id_especifico_e_tabelas_de_revisao(self):
        agora = datetime(2026, 8, 17, 14, 35)
        cabecalho = {
            "id_revisao": 12,
            "id_revisao_anterior": 8,
            "identificador_busca": "123",
            "tipo_instrumento": "contrato_repasse",
            "nr_instrumento": "123",
            "nr_proposta": "456",
            "nr_ted": None,
            "status": "enviado",
            "observacao_geral": "Conferência concluída.",
            "criado_em": agora,
            "atualizado_em": agora,
            "enviado_em": agora,
            "aplicado_em": None,
            "base_referencia_em": agora,
            "id_usuario": 7,
            "usuario_nome": "Usuário Teste 2.0",
        }
        publico = {
            "id_revisao_publico_alvo": 3,
            "id_projeto_investimento": "obra-1",
            "tipo_instrumento": "contrato_repasse",
            "nr_instrumento": "123",
            "nome_obra": "Sistema de abastecimento",
            "populacao_beneficiada_original": "850",
            "desc_populacao_beneficiada_original": "Original",
            "status_populacao_beneficiada": "ok",
            "status_desc_populacao_beneficiada": "informacao_incorreta",
            "observacao_publico_alvo": "Descrição divergente.",
            "status_correcao_solicitada": "sim",
            "conferido_em": agora,
            "valido_ate": agora,
        }
        execute = AsyncMock(side_effect=[_Result([cabecalho]), _Result([publico])])
        instrumento = InstrumentoRevisaoInfo(
            identificador_busca="123",
            tipo_instrumento="contrato_repasse",
            nr_instrumento="123",
            nr_proposta="456",
        )

        with (
            patch("app.api.revisao_instrumento._execute_query", execute),
            patch(
                "app.api.revisao_instrumento._buscar_instrumento_carteira",
                new=AsyncMock(return_value=instrumento),
            ),
            patch(
                "app.api.revisao_instrumento._carregar_revisao_salva",
                new=AsyncMock(return_value=({}, [], [], {})),
            ),
        ):
            resposta = await _buscar_detalhe_revisao_enviada(
                AsyncMock(), "123", 12
            )

        self.assertEqual(resposta.id_revisao, 12)
        self.assertEqual(resposta.usuario.nome, "Usuário Teste 2.0")
        self.assertEqual(resposta.publico_alvo[0].populacao_beneficiada_original, "850")
        primeira_sql, primeira_params = execute.await_args_list[0].args[1:3]
        publico_sql, publico_params = execute.await_args_list[1].args[1:3]
        self.assertIn("r.id_revisao = :id_revisao", primeira_sql)
        self.assertEqual(primeira_params["id_revisao"], 12)
        self.assertIn("tb_revisao_instrumento_publico_alvo", publico_sql)
        self.assertIn("pi.populacao_beneficiada", publico_sql)
        self.assertIn("pi.desc_populacao_beneficiada", publico_sql)
        self.assertNotIn("rpa.populacao_beneficiada_original", publico_sql)
        self.assertNotIn("rpa.desc_populacao_beneficiada_original", publico_sql)
        self.assertIn("rpa.status_correcao_solicitada", publico_sql)
        self.assertNotIn("rpa.correcao_solicitada", publico_sql)
        self.assertEqual(publico_params["id_revisao"], 12)

    async def test_rejeita_revisao_associada_a_outro_instrumento(self):
        agora = datetime(2026, 8, 17, 14, 35)
        cabecalho = {
            "id_revisao": 12,
            "id_revisao_anterior": None,
            "identificador_busca": "123",
            "tipo_instrumento": "contrato_repasse",
            "nr_instrumento": "123",
            "nr_proposta": "456",
            "nr_ted": None,
            "status": "enviado",
            "observacao_geral": None,
            "criado_em": agora,
            "atualizado_em": agora,
            "enviado_em": agora,
            "aplicado_em": None,
            "base_referencia_em": agora,
            "id_usuario": 7,
            "usuario_nome": "Usuário",
        }
        with patch(
            "app.api.revisao_instrumento._execute_query",
            new=AsyncMock(return_value=_Result([cabecalho])),
        ):
            with self.assertRaises(HTTPException) as contexto:
                await _buscar_detalhe_revisao_enviada(AsyncMock(), "999", 12)
        self.assertEqual(contexto.exception.status_code, 409)


if __name__ == "__main__":
    unittest.main()
