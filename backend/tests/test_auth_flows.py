import os
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_USER", "teste")
os.environ.setdefault("DB_PASSWORD", "teste")
os.environ.setdefault("DB_NAME", "teste")

from fastapi import HTTPException
from pydantic import ValidationError

from app.api import auth
from app.core.security import gerar_hash_codigo_acesso, gerar_hash_senha
from app.schemas.auth import (
    DefinirSenhaRedefinicaoRequest,
    DefinirSenhaPrimeiroAcessoRequest,
    LoginRequest,
    ValidarCodigoPrimeiroAcessoRequest,
    ValidarCodigoRedefinicaoSenhaRequest,
)


CODIGO = "DSR-K7MP-4Q9X-W8RT"


class FakeMappings:
    def __init__(self, rows):
        self.rows = rows

    def one_or_none(self):
        return self.rows[0] if self.rows else None

    def all(self):
        return self.rows


class FakeResult:
    def __init__(self, rows=None, rowcount=0):
        self.rows = rows or []
        self.rowcount = rowcount

    def mappings(self):
        return FakeMappings(self.rows)


class FakeDb:
    def __init__(self, users=None):
        self.users = users or []
        self.commits = 0
        self.rollbacks = 0

    async def execute(self, statement, params=None):
        params = params or {}
        sql = str(statement)
        if sql.lstrip().startswith("SELECT"):
            if "codigo_acesso_hash IS NOT NULL" in sql:
                now = datetime.now(timezone.utc)
                eligible = [
                    dict(user)
                    for user in self.users
                    if user["ativo"] is True
                    and user["conta_ativada"] is False
                    and user["senha_hash"] is None
                    and user["codigo_acesso_hash"] is not None
                    and user["codigo_acesso_usado_em"] is None
                    and (
                        user["codigo_acesso_expira_em"] is None
                        or user["codigo_acesso_expira_em"] > now
                    )
                ]
                return FakeResult(eligible)
            if "email" in params:
                rows = [
                    dict(user)
                    for user in self.users
                    if user["email"].strip().lower() == params["email"].strip().lower()
                ]
                return FakeResult(rows[:1])

        if "SET ultimo_acesso_em" in sql:
            return FakeResult(rowcount=1)

        if "codigo_acesso_usado_em = NOW()" in sql:
            user = next(
                (
                    item
                    for item in self.users
                    if item["id_usuario"] == params["id_usuario"]
                    and item["ativo"] is True
                    and item["conta_ativada"] is False
                    and item["senha_hash"] is None
                    and item["codigo_acesso_hash"]
                    == params["codigo_acesso_hash"]
                    and item["codigo_acesso_usado_em"] is None
                ),
                None,
            )
            if user:
                user["senha_hash"] = params["senha_hash"]
                user["conta_ativada"] = True
                user["codigo_acesso_usado_em"] = datetime.now(timezone.utc)
                user["codigo_acesso_hash"] = None
                user["codigo_acesso_expira_em"] = None
                return FakeResult(rowcount=1)
            return FakeResult(rowcount=0)

        raise AssertionError(f"SQL não previsto no teste: {sql}")

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1


def make_user(**changes):
    user = {
        "id_usuario": 1,
        "codigo_tecnico": 12103,
        "nome": "Técnico",
        "email": "tecnico@cidades.gov.br",
        "setor": "CISA",
        "senha_hash": None,
        "conta_ativada": False,
        "perfil": "tecnico",
        "ativo": True,
        "codigo_acesso_hash": gerar_hash_codigo_acesso(CODIGO),
        "codigo_acesso_expira_em": datetime.now(timezone.utc)
        + timedelta(days=7),
        "codigo_acesso_usado_em": None,
    }
    user.update(changes)
    return user


class AuthFlowTests(unittest.IsolatedAsyncioTestCase):
    async def login(self, db, senha="senha-segura", email="tecnico@cidades.gov.br"):
        with patch.object(auth, "_jwt_secret_key", return_value="segredo-de-teste"):
            return await auth.login(LoginRequest(email=email, senha=senha), db)

    async def validar(self, db, codigo=CODIGO):
        return await auth.validar_primeiro_acesso(
            ValidarCodigoPrimeiroAcessoRequest(codigo_primeiro_acesso=codigo), db
        )

    async def definir(self, db, codigo=CODIGO, senha="senha-nova"):
        return await auth.definir_senha_primeiro_acesso(
            DefinirSenhaPrimeiroAcessoRequest(
                codigo_primeiro_acesso=codigo,
                senha=senha,
                confirmacao_senha=senha,
            ),
            db,
        )

    async def test_codigo_valido_retorna_apenas_dados_publicos(self):
        response = await self.validar(FakeDb([make_user()]))
        self.assertEqual(response.model_dump(), {
            "nome": "Técnico",
            "email": "tecnico@cidades.gov.br",
            "setor": "CISA",
        })

    async def test_codigo_inexistente(self):
        with self.assertRaises(HTTPException) as raised:
            await self.validar(FakeDb([make_user()]), "DSR-AAAA-BBBB-CCCC")
        self.assertEqual(raised.exception.status_code, 400)

    async def test_codigo_expirado(self):
        user = make_user(
            codigo_acesso_expira_em=datetime.now(timezone.utc)
            - timedelta(seconds=1)
        )
        with self.assertRaises(HTTPException):
            await self.validar(FakeDb([user]))

    async def test_codigo_ja_utilizado(self):
        user = make_user(codigo_acesso_usado_em=datetime.now(timezone.utc))
        with self.assertRaises(HTTPException):
            await self.validar(FakeDb([user]))

    async def test_conta_inativa(self):
        with self.assertRaises(HTTPException):
            await self.validar(FakeDb([make_user(ativo=False)]))

    async def test_conta_ja_ativada(self):
        with self.assertRaises(HTTPException):
            await self.validar(
                FakeDb([make_user(conta_ativada=True, senha_hash=gerar_hash_senha("senha"))])
            )

    def test_senha_e_confirmacao_diferentes(self):
        with self.assertRaises(ValidationError):
            DefinirSenhaPrimeiroAcessoRequest(
                codigo_primeiro_acesso=CODIGO,
                senha="senha-nova",
                confirmacao_senha="outra-senha",
            )

    def test_senha_vazia_ou_curta(self):
        for senha in ("", "curta"):
            with self.subTest(senha=senha), self.assertRaises(ValidationError):
                DefinirSenhaPrimeiroAcessoRequest(
                    codigo_primeiro_acesso=CODIGO,
                    senha=senha,
                    confirmacao_senha=senha,
                )

    async def test_criacao_da_senha_e_reutilizacao_bloqueada(self):
        db = FakeDb([make_user()])
        response = await self.definir(db)
        self.assertIn("sucesso", response.mensagem)
        self.assertEqual(db.commits, 1)
        self.assertIsNone(db.users[0]["codigo_acesso_hash"])
        with self.assertRaises(HTTPException):
            await self.validar(db)

    async def test_login_normal_depois_da_ativacao(self):
        db = FakeDb([make_user()])
        await self.definir(db)
        response = await self.login(db, "senha-nova")
        self.assertEqual(response.usuario.perfil, "tecnico")

    async def test_login_orienta_conta_liberada_para_definir_senha(self):
        with self.assertRaises(HTTPException) as raised:
            await self.login(FakeDb([make_user()]))
        self.assertEqual(raised.exception.status_code, 403)
        self.assertIn("Primeiro acesso", raised.exception.detail)

    async def test_admin_sem_codigo_tecnico_continua_entrando(self):
        admin = make_user(
            codigo_tecnico=None,
            email="admin@cidades.gov.br",
            perfil="admin",
            senha_hash=gerar_hash_senha("senha-segura"),
            conta_ativada=True,
            codigo_acesso_hash=None,
            codigo_acesso_expira_em=None,
        )
        response = await self.login(
            FakeDb([admin]), email="admin@cidades.gov.br"
        )
        self.assertEqual(response.usuario.perfil, "admin")

    async def test_reset_manual_com_novo_codigo(self):
        novo_codigo = "DSR-Z9YX-W8VU-T7SR"
        user = make_user(
            codigo_acesso_hash=gerar_hash_codigo_acesso(novo_codigo)
        )
        response = await self.validar(FakeDb([user]), novo_codigo)
        self.assertEqual(response.nome, "Técnico")


class PasswordResetTests(unittest.IsolatedAsyncioTestCase):
    async def login(self, db, senha="senha-segura", email="tecnico@cidades.gov.br"):
        with patch.object(auth, "_jwt_secret_key", return_value="segredo-de-teste"):
            return await auth.login(LoginRequest(email=email, senha=senha), db)

    async def validar_primeiro_acesso(self, db, codigo=CODIGO):
        return await auth.validar_primeiro_acesso(
            ValidarCodigoPrimeiroAcessoRequest(codigo_primeiro_acesso=codigo), db
        )

    async def validar_redefinicao(self, db, codigo=CODIGO):
        return await auth.validar_codigo_redefinicao(
            ValidarCodigoRedefinicaoSenhaRequest(codigo_acesso=codigo), db
        )

    async def redefinir(self, db, codigo=CODIGO, senha="senha-nova"):
        return await auth.definir_senha_redefinicao(
            DefinirSenhaRedefinicaoRequest(
                codigo_acesso=codigo,
                senha=senha,
                confirmacao_senha=senha,
            ),
            db,
        )

    def usuario_redefinicao(self, **changes):
        user = make_user()
        user.update(changes)
        return user

    async def test_codigo_valido_de_redefinicao(self):
        response = await self.validar_redefinicao(
            FakeDb([self.usuario_redefinicao()])
        )
        self.assertEqual(response.nome, "Técnico")

    async def test_codigo_invalido_expirado_conta_ativada_e_conta_inativa(self):
        casos = [
            (self.usuario_redefinicao(), "DSR-AAAA-BBBB-CCCC"),
            (
                self.usuario_redefinicao(
                    codigo_acesso_expira_em=datetime.now(timezone.utc)
                    - timedelta(seconds=1)
                ),
                CODIGO,
            ),
            (
                self.usuario_redefinicao(
                    conta_ativada=True,
                    senha_hash=gerar_hash_senha("senha-atual"),
                ),
                CODIGO,
            ),
            (self.usuario_redefinicao(ativo=False), CODIGO),
        ]
        for user, codigo in casos:
            with self.subTest(user=user, codigo=codigo), self.assertRaises(HTTPException):
                await self.validar_redefinicao(FakeDb([user]), codigo)

    def test_confirmacao_diferente_na_redefinicao(self):
        with self.assertRaises(ValidationError):
            DefinirSenhaRedefinicaoRequest(
                codigo_acesso=CODIGO,
                senha="senha-nova",
                confirmacao_senha="outra-senha",
            )

    async def test_redefinicao_invalida_codigo_e_troca_a_senha(self):
        user = self.usuario_redefinicao()
        db = FakeDb([user])
        response = await self.redefinir(db)
        self.assertIn("Senha redefinida com sucesso", response.mensagem)
        self.assertTrue(user["conta_ativada"])
        self.assertIsNone(user["codigo_acesso_hash"])
        self.assertTrue(auth.verificar_senha("senha-nova", user["senha_hash"]))
        with self.assertRaises(HTTPException):
            await self.validar_redefinicao(db)
        login_response = await self.login(db, senha="senha-nova")
        self.assertEqual(login_response.usuario.email, user["email"])

    async def test_os_dois_fluxos_aceitam_o_mesmo_estado_de_banco(self):
        response_primeiro_acesso = await self.validar_primeiro_acesso(
            FakeDb([make_user()])
        )
        response_redefinicao = await self.validar_redefinicao(
            FakeDb([self.usuario_redefinicao()])
        )
        self.assertEqual(response_primeiro_acesso.email, response_redefinicao.email)
