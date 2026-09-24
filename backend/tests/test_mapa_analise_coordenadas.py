import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.api.mapa import (
    _buscar_coordenadas_alteradas,
    _criar_revisao_instrumento,
    _persistir_coordenada_revisao,
    salvar_analise_coordenadas,
)
from app.schemas.filtrosMapa import AnaliseCoordenadasCreate, CoordenadaAnaliseCreate
from app.schemas.revisao_instrumento import InstrumentoRevisaoInfo


class _Mappings:
    def __init__(self, row):
        self.row = row

    def one(self):
        return self.row

    def all(self):
        return self.row


class _Result:
    def __init__(self, row):
        self.row = row

    def mappings(self):
        return _Mappings(self.row)


class _Db:
    def __init__(self, row=None):
        self.info = {}
        self.execute = AsyncMock(return_value=_Result(row if row is not None else {}))
        self.commit = AsyncMock()
        self.rollback = AsyncMock()


def _coordenadas(quantidade=1):
    return [
        CoordenadaAnaliseCreate(
            id_coordenada=indice,
            cod_tci="TCI-1",
            situacao_analise="Correta",
        )
        for indice in range(1, quantidade + 1)
    ]


class AnaliseCoordenadasPersistenciaTest(unittest.IsolatedAsyncioTestCase):
    def test_situacao_correcao_omitida_permanece_null(self):
        payload = AnaliseCoordenadasCreate(coordenadas=_coordenadas())

        self.assertIsNone(payload.situacao_correcao)

    def test_situacoes_correcao_existentes_sao_preservadas(self):
        for situacao in ("Sim", "Não", "Sem necessidade"):
            with self.subTest(situacao=situacao):
                payload = AnaliseCoordenadasCreate(
                    situacao_correcao=situacao,
                    coordenadas=_coordenadas(),
                )

                self.assertEqual(payload.situacao_correcao, situacao)

    def test_observacao_vazia_e_normalizada_para_null(self):
        payload = AnaliseCoordenadasCreate(
            observacao_coordenada="   ",
            coordenadas=_coordenadas(),
        )

        self.assertIsNone(payload.observacao_coordenada)

    async def test_criacao_da_revisao_mae_nao_grava_observacao_geral(self):
        db = _Db({"id_revisao": 10})
        instrumento = InstrumentoRevisaoInfo(
            identificador_busca="123",
            tipo_instrumento="contrato_repasse",
            nr_instrumento="123",
        )

        await _criar_revisao_instrumento(db, instrumento, 7)

        sql = str(db.execute.await_args.args[0])
        params = db.execute.await_args.args[1]
        self.assertNotIn("observacao_geral", sql)
        self.assertNotIn("observacao_geral", params)

    async def test_observacao_e_incluida_no_insert_da_coordenada(self):
        db = _Db({"id_revisao_coordenada": 20})

        await _persistir_coordenada_revisao(
            db,
            10,
            situacao_correcao="Sim",
            observacao_coordenada="Coordenadas conferidas com ressalva no ponto 3.",
            coordenada=_coordenadas()[0],
        )

        sql = str(db.execute.await_args.args[0])
        params = db.execute.await_args.args[1]
        self.assertIn("observacao_coordenada", sql)
        self.assertEqual(
            params["observacao_coordenada"],
            "Coordenadas conferidas com ressalva no ponto 3.",
        )

    async def test_situacao_correcao_null_e_incluida_no_insert(self):
        db = _Db({"id_revisao_coordenada": 20})

        await _persistir_coordenada_revisao(
            db,
            10,
            situacao_correcao=None,
            observacao_coordenada=None,
            coordenada=_coordenadas()[0],
        )

        params = db.execute.await_args.args[1]
        self.assertIsNone(params["situacao_correcao"])

    async def test_comparacao_le_observacao_da_tabela_filha(self):
        db = _Db(
            [
                {
                    "id_coordenada": 1,
                    "situacao_analise": "Correta",
                    "situacao_correcao": "Não",
                    "observacao_coordenada": "Observação atual",
                }
            ]
        )

        alteradas = await _buscar_coordenadas_alteradas(
            db,
            _coordenadas(),
            nova_observacao="Observação atual",
            nova_situacao_correcao="Não",
        )

        sql = str(db.execute.await_args.args[0])
        self.assertEqual(alteradas, [])
        self.assertIn("rc.observacao_coordenada", sql)
        self.assertIn("COALESCE(rc.observacao_coordenada, ri.observacao_geral)", sql)

    async def test_alteracao_da_observacao_marca_todas_as_coordenadas(self):
        coordenadas = _coordenadas(3)
        db = _Db(
            [
                {
                    "id_coordenada": coordenada.id_coordenada,
                    "situacao_analise": coordenada.situacao_analise,
                    "situacao_correcao": "Não",
                    "observacao_coordenada": "Anterior",
                }
                for coordenada in coordenadas
            ]
        )

        alteradas = await _buscar_coordenadas_alteradas(
            db,
            coordenadas,
            nova_observacao="Nova",
            nova_situacao_correcao="Não",
        )

        self.assertEqual(alteradas, coordenadas)

    async def test_endpoint_replica_observacao_nas_cinco_coordenadas(self):
        db = _Db()
        coordenadas = _coordenadas(5)
        payload = AnaliseCoordenadasCreate(
            nr_instrumento="123",
            observacao_coordenada="Coordenadas conferidas com ressalva no ponto 3.",
            situacao_correcao="Não",
            coordenadas=coordenadas,
        )
        persistir = AsyncMock(return_value={})

        with (
            patch(
                "app.api.mapa._buscar_instrumento_para_analise",
                new=AsyncMock(return_value=SimpleNamespace()),
            ),
            patch(
                "app.api.mapa._buscar_coordenadas_alteradas",
                new=AsyncMock(return_value=coordenadas),
            ),
            patch(
                "app.api.mapa._criar_revisao_instrumento",
                new=AsyncMock(return_value={"id_revisao": 10}),
            ),
            patch("app.api.mapa._persistir_coordenada_revisao", new=persistir),
            patch(
                "app.api.mapa.criar_notificacoes_administradores",
                new=AsyncMock(),
            ),
        ):
            await salvar_analise_coordenadas(
                payload,
                usuario_atual=SimpleNamespace(id_usuario=7),
                db=db,
            )

        self.assertEqual(persistir.await_count, 5)
        for chamada in persistir.await_args_list:
            self.assertEqual(
                chamada.kwargs["observacao_coordenada"],
                "Coordenadas conferidas com ressalva no ponto 3.",
            )
            self.assertEqual(chamada.kwargs["situacao_correcao"], "Não")
        db.commit.assert_awaited_once()

    async def test_endpoint_replica_null_sem_observacao(self):
        db = _Db()
        coordenadas = _coordenadas(3)
        payload = AnaliseCoordenadasCreate(
            nr_instrumento="123",
            observacao_coordenada="",
            coordenadas=coordenadas,
        )
        persistir = AsyncMock(return_value={})

        with (
            patch(
                "app.api.mapa._buscar_instrumento_para_analise",
                new=AsyncMock(return_value=SimpleNamespace()),
            ),
            patch(
                "app.api.mapa._buscar_coordenadas_alteradas",
                new=AsyncMock(return_value=coordenadas),
            ),
            patch(
                "app.api.mapa._criar_revisao_instrumento",
                new=AsyncMock(return_value={"id_revisao": 10}),
            ),
            patch("app.api.mapa._persistir_coordenada_revisao", new=persistir),
            patch(
                "app.api.mapa.criar_notificacoes_administradores",
                new=AsyncMock(),
            ),
        ):
            await salvar_analise_coordenadas(
                payload,
                usuario_atual=SimpleNamespace(id_usuario=7),
                db=db,
            )

        self.assertEqual(persistir.await_count, 3)
        self.assertTrue(
            all(
                chamada.kwargs["observacao_coordenada"] is None
                for chamada in persistir.await_args_list
            )
        )
        self.assertTrue(
            all(
                chamada.kwargs["situacao_correcao"] is None
                for chamada in persistir.await_args_list
            )
        )

if __name__ == "__main__":
    unittest.main()
