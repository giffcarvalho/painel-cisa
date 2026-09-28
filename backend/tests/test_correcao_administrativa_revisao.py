import unittest
from pathlib import Path
from unittest.mock import AsyncMock

from fastapi import HTTPException
from pydantic import ValidationError

from app.schemas.aplicacao_revisoes import (
    CorrecaoAdministrativaRevisao,
    EdicaoMunicipioItem,
)
from app.services.aplicacao_revisoes import _corrigir_itens_secao


class _Mappings:
    def __init__(self, row=None):
        self.row = row

    def one_or_none(self):
        return self.row


class _Result:
    def __init__(self, row=None):
        self.row = row

    def mappings(self):
        return _Mappings(self.row)


class SchemaCorrecaoTest(unittest.TestCase):
    def test_payload_vazio_e_campo_extra_sao_rejeitados(self):
        with self.assertRaises(ValidationError):
            CorrecaoAdministrativaRevisao()
        with self.assertRaises(ValidationError):
            EdicaoMunicipioItem(
                id_item=1,
                acao_sugerida="manter",
                cod_municipio=5300108,
            )
        with self.assertRaises(ValidationError):
            EdicaoMunicipioItem(id_item=1)

    def test_payload_parcial_preserva_distincao_entre_omitido_e_nulo(self):
        item = EdicaoMunicipioItem(id_item=1, justificativa=None)
        self.assertEqual(
            item.model_dump(exclude_unset=True),
            {"id_item": 1, "justificativa": None},
        )


class PersistenciaCorrecaoTest(unittest.IsolatedAsyncioTestCase):
    async def test_atualiza_por_id_e_revisao_e_audita_apenas_campo_alterado(self):
        db = AsyncMock()
        db.execute.side_effect = [
            _Result({"id_revisao": 853, "acao_sugerida": "manter", "justificativa": None}),
            _Result(),
            _Result(),
        ]

        quantidade = await _corrigir_itens_secao(
            db,
            id_revisao=853,
            id_usuario=7,
            nome_secao="municipios",
            itens=[EdicaoMunicipioItem(id_item=11, justificativa="Corrigida")],
        )

        self.assertEqual(quantidade, 1)
        update_sql = str(db.execute.await_args_list[1].args[0])
        update_params = db.execute.await_args_list[1].args[1]
        self.assertIn("UPDATE painel_dsr.tb_revisao_instrumento_municipio", update_sql)
        self.assertIn("id_revisao = :id_revisao", update_sql)
        self.assertNotIn("INSERT INTO painel_dsr.tb_revisao_instrumento_municipio", update_sql)
        self.assertEqual(update_params["id_revisao"], 853)
        self.assertEqual(update_params["id_item"], 11)

        audit_params = db.execute.await_args_list[2].args[1]
        self.assertEqual(audit_params["campo"], "justificativa")
        self.assertEqual(audit_params["valor_anterior"], "null")
        self.assertEqual(audit_params["valor_novo"], '"Corrigida"')

    async def test_rejeita_registro_que_nao_pertence_a_revisao(self):
        db = AsyncMock()
        db.execute.return_value = _Result(
            {"id_revisao": 999, "acao_sugerida": "manter", "justificativa": None}
        )

        with self.assertRaises(HTTPException) as contexto:
            await _corrigir_itens_secao(
                db,
                id_revisao=853,
                id_usuario=7,
                nome_secao="municipios",
                itens=[EdicaoMunicipioItem(id_item=11, justificativa="Corrigida")],
            )

        self.assertEqual(contexto.exception.status_code, 404)
        self.assertEqual(db.execute.await_count, 1)


class MigrationCorrecaoTest(unittest.TestCase):
    def test_migration_mantem_trigger_e_limita_excecao_a_update_transacional(self):
        migration = (
            Path(__file__).parents[1]
            / "migrations"
            / "20260928_01_correcao_administrativa_revisao.sql"
        ).read_text(encoding="utf-8")

        self.assertIn("tb_auditoria_correcao_revisao", migration)
        self.assertIn("current_setting('painel_dsr.edicao_admin_revisao', true)", migration)
        self.assertIn("TG_OP = 'UPDATE'", migration)
        self.assertIn("OLD.id_revisao = NEW.id_revisao", migration)
        self.assertIn("v_aplicado_em IS NULL", migration)
        self.assertIn("BEFORE INSERT OR DELETE OR UPDATE", migration)


class InterfaceCorrecaoTest(unittest.TestCase):
    def test_edicao_e_aditiva_ao_fluxo_de_aplicacao(self):
        raiz = Path(__file__).parents[2] / "frontend" / "src"
        detalhe = (
            raiz / "components" / "aplicacao-revisoes" / "DetalhesRevisao.jsx"
        ).read_text(encoding="utf-8")
        pagina = (
            raiz / "pages" / "admin" / "aplicacao-revisoes" / "AplicacaoRevisoes.jsx"
        ).read_text(encoding="utf-8")
        api = (raiz / "api" / "aplicacaoRevisoes.js").read_text(encoding="utf-8")

        self.assertIn("Editar revisão", detalhe)
        self.assertIn("Aplicar revisão", detalhe)
        self.assertIn("ModalEditarRevisao", pagina)
        self.assertIn("api.patch", api)


if __name__ == "__main__":
    unittest.main()
