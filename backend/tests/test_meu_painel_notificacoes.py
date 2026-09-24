import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

from app.api.notificacoes import listar_notificacoes, marcar_notificacao_lida
from app.schemas.auth import UsuarioAutenticado
from app.services.notificacoes import (
    criar_notificacao,
    identificador_instrumento,
    montar_mensagem_notificacao,
)


ROOT = Path(__file__).resolve().parents[1]


class NotificacoesTest(unittest.IsolatedAsyncioTestCase):
    async def test_insert_e_idempotente_e_nao_faz_commit(self):
        db = AsyncMock()

        await criar_notificacao(
            db,
            id_usuario=7,
            tipo="revisao_enviada",
            chave_evento="revisao_enviada:12",
            id_revisao=12,
        )

        sql, parametros = db.execute.await_args.args
        self.assertIn("ON CONFLICT (id_usuario, chave_evento) DO NOTHING", str(sql))
        self.assertEqual(parametros["id_usuario"], 7)
        self.assertEqual(parametros["chave_evento"], "revisao_enviada:12")
        self.assertEqual(parametros["id_revisao"], 12)
        self.assertNotIn("mensagem", parametros)
        self.assertNotIn("id_execucao", parametros)
        self.assertNotIn("id_solicitacao_cancelamento", parametros)
        db.commit.assert_not_awaited()

    def test_identificador_canonico_prioriza_ted_ou_instrumento(self):
        self.assertEqual(
            identificador_instrumento({"tipo_instrumento": "ted", "nr_ted": 123}),
            "123",
        )
        self.assertEqual(
            identificador_instrumento({
                "tipo_instrumento": "contrato_repasse",
                "nr_instrumento": "967107",
                "nr_proposta": "1",
            }),
            "967107",
        )

    def test_mensagens_sao_montadas_com_dados_da_revisao(self):
        revisao = {
            "id_revisao": 12,
            "tipo_instrumento": "contrato_repasse",
            "nr_instrumento": "967107",
        }
        self.assertEqual(
            montar_mensagem_notificacao("revisao_enviada", revisao),
            "Revisão 12 do instrumento 967107 enviada com sucesso.",
        )
        self.assertIn(
            "foi rejeitada",
            montar_mensagem_notificacao("cancelamento_rejeitado", revisao),
        )

    async def test_listagem_monta_mensagem_e_limita_por_usuario(self):
        agora = datetime.now(timezone.utc)

        class _Result:
            def __init__(self, *, escalar=None, linhas=None):
                self.escalar = escalar
                self.linhas = linhas or []

            def scalar_one(self):
                return self.escalar

            def mappings(self):
                return self

            def all(self):
                return self.linhas

        db = AsyncMock()
        db.execute.side_effect = [
            _Result(escalar=1),
            _Result(linhas=[{
                "id_notificacao": 5,
                "tipo": "revisao_aplicada",
                "id_revisao": 12,
                "criado_em": agora,
                "lido_em": None,
                "tipo_instrumento": "contrato_repasse",
                "nr_instrumento": "967107",
                "nr_proposta": "1/2026",
                "nr_ted": None,
                "identificador_busca": "967107",
            }]),
            _Result(escalar=1),
        ]
        usuario = UsuarioAutenticado(
            id_usuario=7,
            nome="Técnica",
            email="tecnica@example.gov.br",
            perfil="tecnico",
        )

        resposta = await listar_notificacoes(1, 5, usuario, db)

        self.assertEqual(resposta.limite, 5)
        self.assertEqual(len(resposta.data), 1)
        self.assertEqual(
            resposta.data[0].mensagem,
            "Revisão 12 do instrumento 967107 foi aplicada ao banco.",
        )
        consulta = str(db.execute.await_args_list[1].args[0])
        parametros = db.execute.await_args_list[1].args[1]
        self.assertNotIn("n.mensagem", consulta)
        self.assertNotIn("n.id_execucao", consulta)
        self.assertNotIn("n.id_solicitacao_cancelamento", consulta)
        self.assertEqual(parametros["id_usuario"], 7)
        self.assertEqual(parametros["limite"], 5)

    async def test_marcar_lida_preserva_data_e_filtra_usuario(self):
        db = AsyncMock()
        resultado_update = SimpleNamespace(scalar_one_or_none=lambda: 5)
        resultado_contagem = SimpleNamespace(scalar_one=lambda: 0)
        db.execute.side_effect = [resultado_update, resultado_contagem]
        usuario = UsuarioAutenticado(
            id_usuario=7,
            nome="Técnica",
            email="tecnica@example.gov.br",
            perfil="tecnico",
        )

        resposta = await marcar_notificacao_lida(5, usuario, db)

        consulta = str(db.execute.await_args_list[0].args[0])
        parametros = db.execute.await_args_list[0].args[1]
        self.assertIn("COALESCE(lido_em, NOW())", consulta)
        self.assertIn("id_usuario = :id_usuario", consulta)
        self.assertEqual(parametros, {"id_notificacao": 5, "id_usuario": 7})
        self.assertEqual(resposta.nao_lidas, 0)
        db.commit.assert_awaited_once()

    def test_endpoints_pessoais_usam_usuario_autenticado(self):
        api = (ROOT / "app" / "api" / "notificacoes.py").read_text(encoding="utf-8")
        painel = (ROOT / "app" / "api" / "meu_painel.py").read_text(encoding="utf-8")
        self.assertIn("Depends(obter_usuario_atual)", api)
        self.assertIn("AND id_usuario = :id_usuario", api)
        self.assertIn("Depends(obter_usuario_atual)", painel)
        self.assertIn("ui.ativo IS TRUE", (ROOT / "app" / "api" / "revisao_instrumento.py").read_text(encoding="utf-8"))

    def test_notificacoes_sao_geradas_em_eventos_e_nao_em_gets(self):
        revisao = (ROOT / "app" / "api" / "revisao_instrumento.py").read_text(encoding="utf-8")
        aplicacao = (ROOT / "app" / "services" / "aplicacao_revisoes.py").read_text(encoding="utf-8")
        self.assertIn('chave_evento=f"revisao_enviada:{id_revisao}"', revisao)
        self.assertIn('tipo="revisao_aplicada"', aplicacao)
        self.assertIn('tipo="cancelamento_rejeitado"', aplicacao)
        self.assertNotIn("criar_notificacao", (ROOT / "app" / "api" / "notificacoes.py").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
