import os
import unittest
from unittest.mock import AsyncMock

os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_USER", "teste")
os.environ.setdefault("DB_PASSWORD", "teste")
os.environ.setdefault("DB_NAME", "teste")

from fastapi import HTTPException

from app.core.authorization import exigir_admin
from app.core.security import verificar_codigo_acesso
from app.schemas.auth import UsuarioAutenticado
from app.services.admin_usuarios import alterar_status_usuario, alterar_vinculo, vincular_instrumento
from app.services.codigo_acesso import emitir_codigo_acesso, gerar_codigo_acesso


class ScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class MappingResult:
    def __init__(self, row):
        self.row = row

    class _Mappings:
        def __init__(self, row):
            self.row = row

        def one_or_none(self):
            return self.row

        def one(self):
            return self.row

    def mappings(self):
        return self._Mappings(self.row)


class UpdateResult:
    def __init__(self, rowcount):
        self.rowcount = rowcount


class LinkDb:
    def __init__(self, links=None):
        self.links = dict(links or {})
        self.commits = 0

    async def execute(self, statement, params):
        sql = str(statement)
        if "FROM painel_dsr.tb_usuario u" in sql:
            return MappingResult({"perfil": "tecnico"})
        if "SELECT 1 FROM instrumento.vw_carteira_dsr" in sql:
            return ScalarResult(1)
        if "INSERT INTO painel_dsr.tb_usuario_instrumento_monitoramento" in sql:
            key = (params["id_usuario"], params["nr"])
            self.links[key] = True
            return MappingResult({"nr_instrumento": params["nr"], "ativo": True})
        raise AssertionError(f"SQL não previsto: {sql}")

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        raise AssertionError("Não deveria ocorrer rollback")


class CodigoDb:
    def __init__(self):
        self.params = []
        self.commits = 0

    async def execute(self, statement, params):
        self.params.append((str(statement), params))
        return ScalarResult(params["id_usuario"])

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        raise AssertionError("Não deveria ocorrer rollback")


class AdminAuthorizationTests(unittest.IsolatedAsyncioTestCase):
    def usuario(self, perfil):
        return UsuarioAutenticado(id_usuario=1, nome="Usuário", email="u@example.com", perfil=perfil)

    def test_tecnico_recebe_403(self):
        with self.assertRaises(HTTPException) as raised:
            exigir_admin(self.usuario("tecnico"))
        self.assertEqual(raised.exception.status_code, 403)

    def test_admin_acessa(self):
        admin = self.usuario("admin")
        self.assertIs(exigir_admin(admin), admin)

    async def test_admin_nao_pode_desativar_a_propria_conta(self):
        with self.assertRaises(HTTPException) as raised:
            await alterar_status_usuario(AsyncMock(), 1, False, 1)
        self.assertEqual(raised.exception.status_code, 400)

    async def test_desativacao_e_logica_e_nao_delete(self):
        db = AsyncMock()
        db.execute.return_value = UpdateResult(1)
        await alterar_status_usuario(db, 2, False, 1)
        sql = str(db.execute.await_args.args[0]).upper()
        self.assertIn("UPDATE", sql)
        self.assertNotIn("DELETE", sql)
        self.assertFalse(db.execute.await_args.args[1]["ativo"])


class CodigoAcessoTests(unittest.IsolatedAsyncioTestCase):
    def test_formato_do_codigo(self):
        codigo = gerar_codigo_acesso()
        self.assertRegex(codigo, r"^DSR-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$")

    async def test_grava_somente_hash_e_novo_codigo_invalida_anterior(self):
        db = CodigoDb()
        primeiro, _ = await emitir_codigo_acesso(db, 7)
        segundo, _ = await emitir_codigo_acesso(db, 7)
        primeiro_params = db.params[0][1]
        segundo_params = db.params[1][1]
        self.assertNotIn(primeiro, str(primeiro_params))
        self.assertNotIn(segundo, str(segundo_params))
        self.assertTrue(verificar_codigo_acesso(primeiro, primeiro_params["codigo_hash"]))
        self.assertTrue(verificar_codigo_acesso(segundo, segundo_params["codigo_hash"]))
        self.assertFalse(verificar_codigo_acesso(primeiro, segundo_params["codigo_hash"]))
        self.assertIn("codigo_acesso_usado_em = NULL", db.params[1][0])
        self.assertEqual(db.commits, 2)


class VinculoTests(unittest.IsolatedAsyncioTestCase):
    async def test_adicionar_cria_vinculo_sem_duplicar(self):
        db = LinkDb()
        await vincular_instrumento(db, 2, "123")
        await vincular_instrumento(db, 2, "123")
        self.assertEqual(db.links, {(2, "123"): True})

    async def test_adicionar_vinculo_inativo_reativa(self):
        db = LinkDb({(2, "123"): False})
        resposta = await vincular_instrumento(db, 2, "123")
        self.assertTrue(db.links[(2, "123")])
        self.assertTrue(resposta.ativo)

    async def test_desativar_vinculo_usa_update(self):
        db = AsyncMock()
        db.execute.return_value = MappingResult({"nr_instrumento": "123", "ativo": False})
        resposta = await alterar_vinculo(db, 2, "123", False)
        sql = str(db.execute.await_args.args[0]).upper()
        self.assertIn("UPDATE", sql)
        self.assertNotIn("DELETE", sql)
        self.assertFalse(resposta.ativo)


if __name__ == "__main__":
    unittest.main()
