import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

from app.api.revisao_instrumento import (
    _buscar_rascunho_global,
    _obter_ou_criar_revisao,
    _rascunho_para_contrato,
)


class _Mappings:
    def __init__(self, row):
        self._row = row

    def one_or_none(self):
        return self._row


class _Result:
    def __init__(self, row):
        self._row = row

    def mappings(self):
        return _Mappings(self._row)


def _instrumento(tipo="contrato_repasse"):
    return SimpleNamespace(
        identificador_busca="123",
        tipo_instrumento=tipo,
        nr_instrumento=" 123 " if tipo != "ted" else None,
        nr_proposta="456" if tipo != "ted" else None,
        nr_ted=789 if tipo == "ted" else None,
    )


class RascunhoGlobalTest(unittest.IsolatedAsyncioTestCase):
    async def test_busca_global_nao_filtra_usuario_e_carrega_responsavel(self):
        row = {
            "id_revisao": 10,
            "id_usuario": 7,
            "responsavel_nome": "Usuário A",
            "status": "rascunho",
            "criado_em": "2026-08-13T09:00:00",
            "atualizado_em": "2026-08-13T10:00:00",
        }
        with patch(
            "app.api.revisao_instrumento._execute_query",
            new=AsyncMock(return_value=_Result(row)),
        ) as execute:
            result = await _buscar_rascunho_global(AsyncMock(), _instrumento())

        sql, params = execute.await_args.args[1:3]
        self.assertEqual(result["responsavel_nome"], "Usuário A")
        self.assertIn("JOIN painel_dsr.tb_usuario AS u", sql)
        self.assertNotIn("id_usuario = :id_usuario", sql)
        self.assertNotIn("id_usuario", params)
        self.assertIn("NULLIF(BTRIM(r.nr_instrumento), '')", sql)

    async def test_identidade_ted_usa_nr_ted(self):
        with patch(
            "app.api.revisao_instrumento._execute_query",
            new=AsyncMock(return_value=_Result(None)),
        ) as execute:
            await _buscar_rascunho_global(AsyncMock(), _instrumento("ted"))

        sql, params = execute.await_args.args[1:3]
        self.assertIn("r.nr_ted = :nr_ted", sql)
        self.assertEqual(params["nr_ted"], 789)

    async def test_outro_usuario_nao_pode_reutilizar_nem_criar_rascunho(self):
        draft = {
            "id_revisao": 10,
            "id_usuario": 7,
            "responsavel_nome": "Usuário A",
            "status": "rascunho",
        }
        db = AsyncMock()
        with patch(
            "app.api.revisao_instrumento._buscar_rascunho_global",
            new=AsyncMock(return_value=draft),
        ):
            with self.assertRaises(HTTPException) as raised:
                await _obter_ou_criar_revisao(db, _instrumento(), 8)

        self.assertEqual(raised.exception.status_code, 409)
        self.assertEqual(
            raised.exception.detail["mensagem"],
            "Já existe um rascunho em andamento para este instrumento.",
        )
        self.assertFalse(
            raised.exception.detail["rascunho_global"]["eh_autor"]
        )
        db.execute.assert_not_awaited()

    def test_autoria_e_calculada_para_cada_usuario(self):
        draft = {"id_revisao": 10, "id_usuario": 7}
        self.assertTrue(_rascunho_para_contrato(draft, 7)["eh_autor"])
        self.assertFalse(_rascunho_para_contrato(draft, 8)["eh_autor"])


if __name__ == "__main__":
    unittest.main()
