import unittest
from unittest.mock import AsyncMock, Mock

from fastapi import HTTPException

from app.schemas.auth import UsuarioAutenticado
from app.schemas.revisao_instrumento import InstrumentoRevisaoInfo
from app.services.permissoes_revisao import exigir_permissao_edicao, pode_editar_instrumento


class PermissoesRevisaoTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.instrumento = InstrumentoRevisaoInfo(
            identificador_busca="949343",
            tipo_instrumento="contrato_repasse",
            nr_instrumento="949343",
        )

    async def test_admin_pode_editar_sem_consultar_monitoramento(self):
        db = AsyncMock()
        usuario = UsuarioAutenticado(
            id_usuario=1,
            nome="Admin",
            email="admin@example.com",
            perfil="admin",
        )

        self.assertTrue(await pode_editar_instrumento(db, usuario, self.instrumento))
        db.execute.assert_not_awaited()

    async def test_tecnico_com_instrumento_atribuido_pode_editar(self):
        resultado = Mock()
        resultado.scalar_one_or_none.return_value = 1
        db = AsyncMock()
        db.execute.return_value = resultado
        usuario = UsuarioAutenticado(
            id_usuario=2,
            nome="Técnico",
            email="tecnico@example.com",
            perfil="tecnico",
        )

        self.assertTrue(await pode_editar_instrumento(db, usuario, self.instrumento))

    async def test_tecnico_sem_instrumento_atribuido_fica_bloqueado(self):
        resultado = Mock()
        resultado.scalar_one_or_none.return_value = None
        db = AsyncMock()
        db.execute.return_value = resultado
        usuario = UsuarioAutenticado(
            id_usuario=3,
            nome="Outro técnico",
            email="outro@example.com",
            perfil="tecnico",
        )

        self.assertFalse(await pode_editar_instrumento(db, usuario, self.instrumento))

        with self.assertRaises(HTTPException) as erro:
            await exigir_permissao_edicao(db, usuario, self.instrumento)

        self.assertEqual(erro.exception.status_code, 403)
        self.assertEqual(
            erro.exception.detail,
            "Você não possui vínculo ativo para alterar este instrumento.",
        )


if __name__ == "__main__":
    unittest.main()
