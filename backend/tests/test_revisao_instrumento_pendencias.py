import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.api.revisao_instrumento import _buscar_revisoes_pendentes_aplicacao
from app.schemas.revisao_instrumento import RevisaoInstrumentoBuscaResponse


class _Mappings:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class _Result:
    def __init__(self, rows):
        self._rows = rows

    def mappings(self):
        return _Mappings(self._rows)


class RevisoesPendentesAplicacaoTest(unittest.IsolatedAsyncioTestCase):
    async def test_retorna_a_mais_recente_e_a_quantidade_sem_filtro_de_usuario(self):
        rows = [
            {
                "id_revisao": 12,
                "id_usuario": 7,
                "status": "enviado",
                "enviado_em": "2026-08-12T11:00:00",
                "aplicado_em": None,
                "responsavel_nome": "Usuário A",
            },
            {
                "id_revisao": 10,
                "id_usuario": 8,
                "status": "enviado",
                "enviado_em": "2026-08-11T10:00:00",
                "aplicado_em": None,
                "responsavel_nome": "Usuário B",
            },
        ]
        instrumento = SimpleNamespace(
            tipo_instrumento="contrato_repasse",
            nr_instrumento=" 123 ",
            nr_ted=None,
        )

        with patch(
            "app.api.revisao_instrumento._execute_query",
            new=AsyncMock(return_value=_Result(rows)),
        ) as execute:
            revisao, quantidade = await _buscar_revisoes_pendentes_aplicacao(
                AsyncMock(), instrumento
            )

        sql, params = execute.await_args.args[1:3]
        self.assertEqual(revisao["id_revisao"], 12)
        self.assertEqual(revisao["responsavel_nome"], "Usuário A")
        self.assertEqual(quantidade, 2)
        self.assertNotIn("r.id_usuario = :id_usuario", sql)
        self.assertNotIn("id_usuario", params)
        self.assertNotIn("LIMIT 1", sql)
        self.assertIn("r.enviado_em IS NOT NULL", sql)
        self.assertIn("r.aplicado_em IS NULL", sql)
        self.assertIn("NULLIF(BTRIM(r.nr_instrumento), '')", sql)
        self.assertEqual(params["nr_instrumento"], " 123 ")

    async def test_identidade_ted_e_passada_separadamente(self):
        instrumento = SimpleNamespace(
            tipo_instrumento="ted",
            nr_instrumento=None,
            nr_ted=456,
        )

        with patch(
            "app.api.revisao_instrumento._execute_query",
            new=AsyncMock(return_value=_Result([])),
        ) as execute:
            revisao, quantidade = await _buscar_revisoes_pendentes_aplicacao(
                AsyncMock(), instrumento
            )

        sql, params = execute.await_args.args[1:3]
        self.assertIsNone(revisao)
        self.assertEqual(quantidade, 0)
        self.assertIn("r.nr_ted = :nr_ted", sql)
        self.assertEqual(params["tipo_instrumento"], "ted")
        self.assertEqual(params["nr_ted"], 456)

    def test_contrato_expoe_pendencia_global_separada_do_rascunho(self):
        campos = RevisaoInstrumentoBuscaResponse.model_fields

        self.assertIn("rascunho_global", campos)
        self.assertIn("rascunho_usuario", campos)
        self.assertIn("pode_editar_revisao", campos)
        self.assertIn("revisao_pendente_aplicacao", campos)
        self.assertIn("quantidade_revisoes_pendentes", campos)


if __name__ == "__main__":
    unittest.main()
