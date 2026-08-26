import inspect
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.schemas.auth import UsuarioAutenticado
from app.services.aplicacao_revisoes import (
    _advisory_key,
    _aplicar_localidade,
    _aplicar_municipio,
    _atualizar_views_consolidadas,
    _carregar_revisao,
    _detalhe_obra,
    _detalhe_publico_alvo,
    _existe_aplicacao_posterior,
    _mensagem_limite_comunidades,
    _mensagem_erro_publica,
    _resumir,
    _resolver_comunidade,
    _reverter_detalhe,
    _validar_cancelamento_carregado,
    _validar,
    aplicar_revisao,
    cancelar_aplicacao,
    exigir_admin,
    listar_pendentes,
    listar_historico,
    obter_execucao,
)


class _Mappings:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows

    def one(self):
        return self._rows[0]

    def one_or_none(self):
        return self._rows[0] if self._rows else None


class _Scalars:
    def __init__(self, values):
        self._values = values

    def all(self):
        return self._values


class _Result:
    def __init__(self, rows=None, scalar=None, scalars=None):
        self._rows = rows or []
        self._scalar = scalar
        self._scalars = scalars or []

    def mappings(self):
        return _Mappings(self._rows)

    def scalar_one_or_none(self):
        return self._scalar

    def scalar_one(self):
        return self._scalar

    def scalars(self):
        return _Scalars(self._scalars)


def _revisao(tipo="contrato_repasse", **updates):
    data = {
        "id_revisao": 10,
        "id_revisao_anterior": None,
        "identificador_busca": "948494",
        "tipo_instrumento": tipo,
        "nr_instrumento": "948494",
        "nr_proposta": "123456",
        "nr_ted": None,
        "status": "enviado",
        "enviado_em": datetime(2026, 8, 21, 10, 0),
        "aplicado_em": None,
    }
    data.update(updates)
    return data


class PermissaoAplicacaoTest(unittest.TestCase):
    def test_admin_acessa(self):
        usuario = UsuarioAutenticado(
            id_usuario=1, nome="Admin", email="admin@example.com", perfil="admin"
        )
        exigir_admin(usuario)

    def test_tecnico_nao_acessa_endpoint_administrativo(self):
        usuario = UsuarioAutenticado(
            id_usuario=2, nome="Técnico", email="tecnico@example.com", perfil="tecnico"
        )
        with self.assertRaises(HTTPException) as contexto:
            exigir_admin(usuario)
        self.assertEqual(contexto.exception.status_code, 403)


class ListagemAplicacaoTest(unittest.IsolatedAsyncioTestCase):
    async def test_lista_apenas_enviadas_nao_aplicadas_e_ignora_manter_na_contagem(self):
        db = AsyncMock()
        db.execute.return_value = _Result(rows=[])
        resposta = await listar_pendentes(db)
        self.assertEqual(resposta.total, 0)
        sql = str(db.execute.await_args.args[0])
        self.assertIn("r.status = 'enviado'", sql)
        self.assertIn("r.enviado_em IS NOT NULL", sql)
        self.assertIn("r.aplicado_em IS NULL", sql)
        self.assertIn("acao_sugerida <> 'manter'", sql)


class HistoricoAplicacoesTest(unittest.IsolatedAsyncioTestCase):
    async def test_lista_paginada_preserva_execucoes_da_mesma_revisao(self):
        inicio = datetime(2026, 8, 25, 14, 14)
        base = {
            "id_revisao": 1, "iniciado_em": inicio, "concluido_em": inicio,
            "qtd_municipios": 0, "qtd_localidades": 0,
            "qtd_publico_alvo": 1, "qtd_obras": 1,
            "tipo_instrumento": "termo_compromisso", "nr_instrumento": "992794",
            "nr_proposta": "992794", "nr_ted": None,
            "identificador_busca": "992794", "administrador": "Usuário Teste 2.0",
            "mensagem_erro": None,
        }
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(scalar=2),
            _Result(rows=[
                {**base, "id_execucao": 5, "status": "sucesso"},
                {**base, "id_execucao": 4, "status": "falha", "mensagem_erro": "Falha controlada"},
            ]),
        ]
        resposta = await listar_historico(
            db, page=1, page_size=10, busca="992794", status_execucao=None
        )
        self.assertEqual([item.id_execucao for item in resposta.data], [5, 4])
        self.assertEqual(resposta.total, 2)
        self.assertEqual(resposta.total_pages, 1)
        self.assertEqual(resposta.data[0].tipo_instrumento_label, "Termo de compromisso")
        sql = str(db.execute.await_args_list[1].args[0])
        self.assertIn("ORDER BY e.iniciado_em DESC", sql)
        self.assertIn("nr_instrumento ILIKE", sql)
        self.assertNotIn("tb_execucao_aplicacao_revisao_detalhe", sql)

    async def test_detalhe_execucao_cinco_reconstroi_resumo_da_auditoria(self):
        instante = datetime(2026, 8, 25, 14, 14)
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(rows=[{
                "id_execucao": 5, "id_revisao": 1, "status": "sucesso",
                "iniciado_em": instante, "concluido_em": instante, "mensagem_erro": None,
                "tipo_instrumento": "termo_compromisso", "nr_instrumento": "992794",
                "nr_proposta": "992794", "nr_ted": None, "identificador_busca": "992794",
                "administrador": "Usuário Teste 2.0",
            }]),
            _Result(rows=[
                {"id_detalhe": 10, "entidade": "publico_alvo", "acao": "incorporar_avaliacao",
                 "resultado": "incorporado", "chave": {"id_projeto_investimento": "110714.23-19"},
                 "valores_anteriores": None, "valores_novos": {"status_correcao_solicitada": "nao"},
                 "mensagem": "Projeto 110714.23-19"},
                {"id_detalhe": 11, "entidade": "obra", "acao": "incorporar_avaliacao",
                 "resultado": "incorporado", "chave": {"id_obra": "1033688"},
                 "valores_anteriores": None, "valores_novos": {"confirmacao_status": "sem_conflito"},
                 "mensagem": "Obra 1033688"},
            ]),
        ]
        resposta = await obter_execucao(db, 5)
        self.assertEqual(resposta.resumo.publico_alvo, {"incorporado": 1})
        self.assertEqual(resposta.resumo.obras, {"incorporado": 1})
        self.assertEqual(resposta.detalhes[0].chave["id_projeto_investimento"], "110714.23-19")
        self.assertEqual(resposta.aplicado_em, instante)

    async def test_falha_nao_usa_data_atual_da_revisao_e_oculta_traceback(self):
        instante = datetime(2026, 8, 25, 13, 48)
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(rows=[{
                "id_execucao": 4, "id_revisao": 1, "status": "falha",
                "iniciado_em": instante, "concluido_em": instante,
                "mensagem_erro": "Traceback (most recent call last):\nsegredo técnico",
                "tipo_instrumento": "termo_compromisso", "nr_instrumento": "992794",
                "nr_proposta": "992794", "nr_ted": None, "identificador_busca": "992794",
                "administrador": "Usuário Teste 2.0",
            }]),
            _Result(rows=[]),
        ]
        resposta = await obter_execucao(db, 4)
        self.assertIsNone(resposta.aplicado_em)
        self.assertNotIn("Traceback", resposta.mensagem)
        self.assertEqual(resposta.status, "falha")

    def test_mensagem_publica_limita_a_primeira_linha(self):
        self.assertEqual(_mensagem_erro_publica("Falha conhecida\ndetalhe interno"), "Falha conhecida")


class ValidacaoAplicacaoTest(unittest.IsolatedAsyncioTestCase):
    async def test_rascunho_nao_pode_ser_aplicado(self):
        db = AsyncMock()
        db.execute.return_value = _Result(scalar=1)
        validacao = await _validar(
            db, _revisao(status="rascunho", enviado_em=None), [], [], 0
        )
        self.assertFalse(validacao.aplicavel)
        self.assertTrue(any("formalmente enviada" in item for item in validacao.pendencias))

    async def test_revisao_aplicada_nao_pode_ser_reaplicada(self):
        db = AsyncMock()
        validacao = await _validar(
            db, _revisao(aplicado_em=datetime(2026, 8, 21, 11, 0)), [], [], 0
        )
        self.assertEqual(validacao.status, "ja_aplicada")
        db.execute.assert_not_awaited()

    async def test_ted_nao_inventa_proporcao_para_adicao(self):
        db = AsyncMock()
        db.execute.return_value = _Result(scalar=1)
        municipio = {
            "acao_sugerida": "adicionar",
            "cod_municipio": 5300108,
        }
        validacao = await _validar(
            db,
            _revisao(tipo="ted", nr_ted=55, nr_proposta=None),
            [municipio],
            [],
            0,
        )
        self.assertFalse(validacao.aplicavel)
        self.assertTrue(any("proporção" in item for item in validacao.pendencias))

    async def test_ted_com_localidade_sem_destino_e_bloqueado(self):
        db = AsyncMock()
        db.execute.return_value = _Result(scalar=1)
        localidade = {
            "acao_sugerida": "remover",
            "cod_municipio": 5300108,
            "cod_comunidade_rural": 9,
            "nome_localidade_informada": None,
            "localidade": "Comunidade A",
        }
        validacao = await _validar(
            db, _revisao(tipo="ted", nr_ted=55, nr_proposta=None), [], [localidade], 0
        )
        self.assertFalse(validacao.aplicavel)
        self.assertTrue(any("não existe tabela oficial" in item for item in validacao.pendencias))

    async def test_publico_alvo_parcial_nao_bloqueia_aplicacao(self):
        db = AsyncMock()
        db.execute.side_effect = [_Result(scalar=1), _Result(scalar=10)]
        validacao = await _validar(db, _revisao(), [], [], 1)
        self.assertTrue(validacao.aplicavel)
        self.assertFalse(any("público-alvo" in item for item in validacao.pendencias))

    async def test_revisao_anterior_precisa_ser_aplicada_primeiro(self):
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(scalar=1), _Result(scalar=None), _Result(scalar=10)
        ]
        validacao = await _validar(
            db, _revisao(id_revisao_anterior=9), [], [], 0
        )
        self.assertFalse(validacao.aplicavel)
        self.assertTrue(any("revisão anterior" in item.lower() for item in validacao.pendencias))

    async def test_multiplas_pendentes_respeitam_a_mais_antiga(self):
        db = AsyncMock()
        db.execute.side_effect = [_Result(scalar=1), _Result(scalar=8)]
        validacao = await _validar(db, _revisao(), [], [], 0)
        self.assertFalse(validacao.aplicavel)
        self.assertTrue(any("mais antiga pendente" in item for item in validacao.pendencias))

    async def test_revisao_sem_nr_proposta_e_bloqueada(self):
        db = AsyncMock()
        db.execute.return_value = _Result(scalar=10)
        validacao = await _validar(db, _revisao(nr_proposta=None), [], [], 0)
        self.assertFalse(validacao.aplicavel)
        self.assertTrue(any("número canônico" in item for item in validacao.pendencias))

    async def test_tipo_desconhecido_e_bloqueado(self):
        db = AsyncMock()
        db.execute.return_value = _Result(scalar=10)
        validacao = await _validar(
            db, _revisao(tipo_instrumento="convenio"), [], [], 0
        )
        self.assertFalse(validacao.aplicavel)
        self.assertTrue(any("não suportado" in item for item in validacao.pendencias))

    async def test_comunidade_de_outro_municipio_e_bloqueada(self):
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(scalar=1), _Result(scalar=10), _Result(scalar=99)
        ]
        localidade = {
            "acao_sugerida": "remover",
            "cod_municipio": 1,
            "cod_comunidade_rural": 77,
            "nome_localidade_informada": None,
            "localidade": "Comunidade A",
            "origem_registro": "base_atual",
            "qtde_familias_ben_sugerida": None,
        }
        validacao = await _validar(db, _revisao(), [], [localidade], 0)
        self.assertFalse(validacao.aplicavel)
        self.assertTrue(any("pertence a outro município" in item for item in validacao.pendencias))

    async def test_localidade_manual_ambigua_e_bloqueada(self):
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(scalar=1), _Result(scalar=10), _Result(scalars=[7, 8])
        ]
        localidade = {
            "acao_sugerida": "remover",
            "cod_municipio": 1,
            "cod_comunidade_rural": None,
            "nome_localidade_informada": "Comunidade repetida",
            "localidade": "Comunidade repetida",
            "origem_registro": "adicionado_tecnico",
            "qtde_familias_ben_sugerida": None,
        }
        validacao = await _validar(db, _revisao(), [], [localidade], 0)
        self.assertFalse(validacao.aplicavel)
        self.assertTrue(any("múltiplos cadastros" in item for item in validacao.pendencias))


class OperacoesMunicipioTest(unittest.IsolatedAsyncioTestCase):
    async def test_adiciona_municipio_com_conflito_tratado_explicitamente(self):
        db = AsyncMock()
        db.execute.side_effect = [_Result(scalar=None), _Result(scalar=1)]
        detalhe = await _aplicar_municipio(
            db, _revisao(), {"acao_sugerida": "adicionar", "cod_municipio": 1}
        )
        self.assertEqual(detalhe["resultado"], "adicionado")
        sql_insert = str(db.execute.await_args_list[1].args[0])
        self.assertIn("ON CONFLICT", sql_insert)
        self.assertIn("RETURNING 1", sql_insert)

    async def test_adicionar_existente_registra_sem_operacao(self):
        db = AsyncMock()
        db.execute.return_value = _Result(scalar=1)
        detalhe = await _aplicar_municipio(
            db, _revisao(), {"acao_sugerida": "adicionar", "cod_municipio": 1}
        )
        self.assertEqual(detalhe["resultado"], "ja_existente")
        self.assertEqual(db.execute.await_count, 1)


class OperacoesLocalidadeTest(unittest.IsolatedAsyncioTestCase):
    async def test_primeira_comunidade_usa_codigo_retornado_pela_funcao(self):
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(),
            _Result(scalars=[]),
            _Result(scalar=1234567001),
            _Result(),
        ]
        codigo, criada = await _resolver_comunidade(
            db,
            {
                "cod_municipio": 1234567,
                "cod_comunidade_rural": None,
                "nome_localidade_informada": "Comunidade Inicial",
            },
            permitir_criar=True,
        )
        self.assertEqual(codigo, 1234567001)
        self.assertTrue(criada)
        self.assertEqual(
            db.execute.await_args_list[2].args[1], {"cod_municipio": 1234567}
        )

    async def test_duas_comunidades_do_mesmo_municipio_recebem_codigos_distintos(self):
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(), _Result(scalars=[]), _Result(scalar=1300086003), _Result(),
            _Result(), _Result(scalars=[]), _Result(scalar=1300086004), _Result(),
        ]
        codigos = []
        for nome in ("Comunidade A", "Comunidade B"):
            codigo, criada = await _resolver_comunidade(
                db,
                {
                    "cod_municipio": 1300086,
                    "cod_comunidade_rural": None,
                    "nome_localidade_informada": nome,
                },
                permitir_criar=True,
            )
            self.assertTrue(criada)
            codigos.append(codigo)
        self.assertEqual(codigos, [1300086003, 1300086004])

    async def test_adiciona_localidade_nova_com_funcao_por_municipio_e_auditoria(self):
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(),                 # advisory lock
            _Result(scalars=[]),       # busca normalizada
            _Result(scalar=1300086003),  # função por município
            _Result(),                 # cria comunidade territorial
            _Result(scalar=None),      # busca quantidade no vínculo
            _Result(scalar=None),      # verifica vínculo com quantidade NULL
            _Result(scalar=1),         # cria vínculo
        ]
        item = {
            "acao_sugerida": "adicionar",
            "cod_municipio": 1300086,
            "cod_comunidade_rural": None,
            "nome_localidade_informada": "  Comunidade Nova  ",
            "localidade": "Comunidade Nova",
            "qtde_familias_ben_sugerida": 35,
        }
        detalhe = await _aplicar_localidade(db, _revisao(), item)
        self.assertEqual(detalhe["resultado"], "adicionado")
        self.assertEqual(detalhe["chave"]["cod_comunidade_rural"], 1300086003)
        self.assertEqual(detalhe["chave"]["cod_municipio"], 1300086)
        self.assertEqual(detalhe["chave"]["nome_comunidade_rural"], "Comunidade Nova")
        self.assertTrue(detalhe["valores_novos"]["comunidade_criada"])
        sql_executado = "\n".join(str(call.args[0]) for call in db.execute.await_args_list)
        self.assertIn("fn_proximo_cod_comunidade_rural(:cod_municipio)", sql_executado)
        self.assertNotIn("nextval", sql_executado)
        chamada_funcao = db.execute.await_args_list[2]
        self.assertEqual(chamada_funcao.args[1], {"cod_municipio": 1300086})

    async def test_reutiliza_comunidade_equivalente_sem_criar_duplicata(self):
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(),
            _Result(scalars=[77]),
            _Result(scalar=20),
        ]
        item = {
            "acao_sugerida": "adicionar",
            "cod_municipio": 1,
            "cod_comunidade_rural": None,
            "nome_localidade_informada": "comunidade a",
            "localidade": "Comunidade A",
            "qtde_familias_ben_sugerida": 20,
        }
        detalhe = await _aplicar_localidade(db, _revisao(), item)
        self.assertEqual(detalhe["resultado"], "ja_existente")
        self.assertEqual(detalhe["chave"]["cod_comunidade_rural"], 77)
        self.assertFalse(detalhe["valores_novos"]["comunidade_criada"])
        self.assertTrue(detalhe["valores_novos"]["comunidade_reutilizada"])
        sql_executado = "\n".join(str(call.args[0]) for call in db.execute.await_args_list)
        self.assertNotIn("fn_proximo_cod_comunidade_rural", sql_executado)

    async def test_reutiliza_comunidade_e_cria_somente_o_vinculo(self):
        db = AsyncMock()
        db.execute.side_effect = [
            _Result(),
            _Result(scalars=[1300086002]),
            _Result(scalar=None),
            _Result(scalar=None),
            _Result(scalar=1),
        ]
        detalhe = await _aplicar_localidade(
            db,
            _revisao(),
            {
                "acao_sugerida": "adicionar",
                "cod_municipio": 1300086,
                "cod_comunidade_rural": None,
                "nome_localidade_informada": "  comunidade são josé  ",
                "localidade": "Comunidade São José",
                "qtde_familias_ben_sugerida": 20,
            },
        )
        self.assertEqual(detalhe["resultado"], "adicionado")
        self.assertFalse(detalhe["valores_novos"]["comunidade_criada"])
        self.assertTrue(detalhe["valores_novos"]["comunidade_reutilizada"])
        sql_executado = "\n".join(str(call.args[0]) for call in db.execute.await_args_list)
        self.assertNotIn("fn_proximo_cod_comunidade_rural", sql_executado)
        self.assertEqual(sql_executado.count("INSERT INTO territorio.tb_comunidade_rural"), 0)

    async def test_corrige_quantidade_no_vinculo_sem_alterar_cadastro_territorial(self):
        db = AsyncMock()
        db.execute.side_effect = [_Result(scalar=22), _Result()]
        item = {
            "acao_sugerida": "corrigir",
            "cod_municipio": 1,
            "cod_comunidade_rural": 77,
            "nome_localidade_informada": None,
            "localidade": "Comunidade A",
            "qtde_familias_ben_sugerida": 30,
        }
        detalhe = await _aplicar_localidade(db, _revisao(), item)
        self.assertEqual(detalhe["resultado"], "corrigido")
        sql_update = str(db.execute.await_args_list[1].args[0])
        self.assertIn("SET qtde_familias_ben", sql_update)
        self.assertNotIn("territorio.tb_comunidade_rural", sql_update)

    async def test_remove_apenas_associacao_da_localidade(self):
        db = AsyncMock()
        db.execute.side_effect = [_Result(scalar=12), _Result()]
        item = {
            "acao_sugerida": "remover",
            "cod_municipio": 1,
            "cod_comunidade_rural": 77,
            "nome_localidade_informada": None,
            "localidade": "Comunidade A",
            "qtde_familias_ben_sugerida": None,
        }
        detalhe = await _aplicar_localidade(db, _revisao(), item)
        self.assertEqual(detalhe["resultado"], "removido")
        sql_delete = str(db.execute.await_args_list[1].args[0])
        self.assertIn("DELETE FROM instrumento.tb_contrato_repasse_comunidade_rural", sql_delete)
        self.assertNotIn("DELETE FROM territorio.tb_comunidade_rural", sql_delete)

    async def test_remover_ausente_registra_sem_operacao(self):
        db = AsyncMock()
        db.execute.return_value = _Result(scalar=None)
        detalhe = await _aplicar_municipio(
            db, _revisao(), {"acao_sugerida": "remover", "cod_municipio": 1}
        )
        self.assertEqual(detalhe["resultado"], "ja_ausente")
        self.assertEqual(db.execute.await_count, 1)


class IntegridadeEstruturalTest(unittest.TestCase):
    def test_erro_de_limite_de_comunidades_tem_mensagem_compreensivel(self):
        erro = SQLAlchemyError(
            "O município 1300086 já atingiu o limite de 999 comunidades rurais cadastradas."
        )
        mensagem = _mensagem_limite_comunidades(erro)
        self.assertIsNotNone(mensagem)
        self.assertIn("limite de 999 comunidades rurais", mensagem)
        self.assertIn("nenhuma alteração foi confirmada", mensagem)

    def test_aplicacao_usa_transacao_lock_e_revalidacao(self):
        fonte = inspect.getsource(aplicar_revisao)
        self.assertIn("async with db.begin()", fonte)
        self.assertIn("bloquear=True", fonte)
        self.assertIn("pg_advisory_xact_lock", fonte)
        self.assertIn("_validar", fonte)
        self.assertIn("aplicado_em IS NULL", fonte)
        self.assertIn("await db.rollback()", fonte)
        self.assertLess(
            fonte.index("SET aplicado_em = NOW()"),
            fonte.index("_atualizar_views_consolidadas"),
        )
        self.assertLess(
            fonte.index("SET status = 'sucesso'"),
            fonte.index("_atualizar_views_consolidadas"),
        )

    def test_avaliacoes_nao_escrevem_nas_fontes_externas(self):
        fonte = inspect.getsource(aplicar_revisao)
        self.assertNotIn("UPDATE obrasgov.tb_projeto_investimento", fonte)
        self.assertNotIn("vw_investimento_saneamento", fonte)

    def test_resumo_distingue_resultados_sem_operacao(self):
        resumo = _resumir([
            {"entidade": "municipio", "resultado": "adicionado"},
            {"entidade": "municipio", "resultado": "ja_existente"},
            {"entidade": "localidade", "resultado": "ja_ausente"},
        ])
        self.assertEqual(resumo.municipios["adicionado"], 1)
        self.assertEqual(resumo.municipios["ja_existente"], 1)
        self.assertEqual(resumo.localidades["ja_ausente"], 1)

    def test_resumo_inclui_avaliacoes_sem_trata_las_como_escrita_na_fonte(self):
        resumo = _resumir([
            {"entidade": "publico_alvo", "resultado": "incorporado"},
            {"entidade": "obra", "resultado": "incorporado"},
        ])
        self.assertEqual(resumo.publico_alvo["incorporado"], 1)
        self.assertEqual(resumo.obras["incorporado"], 1)

    def test_auditoria_de_obra_preserva_identidade_do_instrumento_municipio_obra(self):
        detalhe = _detalhe_obra(_revisao(), {
            "id_obra": "OBRA-X", "cod_municipio": 5300108,
            "municipio": "Brasília", "uf": "DF", "descricao": "Obra X",
            "orgao": None, "link_transferegov": None, "link_obrasgov": None,
            "relacao_instrumento": "possivel_sobreposicao",
            "confirmacao_status": "sobreposicao_confirmada", "justificativa": "Conferida",
        })
        self.assertEqual(detalhe["chave"]["id_obra"], "OBRA-X")
        self.assertEqual(detalhe["chave"]["identificador_instrumento"], "948494")
        self.assertEqual(detalhe["chave"]["cod_municipio"], 5300108)

    def test_auditoria_publico_alvo_aceita_campos_nao_conferidos(self):
        detalhe = _detalhe_publico_alvo({
            "id_projeto_investimento": "PROJ-1",
            "status_populacao_beneficiada": "ok",
            "status_desc_populacao_beneficiada": None,
            "status_correcao_solicitada": None,
            "observacao_publico_alvo": None,
        })
        self.assertIsNone(detalhe["valores_anteriores"])
        self.assertIsNone(detalhe["valores_novos"]["status_desc_populacao_beneficiada"])

    def test_consulta_administrativa_nao_exige_snapshots_ausentes_no_schema(self):
        fonte = inspect.getsource(_carregar_revisao)
        self.assertNotIn("populacao_beneficiada_original", fonte)
        self.assertNotIn("desc_populacao_beneficiada_original", fonte)

    def test_lock_logico_tem_chave_estavel(self):
        self.assertEqual(_advisory_key("instrumento:1"), _advisory_key("instrumento:1"))
        self.assertNotEqual(_advisory_key("instrumento:1"), _advisory_key("instrumento:2"))

    def test_migration_corretiva_cria_funcao_por_municipio_e_remove_sequence(self):
        migration = (
            Path(__file__).parents[1]
            / "migrations"
            / "20260824_01_corrige_codigo_comunidade_rural.sql"
        ).read_text(encoding="utf-8")
        self.assertIn("DROP SEQUENCE IF EXISTS territorio.seq_comunidade_rural_painel_dsr", migration)
        self.assertIn("fn_proximo_cod_comunidade_rural", migration)
        self.assertIn("pg_advisory_xact_lock(p_cod_municipio::BIGINT)", migration)
        self.assertIn("v_prefixo := p_cod_municipio::BIGINT * 1000", migration)
        self.assertIn("v_proximo_codigo := v_prefixo + 1", migration)
        self.assertIn("v_maior_codigo + 1", migration)
        self.assertIn("limite de 999 comunidades rurais", migration)


class RefreshViewsTest(unittest.IsolatedAsyncioTestCase):
    async def test_refresh_apenas_das_secoes_presentes_e_uma_vez_por_view(self):
        db = AsyncMock()
        await _atualizar_views_consolidadas(
            db, possui_publico_alvo=True, possui_obras=True
        )
        sql = [str(call.args[0]) for call in db.execute.await_args_list]
        self.assertEqual(sql.count(
            "REFRESH MATERIALIZED VIEW obrasgov.vw_publico_alvo_revisado"
        ), 1)
        self.assertEqual(sql.count(
            "REFRESH MATERIALIZED VIEW instrumento.vw_obra_saneamento_revisada"
        ), 1)

    async def test_nao_faz_refresh_de_secao_ausente(self):
        db = AsyncMock()
        await _atualizar_views_consolidadas(
            db, possui_publico_alvo=False, possui_obras=True
        )
        sql = "\n".join(str(call.args[0]) for call in db.execute.await_args_list)
        self.assertNotIn("vw_publico_alvo_revisado", sql)
        self.assertIn("vw_obra_saneamento_revisada", sql)

    async def test_falha_de_refresh_nao_e_ocultada(self):
        db = AsyncMock()
        db.execute.side_effect = SQLAlchemyError("refresh indisponível")
        with self.assertRaises(SQLAlchemyError):
            await _atualizar_views_consolidadas(
                db, possui_publico_alvo=True, possui_obras=False
            )


class ReversaoAplicacaoTest(unittest.IsolatedAsyncioTestCase):
    def _execucao(self, tipo="contrato_repasse", **updates):
        dados = {
            "id_execucao": 6,
            "status": "sucesso",
            "tipo_instrumento": tipo,
            "nr_instrumento": "948494",
            "nr_proposta": "123456",
            "nr_ted": None,
            "aplicado_em": datetime(2026, 8, 25, 14, 40),
        }
        dados.update(updates)
        return dados

    async def test_inclusao_municipio_e_desfeita_removendo_vinculo(self):
        db = AsyncMock()
        detalhe = {
            "entidade": "municipio", "acao": "adicionar", "resultado": "adicionado",
            "chave": {"nr_proposta": "123456", "cod_municipio": 1},
            "valores_anteriores": {"vinculado": False},
            "valores_novos": {"vinculado": True}, "mensagem": "Município A",
        }
        reversao = await _reverter_detalhe(db, self._execucao(), detalhe)
        self.assertIn("DELETE FROM instrumento.tb_contrato_repasse_municipio", str(db.execute.await_args.args[0]))
        self.assertEqual(reversao["acao"], "desfazer_adicao")
        self.assertEqual(reversao["resultado"], "revertido")

    async def test_remocao_municipio_e_desfeita_recriando_vinculo(self):
        db = AsyncMock()
        detalhe = {
            "entidade": "municipio", "acao": "remover", "resultado": "removido",
            "chave": {"nr_proposta": "123456", "cod_municipio": 1},
            "valores_anteriores": {"vinculado": True},
            "valores_novos": {"vinculado": False}, "mensagem": "Município A",
        }
        await _reverter_detalhe(db, self._execucao(), detalhe)
        self.assertIn("INSERT INTO instrumento.tb_contrato_repasse_municipio", str(db.execute.await_args.args[0]))

    async def test_inclusao_localidade_remove_so_vinculo_e_preserva_comunidade(self):
        db = AsyncMock()
        detalhe = {
            "entidade": "localidade", "acao": "adicionar", "resultado": "adicionado",
            "chave": {"nr_proposta": "123456", "cod_comunidade_rural": 77},
            "valores_anteriores": {"vinculado": False, "qtde_familias_ben": None},
            "valores_novos": {"vinculado": True, "qtde_familias_ben": 20, "comunidade_criada": True},
            "mensagem": "Comunidade A",
        }
        await _reverter_detalhe(db, self._execucao(), detalhe)
        sql = str(db.execute.await_args.args[0])
        self.assertIn("DELETE FROM instrumento.tb_contrato_repasse_comunidade_rural", sql)
        self.assertNotIn("territorio.tb_comunidade_rural", sql)

    async def test_remocao_localidade_recria_vinculo_e_quantidade(self):
        db = AsyncMock()
        detalhe = {
            "entidade": "localidade", "acao": "remover", "resultado": "removido",
            "chave": {"nr_proposta": "123456", "cod_comunidade_rural": 77},
            "valores_anteriores": {"vinculado": True, "qtde_familias_ben": 30},
            "valores_novos": {"vinculado": False, "qtde_familias_ben": 30},
            "mensagem": "Comunidade A",
        }
        await _reverter_detalhe(db, self._execucao(), detalhe)
        self.assertIn("INSERT INTO instrumento.tb_contrato_repasse_comunidade_rural", str(db.execute.await_args.args[0]))
        self.assertEqual(db.execute.await_args.args[1]["quantidade"], 30)

    async def test_correcao_restaura_quantidade_anterior(self):
        db = AsyncMock()
        detalhe = {
            "entidade": "localidade", "acao": "corrigir", "resultado": "corrigido",
            "chave": {"nr_proposta": "123456", "cod_comunidade_rural": 77},
            "valores_anteriores": {"vinculado": True, "qtde_familias_ben": 30},
            "valores_novos": {"vinculado": True, "qtde_familias_ben": 20},
            "mensagem": "Comunidade A",
        }
        await _reverter_detalhe(db, self._execucao(), detalhe)
        self.assertEqual(db.execute.await_count, 1)
        self.assertIn("UPDATE instrumento.tb_contrato_repasse_comunidade_rural", str(db.execute.await_args.args[0]))
        self.assertEqual(db.execute.await_args.args[1]["quantidade"], 30)

    async def test_aplicacao_posterior_bloqueia_cancelamento(self):
        db = AsyncMock()
        db.execute.return_value = _Result(scalar=1)
        validacao = await _validar_cancelamento_carregado(db, self._execucao(), [])
        self.assertFalse(validacao.pode_cancelar)
        self.assertIn("aplicação posterior vigente", validacao.motivo_bloqueio)

    async def test_consulta_aplicacao_posterior_parametriza_nr_ted_com_cast(self):
        db = AsyncMock()
        db.execute.return_value = _Result(scalar=None)

        existe = await _existe_aplicacao_posterior(
            db, self._execucao(tipo="ted", nr_instrumento=None, nr_ted=123)
        )

        consulta, parametros = db.execute.await_args.args
        sql = str(consulta)
        self.assertFalse(existe)
        self.assertIn("CAST(:nr_ted AS TEXT)", sql)
        self.assertNotIn(":nr_ted::TEXT", sql)
        self.assertEqual(set(consulta._bindparams), {
            "id_execucao", "tipo_instrumento", "nr_instrumento", "nr_ted", "aplicado_em"
        })
        self.assertEqual(parametros["nr_ted"], 123)

    async def test_divergencia_de_familias_bloqueia_toda_reversao(self):
        db = AsyncMock()
        db.execute.side_effect = [_Result(scalar=None), _Result(rows=[{"qtde_familias_ben": 25}])]
        detalhe = {
            "entidade": "localidade", "acao": "corrigir", "resultado": "corrigido",
            "chave": {"nr_proposta": "123456", "cod_comunidade_rural": 77},
            "valores_anteriores": {"vinculado": True, "qtde_familias_ben": 30},
            "valores_novos": {"vinculado": True, "qtde_familias_ben": 20},
            "mensagem": "Comunidade A",
        }
        validacao = await _validar_cancelamento_carregado(db, self._execucao(), [detalhe])
        self.assertFalse(validacao.pode_cancelar)
        self.assertIn("quantidade de famílias", validacao.motivo_bloqueio)

    async def test_cancelamento_repetido_e_identificado_sem_reverter(self):
        db = AsyncMock()
        validacao = await _validar_cancelamento_carregado(
            db, self._execucao(status="cancelado"), []
        )
        self.assertEqual(validacao.status, "ja_cancelado")
        db.execute.assert_not_awaited()

    def test_cancelamento_e_transacional_revalida_e_marca_so_ao_final(self):
        fonte = inspect.getsource(cancelar_aplicacao)
        self.assertIn("async with db.begin()", fonte)
        self.assertIn("bloquear=True", fonte)
        self.assertIn("pg_advisory_xact_lock", fonte)
        self.assertIn("bloquear_estado=True", fonte)
        self.assertIn("status = 'cancelado'", fonte)
        self.assertIn("await db.rollback()", fonte)
        self.assertLess(fonte.index("_reverter_detalhe"), fonte.index("status = 'cancelado'"))

    def test_migration_atualiza_status_metadados_e_views(self):
        migration = (
            Path(__file__).parents[1]
            / "migrations"
            / "20260825_01_cancelamento_aplicacao_revisao.sql"
        ).read_text(encoding="utf-8")
        self.assertIn("'cancelado'", migration)
        self.assertIn("cancelado_em TIMESTAMP", migration)
        self.assertIn("id_usuario_cancelamento INTEGER", migration)
        self.assertIn("motivo_cancelamento TEXT", migration)
        self.assertEqual(migration.count("execucao.status = 'sucesso'"), 2)
        self.assertIn("vw_publico_alvo_revisado", migration)
        self.assertIn("vw_obra_saneamento_revisada", migration)


if __name__ == "__main__":
    unittest.main()
