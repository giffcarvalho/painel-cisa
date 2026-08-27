import unittest
from datetime import datetime
from unittest.mock import AsyncMock, patch

from app.api.revisao_instrumento import _listar_historico_revisoes
from app.schemas.revisao_instrumento import InstrumentoRevisaoInfo


class _Mappings:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return self.rows


class _Result:
    def __init__(self, rows=None, scalar=None):
        self.rows = rows or []
        self.scalar = scalar

    def mappings(self):
        return _Mappings(self.rows)

    def scalar_one(self):
        return self.scalar


def _revisao(id_revisao, id_usuario, nome, nr_instrumento="948494"):
    agora = datetime(2026, 8, 17, 15, 48)
    return {
        "id_revisao": id_revisao,
        "id_revisao_anterior": None,
        "identificador_busca": nr_instrumento,
        "tipo_instrumento": "contrato_repasse",
        "nr_instrumento": nr_instrumento,
        "nr_proposta": None,
        "nr_ted": None,
        "objeto": "Implantação de melhorias sanitárias",
        "status": "enviado",
        "criado_em": agora,
        "atualizado_em": agora,
        "enviado_em": agora,
        "aplicado_em": None,
        "id_usuario": id_usuario,
        "usuario_nome": nome,
    }


class HistoricoRevisoesTest(unittest.IsolatedAsyncioTestCase):
    async def test_historico_pessoal_filtra_usuario_e_busca_no_backend(self):
        execute = AsyncMock(
            side_effect=[_Result(scalar=1), _Result(rows=[_revisao(2, 20, "Usuário 2.0")])]
        )
        with patch("app.api.revisao_instrumento._execute_query", execute):
            resposta = await _listar_historico_revisoes(
                AsyncMock(), pagina=1, limite=20, id_usuario=20, busca="948494"
            )

        count_sql, count_params = execute.await_args_list[0].args[1:3]
        list_sql, list_params = execute.await_args_list[1].args[1:3]
        self.assertIn("r.id_usuario = :id_usuario", count_sql)
        self.assertIn("r.status = 'enviado'", count_sql)
        self.assertEqual(count_params["id_usuario"], 20)
        self.assertEqual(count_params["busca"], "%948494%")
        self.assertIn("ORDER BY r.enviado_em DESC, r.id_revisao DESC", list_sql)
        self.assertEqual(list_params["id_usuario"], 20)
        self.assertEqual(resposta.data[0].id_revisao, 2)

    async def test_historico_instrumento_nao_filtra_autor(self):
        instrumento = InstrumentoRevisaoInfo(
            identificador_busca="948494",
            tipo_instrumento="contrato_repasse",
            nr_instrumento="948494",
            objeto="Implantação de melhorias sanitárias",
        )
        execute = AsyncMock(
            side_effect=[
                _Result(scalar=2),
                _Result(
                    rows=[
                        _revisao(8, 20, "Usuário 2.0"),
                        _revisao(5, 10, "Usuário 1.0"),
                    ]
                ),
            ]
        )
        with patch("app.api.revisao_instrumento._execute_query", execute):
            resposta = await _listar_historico_revisoes(
                AsyncMock(), pagina=1, limite=20, instrumento=instrumento
            )

        count_sql, count_params = execute.await_args_list[0].args[1:3]
        self.assertNotIn("r.id_usuario = :id_usuario", count_sql)
        self.assertEqual(count_params["nr_instrumento"], "948494")
        self.assertEqual(
            [item.usuario.nome for item in resposta.data],
            ["Usuário 2.0", "Usuário 1.0"],
        )
        self.assertEqual(resposta.total, 2)


if __name__ == "__main__":
    unittest.main()
