"""Endpoints de teste para recebimento de envios técnicos."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.teste_envios import TesteEnvioCreate, TesteEnvioItem

from app.api.auth import obter_usuario_atual
from app.schemas.auth import UsuarioAutenticado

router = APIRouter()
logger = logging.getLogger(__name__)

STATUS_INICIAL_CODIGO = "enviado"


async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None):
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as exc:
        logger.exception("Erro no banco de dados dos envios de teste: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao consultar os envios de teste.",
        )


@router.get("/envios", response_model=list[TesteEnvioItem])
async def listar_envios_teste(
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    db: AsyncSession = Depends(get_db),
):
    result = await _execute_query(
        db,
        """
        SELECT
            e.id_envio,
            e.id_usuario_tecnico,
            e.uf::text AS uf,
            e.cod_teste,
            e.nome_municipio_teste,
            e.descricao,
            s.codigo AS status,
            e.data_envio,
            e.data_criacao,
            e.data_atualizacao
        FROM painel_dsr.tb_teste_envios e
        JOIN painel_dsr.tb_teste_status_envio s
          ON s.id_status = e.id_status
        ORDER BY e.data_criacao DESC, e.id_envio DESC
        LIMIT :limit
        """,
        {"limit": limit},
    )

    return [TesteEnvioItem(**dict(row)) for row in result.mappings().all()]


@router.post(
    "/envios",
    response_model=TesteEnvioItem,
    status_code=status.HTTP_201_CREATED,
)
async def criar_envio_teste(
    payload: TesteEnvioCreate,
    usuario_atual: UsuarioAutenticado = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            text(
                """
                WITH status_inicial AS (
                    SELECT id_usuario
                    FROM painel_dsr.tb_teste_usuarios
                    WHERE email = :email_tecnico
                      AND perfil = 'tecnico'
                      AND ativo IS TRUE
                    LIMIT 1
                ),
                status_inicial AS (
                    SELECT id_status
                    FROM painel_dsr.tb_teste_status_envio
                    WHERE codigo = :status_codigo
                      AND ativo IS TRUE
                    LIMIT 1
                ),
                inserted AS (
                    INSERT INTO painel_dsr.tb_teste_envios (
                        id_usuario_tecnico,
                        id_status,
                        uf,
                        cod_teste,
                        nome_municipio_teste,
                        descricao,
                        data_envio
                    )
                    SELECT
                        :id_usuario_tecnico,
                        status_inicial.id_status,
                        :uf,
                        :cod_teste,
                        :nome_municipio_teste,
                        :descricao,
                        NOW()
                    FROM status_inicial
                    RETURNING
                        id_envio,
                        id_usuario_tecnico,
                        uf,
                        cod_teste,
                        nome_municipio_teste,
                        descricao,
                        id_status,
                        data_envio,
                        data_criacao,
                        data_atualizacao
                )
                SELECT
                    i.id_envio,
                    i.id_usuario_tecnico,
                    i.uf::text AS uf,
                    i.cod_teste,
                    i.nome_municipio_teste,
                    i.descricao,
                    s.codigo AS status,
                    i.data_envio,
                    i.data_criacao,
                    i.data_atualizacao
                FROM inserted i
                JOIN painel_dsr.tb_teste_status_envio s
                  ON s.id_status = i.id_status
                """
            ),
            {
                "id_usuario_tecnico": usuario_atual.id_usuario,
                "status_codigo": STATUS_INICIAL_CODIGO,
                "uf": payload.uf,
                "cod_teste": payload.cod_teste,
                "nome_municipio_teste": payload.nome_municipio_teste,
                "descricao": payload.descricao,
            },
        )

        row = result.mappings().one_or_none()

        if row is None:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Status inicial não encontrado. Verifique tb_teste_status_envio.",
            )

        await db.commit()
        return TesteEnvioItem(**dict(row))

    except SQLAlchemyError as exc:
        await db.rollback()
        logger.exception("Erro ao gravar envio de teste: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao gravar o envio de teste.",
        )