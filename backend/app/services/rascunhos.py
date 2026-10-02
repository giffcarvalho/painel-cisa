"""Regra transacional compartilhada para descarte de rascunhos de revisão."""

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


TABELAS_FILHAS_RASCUNHO = (
    "painel_dsr.tb_revisao_instrumento_coordenada",
    "painel_dsr.tb_revisao_instrumento_publico_alvo",
    "painel_dsr.tb_revisao_obra_saneamento",
    "painel_dsr.tb_revisao_instrumento_localidade",
    "painel_dsr.tb_revisao_instrumento_municipio",
)


async def descartar_rascunho(
    db: AsyncSession,
    id_revisao: int,
    *,
    id_usuario_esperado: int,
) -> dict:
    """Descarta um rascunho e somente suas linhas filhas, sob lock da revisão."""
    resultado = await db.execute(
        text(
            """
            SELECT id_revisao, id_usuario, status
            FROM painel_dsr.tb_revisao_instrumento
            WHERE id_revisao = :id_revisao
            FOR UPDATE
            """
        ),
        {"id_revisao": id_revisao},
    )
    revisao = resultado.mappings().one_or_none()
    if revisao is None:
        raise HTTPException(status_code=404, detail="Revisão não encontrada.")
    if revisao["id_usuario"] != id_usuario_esperado:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="O rascunho não pertence ao técnico informado.",
        )
    if revisao["status"] != "rascunho":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Somente uma revisão em rascunho pode ser cancelada.",
        )

    devolutiva = await db.execute(
        text(
            """SELECT 1
               FROM painel_dsr.tb_revisao_instrumento r
               JOIN painel_dsr.tb_devolutiva_revisao d
                 ON d.id_revisao_devolvida = r.id_revisao_anterior
                AND d.status = 'aguardando_correcao'
               WHERE r.id_revisao = :id_revisao
               LIMIT 1"""
        ),
        {"id_revisao": id_revisao},
    )
    if devolutiva.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O rascunho de uma revisão devolvida não pode ser cancelado.",
        )

    for tabela in TABELAS_FILHAS_RASCUNHO:
        await db.execute(
            text(f"DELETE FROM {tabela} WHERE id_revisao = :id_revisao"),
            {"id_revisao": id_revisao},
        )
    await db.execute(
        text(
            """DELETE FROM painel_dsr.tb_revisao_instrumento
               WHERE id_revisao = :id_revisao AND status = 'rascunho'"""
        ),
        {"id_revisao": id_revisao},
    )
    return {"id_revisao": id_revisao, "mensagem": "Rascunho cancelado com sucesso."}
