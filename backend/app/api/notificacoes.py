from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import obter_usuario_atual
from app.core.database import get_db
from app.schemas.auth import UsuarioAutenticado
from app.schemas.notificacoes import (
    ContagemNotificacoesResponse,
    NotificacaoLeituraResponse,
    NotificacoesUsuarioResponse,
    NotificacaoUsuarioItem,
)
from app.services.notificacoes import (
    identificador_instrumento,
    montar_mensagem_notificacao,
)


router = APIRouter()


async def _contar_nao_lidas(db: AsyncSession, id_usuario: int) -> int:
    result = await db.execute(
        text(
            """SELECT COUNT(*) FROM painel_dsr.tb_notificacao_usuario
               WHERE id_usuario = :id_usuario AND lido_em IS NULL"""
        ),
        {"id_usuario": id_usuario},
    )
    return int(result.scalar_one() or 0)


@router.get("", response_model=NotificacoesUsuarioResponse)
async def listar_notificacoes(
    pagina: Annotated[int, Query(ge=1, alias="page")] = 1,
    limite: Annotated[int, Query(ge=1, le=100, alias="limit")] = 20,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    params = {
        "id_usuario": usuario.id_usuario,
        "limite": limite,
        "offset": (pagina - 1) * limite,
    }
    total_result = await db.execute(
        text("SELECT COUNT(*) FROM painel_dsr.tb_notificacao_usuario WHERE id_usuario = :id_usuario"),
        params,
    )
    total = int(total_result.scalar_one() or 0)
    result = await db.execute(
        text(
            """
            SELECT n.id_notificacao, n.tipo, n.id_revisao,
                   n.criado_em, n.lido_em,
                   r.tipo_instrumento, r.nr_instrumento, r.nr_proposta,
                   r.nr_ted, r.identificador_busca
            FROM painel_dsr.tb_notificacao_usuario n
            JOIN painel_dsr.tb_revisao_instrumento r
              ON r.id_revisao = n.id_revisao
            WHERE n.id_usuario = :id_usuario
            ORDER BY n.criado_em DESC, n.id_notificacao DESC
            LIMIT :limite OFFSET :offset
            """
        ),
        params,
    )
    data = []
    for item in result.mappings().all():
        row = dict(item)
        row["identificador_instrumento"] = identificador_instrumento(row)
        row["mensagem"] = montar_mensagem_notificacao(row["tipo"], row)
        data.append(NotificacaoUsuarioItem(**row))
    return NotificacoesUsuarioResponse(
        data=data,
        pagina=pagina,
        limite=limite,
        total=total,
        total_paginas=(total + limite - 1) // limite,
        nao_lidas=await _contar_nao_lidas(db, usuario.id_usuario),
    )


@router.get("/nao-lidas", response_model=ContagemNotificacoesResponse)
async def contar_notificacoes_nao_lidas(
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    return ContagemNotificacoesResponse(
        nao_lidas=await _contar_nao_lidas(db, usuario.id_usuario)
    )


@router.patch("/{id_notificacao}/lida", response_model=NotificacaoLeituraResponse)
async def marcar_notificacao_lida(
    id_notificacao: int,
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text(
            """
            UPDATE painel_dsr.tb_notificacao_usuario
            SET lido_em = COALESCE(lido_em, NOW())
            WHERE id_notificacao = :id_notificacao AND id_usuario = :id_usuario
            RETURNING id_notificacao
            """
        ),
        {"id_notificacao": id_notificacao, "id_usuario": usuario.id_usuario},
    )
    if result.scalar_one_or_none() is None:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificação não encontrada.")
    await db.commit()
    return NotificacaoLeituraResponse(
        atualizadas=1,
        nao_lidas=await _contar_nao_lidas(db, usuario.id_usuario),
    )


@router.patch("/lidas/todas", response_model=NotificacaoLeituraResponse)
async def marcar_todas_notificacoes_lidas(
    usuario: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text(
            """
            UPDATE painel_dsr.tb_notificacao_usuario
            SET lido_em = NOW()
            WHERE id_usuario = :id_usuario AND lido_em IS NULL
            """
        ),
        {"id_usuario": usuario.id_usuario},
    )
    atualizadas = int(result.rowcount or 0)
    await db.commit()
    return NotificacaoLeituraResponse(atualizadas=atualizadas, nao_lidas=0)
