from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import UsuarioAutenticado
from app.schemas.revisao_instrumento import InstrumentoRevisaoInfo


async def pode_editar_instrumento(
    db: AsyncSession,
    usuario: UsuarioAutenticado,
    instrumento: InstrumentoRevisaoInfo,
) -> bool:
    if usuario.perfil == "admin":
        return True

    if usuario.perfil != "tecnico":
        return False

    identificador = instrumento.nr_ted if instrumento.tipo_instrumento == "ted" else instrumento.nr_instrumento
    if identificador is None:
        return False

    result = await db.execute(
        text(
            """
            SELECT 1
            FROM painel_dsr.tb_usuario_instrumento_monitoramento
            WHERE id_usuario = :id_usuario
              AND NULLIF(BTRIM(nr_instrumento), '') = NULLIF(BTRIM(CAST(:nr_instrumento AS varchar)), '')
              AND ativo IS TRUE
            LIMIT 1
            """
        ),
        {"id_usuario": usuario.id_usuario, "nr_instrumento": str(identificador)},
    )
    return result.scalar_one_or_none() is not None


async def exigir_permissao_edicao(
    db: AsyncSession,
    usuario: UsuarioAutenticado,
    instrumento: InstrumentoRevisaoInfo,
) -> None:
    if not await pode_editar_instrumento(db, usuario, instrumento):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não possui vínculo ativo para alterar este instrumento.",
        )
