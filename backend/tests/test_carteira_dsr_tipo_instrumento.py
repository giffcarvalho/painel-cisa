import unittest
from decimal import Decimal
from unittest.mock import AsyncMock, patch

from app.api.carteira_dsr import get_valor_por_tipo


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


class _Response:
    def __init__(self):
        self.headers = {}


class TipoInstrumentoGraficoTest(unittest.IsolatedAsyncioTestCase):
    async def test_mantem_deduplicacao_e_retorna_quantidade_com_os_mesmos_filtros(self):
        rows = [
            {
                "tipo_instrumento": "Termo de Compromisso - Novo PAC",
                "valor_global": Decimal("3860000000"),
                "quantidade_instrumentos": 420,
            }
        ]
        execute = AsyncMock(return_value=_Result(rows))

        with (
            patch(
                "app.api.carteira_dsr._build_where",
                return_value=("WHERE uf IN (:uf_0)", {"uf_0": "DF"}),
            ),
            patch("app.api.carteira_dsr._execute_query", execute),
        ):
            resposta = await get_valor_por_tipo(
                response=_Response(), filtros=object(), db=AsyncMock()
            )

        sql, params = execute.await_args.args[1:3]
        self.assertIn("SELECT DISTINCT ON (nr_instrumento)", sql)
        self.assertIn("WHERE uf IN (:uf_0)", sql)
        self.assertIn(
            "COUNT(DISTINCT nr_instrumento) AS quantidade_instrumentos", sql
        )
        self.assertEqual(params, {"uf_0": "DF"})
        self.assertEqual(resposta.data[0].quantidade_instrumentos, 420)
        self.assertEqual(resposta.data[0].valor_global, Decimal("3860000000"))
        self.assertEqual(
            resposta.model_dump(mode="json"),
            {
                "data": [
                    {
                        "tipo_instrumento": "Termo de Compromisso - Novo PAC",
                        "valor_global": "3860000000",
                        "quantidade_instrumentos": 420,
                    }
                ]
            },
        )


if __name__ == "__main__":
    unittest.main()
