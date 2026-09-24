import asyncio
import os
import unittest

os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_USER", "teste")
os.environ.setdefault("DB_PASSWORD", "teste")
os.environ.setdefault("DB_NAME", "teste")

from fastapi import HTTPException

from app.services.admin_usuarios import alterar_setor_tecnico, criar_usuario


class _Result:
    def __init__(self, row=None, scalar=None, rowcount=1):
        self.row = row
        self.scalar = scalar
        self.rowcount = rowcount

    def scalar_one_or_none(self):
        return self.scalar

    def mappings(self):
        return self

    def one_or_none(self):
        return self.row

    def one(self):
        return self.row


class _Transaction:
    def __init__(self, db):
        self.db = db

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        self.db.committed = exc_type is None
        self.db.rolled_back = exc_type is not None
        return False


class _CreateDb:
    def __init__(self, suffix=3, inactive=False):
        self.suffix = suffix
        self.inactive = inactive
        self.sql = []
        self.committed = False
        self.rolled_back = False

    async def rollback(self):
        pass

    def begin(self):
        return _Transaction(self)

    async def execute(self, statement, params=None):
        sql = str(statement)
        self.sql.append(sql)
        if "LOWER(email)" in sql:
            return _Result(scalar=None)
        if "FROM instrumento.tb_tecnico_setor" in sql:
            return _Result(row=None if self.inactive else {"id_setor": 5, "prefixo_codigo": 121})
        if "pg_advisory_xact_lock" in sql:
            return _Result()
        if "MAX(MOD(id_tecnico, 100))" in sql:
            return _Result(scalar=self.suffix)
        if "INSERT INTO instrumento.tb_tecnico" in sql:
            return _Result()
        if "INSERT INTO painel_dsr.tb_usuario" in sql:
            codigo = params["codigo_tecnico"]
            return _Result(row={
                "id_usuario": 9,
                "codigo_tecnico": codigo,
                "id_setor": params["id_setor"],
                "nome": params["nome"],
                "email": params["email"],
                "perfil": params["perfil"],
                "conta_ativada": False,
                "ativo": True,
            })
        raise AssertionError(f"SQL não previsto: {sql}")


class _SectorDb:
    def __init__(self, fail_second_update=False):
        self.fail_second_update = fail_second_update
        self.committed = False
        self.rolled_back = False
        self.sql = []

    async def rollback(self):
        pass

    def begin(self):
        return _Transaction(self)

    async def execute(self, statement, params=None):
        sql = str(statement)
        self.sql.append(sql)
        if "FROM painel_dsr.tb_usuario" in sql:
            return _Result(row={"id_usuario": 7, "codigo_tecnico": 12103, "id_setor": 4, "perfil": "tecnico"})
        if "FROM instrumento.tb_tecnico\n" in sql:
            return _Result(scalar=12103)
        if "FROM instrumento.tb_tecnico_setor" in sql:
            return _Result(row={"id_setor": 8, "nome": "CGGSE/COPS"})
        if "UPDATE instrumento.tb_tecnico" in sql:
            return _Result(rowcount=1)
        if "UPDATE painel_dsr.tb_usuario" in sql:
            return _Result(rowcount=0 if self.fail_second_update else 1)
        raise AssertionError(f"SQL não previsto: {sql}")


class CriacaoUsuarioTests(unittest.IsolatedAsyncioTestCase):
    async def test_cria_tecnico_e_usuario_na_mesma_transacao(self):
        db = _CreateDb(suffix=3)
        resposta = await criar_usuario(db, nome="Técnica", email="T@EXAMPLE.GOV.BR", perfil="tecnico", id_setor=5)
        self.assertEqual(resposta.codigo_tecnico, 12104)
        self.assertEqual(resposta.id_setor, 5)
        self.assertFalse(resposta.conta_ativada)
        self.assertTrue(db.committed)
        self.assertTrue(any("pg_advisory_xact_lock" in sql for sql in db.sql))
        self.assertLess(next(i for i, sql in enumerate(db.sql) if "INSERT INTO instrumento.tb_tecnico" in sql), next(i for i, sql in enumerate(db.sql) if "INSERT INTO painel_dsr.tb_usuario" in sql))

    async def test_duas_criacoes_mesmo_prefixo_recebem_codigos_diferentes(self):
        primeiro, segundo = await asyncio.gather(
            criar_usuario(_CreateDb(3), nome="A", email="a@example.gov.br", perfil="tecnico", id_setor=5),
            criar_usuario(_CreateDb(4), nome="B", email="b@example.gov.br", perfil="tecnico", id_setor=5),
        )
        self.assertEqual({primeiro.codigo_tecnico, segundo.codigo_tecnico}, {12104, 12105})

    async def test_admin_nao_cria_tecnico(self):
        db = _CreateDb()
        resposta = await criar_usuario(db, nome="Admin", email="admin@example.gov.br", perfil="admin", id_setor=None)
        self.assertIsNone(resposta.codigo_tecnico)
        self.assertFalse(any("INSERT INTO instrumento.tb_tecnico" in sql for sql in db.sql))

    async def test_setor_inativo_e_rejeitado(self):
        db = _CreateDb(inactive=True)
        with self.assertRaises(HTTPException) as raised:
            await criar_usuario(db, nome="Técnica", email="t@example.gov.br", perfil="tecnico", id_setor=5)
        self.assertEqual(raised.exception.status_code, 400)
        self.assertTrue(db.rolled_back)


class TrocaSetorTests(unittest.IsolatedAsyncioTestCase):
    async def test_codigo_tecnico_permanece_igual(self):
        db = _SectorDb()
        resposta = await alterar_setor_tecnico(db, 7, 8)
        self.assertEqual(resposta.codigo_tecnico, 12103)
        self.assertEqual(resposta.setor, "CGGSE/COPS")
        self.assertTrue(db.committed)
        updates = [sql for sql in db.sql if sql.lstrip().startswith("UPDATE")]
        self.assertEqual(len(updates), 2)
        self.assertFalse(any("codigo_tecnico =" in sql for sql in updates))

    async def test_falha_no_segundo_update_faz_rollback(self):
        db = _SectorDb(fail_second_update=True)
        with self.assertRaises(HTTPException):
            await alterar_setor_tecnico(db, 7, 8)
        self.assertTrue(db.rolled_back)
        self.assertFalse(db.committed)


if __name__ == "__main__":
    unittest.main()
