"""Fonte única de verdade para emissão de códigos temporários de acesso."""

import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.seguranca import gerar_hash_codigo_acesso


ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
VALIDADE_DIAS = 7


def gerar_codigo_acesso() -> str:
    blocos = ["".join(secrets.choice(ALFABETO) for _ in range(4)) for _ in range(3)]
    return f"DSR-{'-'.join(blocos)}"


async def emitir_codigo_acesso(
    db: AsyncSession, id_usuario: int
) -> tuple[str, datetime]:
    codigo = gerar_codigo_acesso()
    codigo_hash = gerar_hash_codigo_acesso(codigo)
    # As colunas existentes são TIMESTAMP (sem timezone), como o restante do sistema.
    expira_em = datetime.now() + timedelta(days=VALIDADE_DIAS)
    result = await db.execute(
        text(
            """
            UPDATE painel_dsr.tb_usuario
            SET senha_hash = NULL,
                conta_ativada = FALSE,
                codigo_acesso_hash = :codigo_hash,
                codigo_acesso_expira_em = :expira_em,
                codigo_acesso_usado_em = NULL,
                atualizado_em = NOW()
            WHERE id_usuario = :id_usuario
              AND ativo IS TRUE
            RETURNING id_usuario
            """
        ),
        {"id_usuario": id_usuario, "codigo_hash": codigo_hash, "expira_em": expira_em},
    )
    if result.scalar_one_or_none() is None:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário ativo não encontrado.")
    await db.commit()
    return codigo, expira_em
