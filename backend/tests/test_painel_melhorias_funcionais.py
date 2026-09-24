import unittest
from pathlib import Path
from unittest.mock import AsyncMock

from fastapi import HTTPException

from app.api.meu_painel import _pendencias_coordenadas
from app.api.revisao_instrumento import cancelar_rascunho
from app.schemas.auth import UsuarioAutenticado
from app.services.notificacoes import criar_notificacoes_administradores


ROOT = Path(__file__).resolve().parents[1]


class _MappingsResult:
    def __init__(self, rows):
        self.rows = rows

    def mappings(self):
        return self

    def all(self):
        return self.rows

    def one_or_none(self):
        return self.rows[0] if self.rows else None


class _Transaction:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return False


class _DraftDb:
    def __init__(self, revisao):
        self.revisao = revisao
        self.sql = []
        self.rollbacks = 0

    async def rollback(self):
        self.rollbacks += 1

    def begin(self):
        return _Transaction()

    async def execute(self, statement, params):
        sql = str(statement)
        self.sql.append(sql)
        if "SELECT id_revisao, id_usuario, status" in sql:
            return _MappingsResult([self.revisao] if self.revisao else [])
        return _MappingsResult([])


class CoordenadasPendentesTest(unittest.IsolatedAsyncioTestCase):
    async def test_usa_ultima_analise_e_agrega_em_uma_consulta(self):
        db = AsyncMock()
        db.execute.return_value = _MappingsResult([
            {"nr_instrumento": "123", "nr_proposta": "9/2026", "cod_tci": "TCI-1", "total": 9, "pendentes": 7}
        ])

        totais = await _pendencias_coordenadas(db, ["123"])

        self.assertEqual(totais["123"], 7)
        sql = str(db.execute.await_args.args[0])
        self.assertIn("DISTINCT ON (rc.id_coordenada)", sql)
        self.assertIn("ua.situacao_analise = 'Sem análise'", sql)
        self.assertIn("ua.id_coordenada IS NULL", sql)
        self.assertEqual(db.execute.await_count, 1)


class NotificacoesAdministrativasTest(unittest.IsolatedAsyncioTestCase):
    async def test_insert_em_lote_e_idempotente_para_admins_ativos(self):
        db = AsyncMock()

        await criar_notificacoes_administradores(
            db,
            tipo="admin_revisao_enviada",
            chave_evento="revisao_enviada:12",
            id_revisao=12,
            excluir_ids={7},
        )

        sql, params = db.execute.await_args.args
        self.assertIn("LOWER(u.perfil) = 'admin'", str(sql))
        self.assertIn("u.ativo IS TRUE", str(sql))
        self.assertIn("ON CONFLICT (id_usuario, chave_evento) DO NOTHING", str(sql))
        self.assertEqual(params["excluir_ids"], [7])
        db.commit.assert_not_awaited()

    def test_tres_eventos_administrativos_estao_ligados_aos_fluxos_reais(self):
        revisao = (ROOT / "app/api/revisao_instrumento.py").read_text(encoding="utf-8")
        mapa = (ROOT / "app/api/mapa.py").read_text(encoding="utf-8")
        aplicacao = (ROOT / "app/services/aplicacao_revisoes.py").read_text(encoding="utf-8")
        self.assertIn('tipo="admin_revisao_enviada"', revisao)
        self.assertIn('tipo="admin_revisao_enviada"', mapa)
        self.assertIn('chave_evento=f"cancelamento_solicitado:{id_revisao}"', aplicacao)
        self.assertIn('chave_evento=f"revisao_cancelada:{execucao[\'id_revisao\']}"', aplicacao)


class CancelamentoRascunhoTest(unittest.IsolatedAsyncioTestCase):
    def usuario(self, id_usuario=7):
        return UsuarioAutenticado(
            id_usuario=id_usuario, nome="Técnica", email="t@example.gov.br", perfil="tecnico"
        )

    async def test_remove_somente_rascunho_proprio_e_todas_as_filhas(self):
        db = _DraftDb({"id_revisao": 12, "id_usuario": 7, "status": "rascunho"})

        resposta = await cancelar_rascunho(12, self.usuario(), db)

        self.assertEqual(resposta["id_revisao"], 12)
        self.assertIn("FOR UPDATE", db.sql[0])
        for tabela in (
            "tb_revisao_instrumento_coordenada",
            "tb_revisao_instrumento_publico_alvo",
            "tb_revisao_obra_saneamento",
            "tb_revisao_instrumento_localidade",
            "tb_revisao_instrumento_municipio",
        ):
            self.assertTrue(any(f"DELETE FROM painel_dsr.{tabela}" in sql for sql in db.sql))
        self.assertIn("status = 'rascunho'", db.sql[-1])

    async def test_rejeita_revisao_enviada_sem_apagar(self):
        db = _DraftDb({"id_revisao": 12, "id_usuario": 7, "status": "enviado"})

        with self.assertRaises(HTTPException) as raised:
            await cancelar_rascunho(12, self.usuario(), db)

        self.assertEqual(raised.exception.status_code, 409)
        self.assertFalse(any("DELETE FROM" in sql for sql in db.sql))


class InterfaceListasTest(unittest.TestCase):
    def test_controles_e_buscas_estao_presentes(self):
        painel = (ROOT.parent / "frontend/src/pages/meu-painel/MeuPainel.jsx").read_text(encoding="utf-8")
        drawer = (ROOT.parent / "frontend/src/components/admin/DetalhesUsuarioPanel.jsx").read_text(encoding="utf-8")
        self.assertIn("Cancelar rascunho", painel)
        self.assertIn("Coordenadas", painel)
        for texto in (
            "Ver todos os instrumentos",
            "Buscar por nº do instrumento",
            "Ver todas as pendências",
            "Ver todas as revisões",
            "Mostrar menos",
        ):
            self.assertIn(texto, drawer)


if __name__ == "__main__":
    unittest.main()
