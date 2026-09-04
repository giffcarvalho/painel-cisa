"""Endpoints das Pontos de Controle"""

import logging
from typing import Annotated
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy import text, CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import get_db
from app.schemas.pontos_controle import (
    PontosControleBuscaFiltroResponse,
    PontosControleFiltrosResponse,
    PontosControleListaResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)

MV = "instrumento.vw_monitoramento_instrumento"

CAMPOS_BUSCA_FILTROS = {
    "monitor": "monitor",
    "municipios_beneficiados": "municipios_beneficiados",
    "nr_instrumento": "nr_instrumento::text",
    "uf": "uf::text",
    "acao": "acao::text",
}

class FiltrosPontosControle:
    def __init__(
            self,
            monitor: list[str] | None = Query(None),
            municipios_beneficiados: list[str] | None = Query(None),
            nr_instrumento: list[str] | None = Query(None),
            uf: list[str] | None = Query(None),
            acao: list[str] | None = Query(None),
    ):
        self.monitor = monitor
        self.municipios_beneficiados = municipios_beneficiados
        self.nr_instrumento = nr_instrumento
        self.uf = uf
        self.acao = acao

async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None) -> CursorResult:
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as e:
        logger.error(f"Erro no banco de dados: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno de processamento ao consultar a base de dados."
        )
    
def _build_where(filtros: FiltrosPontosControle) -> tuple[str, dict]:
    clauses: list[str] = []
    params: dict = {}

    if filtros.municipios_beneficiados:
        municipio_clauses = []
        for i, value in enumerate(filtros.municipios_beneficiados):
            value = str(value).strip()
            if not value:
                continue

            if "|" in value:
                municipio, uf = value.split("|", 1)

                municipio_key = f"municipio_beneficiado_{i}"
                uf_key = f"uf_municipio_beneficiado_{i}"

                municipio_clauses.append(f"""
                    (
                        EXISTS (
                            SELECT 1
                            FROM regexp_split_to_table(
                                COALESCE(municipios_beneficiados, ''),
                                '\\s*[,;/]\\s*'
                            ) AS municipio
                            WHERE NULLIF(trim(municipio), '') = :{municipio_key}
                        )
                        AND NULLIF(trim(uf), '') = :{uf_key}
                    )
                """)

                params[municipio_key] = municipio.strip()
                params[uf_key] = uf.strip()
            else:
                key = f"municipios_beneficiados_{i}"
                municipio_clauses.append(f"municipios_beneficiados ILIKE :{key}")
                params[key] = f"%{value}%"

        if municipio_clauses:
            clauses.append("(" + " OR ".join(municipio_clauses) + ")")

    list_filters = [
        ("monitor", filtros.monitor, "monitor", None),
        ("nr_instrumento", filtros.nr_instrumento, "nr_instrumento", "text"),
        ("uf", filtros.uf, "uf", "text"),
        ("acao", filtros.acao, "acao", "text"),
        
    ]

    for col, values, param_key, cast_type in list_filters:
        if not values:
            continue

        clean_values = [str(v).strip() for v in values if str(v).strip()]
        if not clean_values:
            continue

        placeholder = ", ".join(f":{param_key}_{i}" for i in range(len(clean_values)))
        sql_col = f"{col}::{cast_type}" if cast_type else col
        clauses.append(f"{sql_col} IN ({placeholder})")

        for i, value in enumerate(clean_values):
            params[f"{param_key}_{i}"] = value

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    return where, params

@router.get("/filtros", response_model=PontosControleFiltrosResponse)
async def get_filtros(
    response: Response,
    filtros: FiltrosPontosControle = Depends(),
    db: AsyncSession = Depends(get_db),
):
    where, params = _build_where(filtros)

    response.headers["Cache-Control"] = (
        "private, max-age=300" if where else "public, max-age=3600"
    )

    sql = f"""
        WITH base AS (
            SELECT *
            FROM {MV}
            {where}
        ),
        municipios AS (
            SELECT DISTINCT
                NULLIF(trim(municipio), '') AS municipio,
                NULLIF(trim(uf), '') AS uf
            FROM base
            CROSS JOIN LATERAL regexp_split_to_table(
                COALESCE(municipios_beneficiados, ''),
                '\s*[,;/]\s*'
            ) AS municipio
            WHERE NULLIF(trim(municipio), '') IS NOT NULL
              AND NULLIF(trim(uf), '') IS NOT NULL 
        )
        SELECT
            COALESCE((
                SELECT array_remove(
                    array_agg(DISTINCT monitor ORDER BY monitor),
                    NULL
                )
                FROM base
            ), ARRAY[]::text[]) AS monitor,
            COALESCE((
                    SELECT json_agg(
                        json_build_object(
                            'municipio', municipio,
                            'uf', uf
                        )
                        ORDER BY municipio, uf
                    )
                    FROM municipios
                ), '[]'::json) AS municipios_beneficiados,
            COALESCE((
                SELECT array_remove(
                    array_agg(DISTINCT nr_instrumento::text ORDER BY nr_instrumento::text),
                    NULL
                )
                FROM base
            ), ARRAY[]::text[]) AS nr_instrumento,
            COALESCE((
                SELECT array_remove(
                    array_agg(DISTINCT uf::text ORDER BY uf::text),
                    NULL
                )
                FROM base
            ), ARRAY[]::text[]) AS uf,
            COALESCE((
                SELECT array_remove(
                    array_agg(DISTINCT acao::text ORDER BY acao::text),
                    NULL
                )
                FROM base
            ), ARRAY[]::text[]) AS acao
    """

    result = await _execute_query(db, sql, params)
    return PontosControleFiltrosResponse(**dict(result.mappings().one()))


@router.get("/filtros/busca", response_model=PontosControleBuscaFiltroResponse, summary="Busca de filtros dos Pontos de Controle")
async def buscar_opcoes_filtro(
    campo: Annotated[str, Query(description="Campo pesquisável.")],
    q: Annotated[str, Query(min_length=2, max_length=100, description="Termo de busca.")],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    db: AsyncSession = Depends(get_db),
):
    coluna = CAMPOS_BUSCA_FILTROS.get(campo)

    if not coluna:
        raise HTTPException(
            status_code=400,
            detail="Campo de filtro não permitido para busca.",
        )

    termo = q.strip()

    sql = f"""
        SELECT DISTINCT {coluna} AS valor
        FROM {MV}
        WHERE {coluna} IS NOT NULL
          AND {coluna} ILIKE :termo
        ORDER BY valor
        LIMIT :limit
    """

    result = await _execute_query(
        db,
        sql,
        {
            "termo": f"%{termo}%",
            "limit": limit,
        },
    )

    return PontosControleBuscaFiltroResponse(
        campo=campo,
        termo=termo,
        data=[row["valor"] for row in result.mappings().all()],
    )


@router.get("/instrumentos", response_model=PontosControleListaResponse, summary="Lista instrumentos dos Pontos de Controle")
async def get_instrumentos(
    response: Response,
    filtros: FiltrosPontosControle = Depends(),
    pagina: Annotated[int, Query(ge=1, description="Número da página, começando em 1.")] = 1,
    tamanho_pagina: Annotated[int, Query(ge=1, le=500, description="Itens por página.")] = 100,
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "private, max-age=300"
    where, params = _build_where(filtros)

    offset = (pagina - 1) * tamanho_pagina
    data_params = {**params, "limit": tamanho_pagina, "offset": offset}

    count_sql = f"""
        SELECT COUNT(*)
        FROM {MV}
        {where}
    """

    data_sql = f"""
        SELECT
            nr_instrumento::text AS nr_instrumento,
            municipios_beneficiados::text AS municipios_beneficiados,
            uf,
            carteira_ativa,
            possui_aio,
            projeto_aprovado,
            acao,
            coordenacao,
            monitor
        FROM {MV}
        {where}
        ORDER BY nr_instrumento::text
        LIMIT :limit OFFSET :offset
    """

    count_result = await _execute_query(db, count_sql, params)
    data_result = await _execute_query(db, data_sql, data_params)

    return PontosControleListaResponse(
        total=count_result.scalar_one(),
        pagina=pagina,
        tamanho_pagina=tamanho_pagina,
        data=[dict(r) for r in data_result.mappings().all()],
    )
