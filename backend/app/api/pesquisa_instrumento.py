"""Endpoints da Pesquisa por Instrumento"""

import logging
from typing import Annotated
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy import text, CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import get_db
from app.schemas.pesquisa_instrumento import (
    PesquisaInstrumentoBuscaFiltroResponse,
    PesquisaInstrumentoDetalhe,
    PesquisaInstrumentoFiltrosResponse,
    PesquisaInstrumentoListaResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)

MV = "instrumento.vw_carteira_dsr"

CAMPOS_BUSCA_FILTROS = {
    "nome_proponente": "nome_proponente",
    "municipios_beneficiados": "municipios_beneficiados",
    "nr_instrumento": "nr_instrumento::text",
    "nr_proposta": "nr_proposta::text",
    "operacao": "operacao::text",
}

class FiltrosPesquisaInstrumento:
    def __init__(
            self,
            municipios_beneficiados: list[str] | None = Query(None),
            nr_proposta: list[str] | None = Query(None),
            nome_proponente: list[str] | None = Query(None),
            nr_instrumento: list[str] | None = Query(None),
            operacao: list[str] | None = Query(None),
    ):
        self.municipios_beneficiados = municipios_beneficiados
        self.nr_proposta = nr_proposta
        self.nome_proponente = nome_proponente
        self.nr_instrumento = nr_instrumento
        self.operacao = operacao

async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None) -> CursorResult:
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as e:
        logger.error(f"Erro no banco de dados: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno de processamento ao consultar a base de dados."
        )
    
def _build_where(filtros: FiltrosPesquisaInstrumento) -> tuple[str, dict]:
    clauses: list[str] = []
    params: dict = {}

    if filtros.municipios_beneficiados:
        municipio_clauses = []
        for i, value in enumerate(filtros.municipios_beneficiados):
            value = str(value).strip()
            if not value:
                continue

            key = f"municipios_beneficiados_{i}"
            municipio_clauses.append(f"municipios_beneficiados ILIKE :{key}")
            params[key] = f"%{value}%"

        if municipio_clauses:
            clauses.append("(" + " OR ".join(municipio_clauses) + ")")

    list_filters = [
        ("nome_proponente", filtros.nome_proponente, "nome_proponente", None),
        ("operacao", filtros.operacao, "operacao", "text"),
        ("nr_proposta", filtros.nr_proposta, "nr_proposta", "text"),
        ("nr_instrumento", filtros.nr_instrumento, "nr_instrumento", "text"),
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

@router.get("/filtros", response_model=PesquisaInstrumentoFiltrosResponse)
async def get_filtros(
    response: Response,
    filtros: FiltrosPesquisaInstrumento = Depends(),
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
            SELECT DISTINCT NULLIF(trim(municipio), '') AS municipio
            FROM base
            CROSS JOIN LATERAL regexp_split_to_table(
                COALESCE(municipios_beneficiados, ''),
                '\\s*[,;/]\\s*'
            ) AS municipio
        )
        SELECT
            COALESCE((
                SELECT array_remove(
                    array_agg(DISTINCT nome_proponente ORDER BY nome_proponente),
                    NULL
                )
                FROM base
            ), ARRAY[]::text[]) AS nome_proponente,
            COALESCE((
                SELECT array_remove(array_agg(municipio ORDER BY municipio), NULL)
                FROM municipios
                WHERE municipio IS NOT NULL
            ), ARRAY[]::text[]) AS municipios_beneficiados,
            COALESCE((
                SELECT array_remove(
                    array_agg(DISTINCT nr_instrumento::text ORDER BY nr_instrumento::text),
                    NULL
                )
                FROM base
            ), ARRAY[]::text[]) AS nr_instrumento,
            COALESCE((
                SELECT array_remove(
                    array_agg(DISTINCT nr_proposta::text ORDER BY nr_proposta::text),
                    NULL
                )
                FROM base
            ), ARRAY[]::text[]) AS nr_proposta,
            COALESCE((
                SELECT array_remove(
                    array_agg(DISTINCT operacao::text ORDER BY operacao::text),
                    NULL
                )
                FROM base
            ), ARRAY[]::text[]) AS operacao
    """

    result = await _execute_query(db, sql, params)
    return PesquisaInstrumentoFiltrosResponse(**dict(result.mappings().one()))


@router.get("/filtros/busca", response_model=PesquisaInstrumentoBuscaFiltroResponse, summary="Busca de filtros da Pesquisa Instrumento")
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

    return PesquisaInstrumentoBuscaFiltroResponse(
        campo=campo,
        termo=termo,
        data=[row["valor"] for row in result.mappings().all()],
    )


@router.get("/instrumentos", response_model=PesquisaInstrumentoListaResponse, summary="Lista instrumentos da Pesquisa Instrumento")
async def get_instrumentos(
    response: Response,
    filtros: FiltrosPesquisaInstrumento = Depends(),
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
            nr_proposta::text AS nr_proposta,
            operacao::text AS operacao,
            tipo_instrumento,
            nome_proponente,
            uf,
            municipios_beneficiados,
            valor_global,
            valor_repasse,
            situacao_obra,
            situacao_atual
        FROM {MV}
        {where}
        ORDER BY nr_instrumento::text
        LIMIT :limit OFFSET :offset
    """

    count_result = await _execute_query(db, count_sql, params)
    data_result = await _execute_query(db, data_sql, data_params)

    return PesquisaInstrumentoListaResponse(
        total=count_result.scalar_one(),
        pagina=pagina,
        tamanho_pagina=tamanho_pagina,
        data=[dict(r) for r in data_result.mappings().all()],
    )


@router.get("/instrumentos/{nr_instrumento}", response_model=PesquisaInstrumentoDetalhe, summary="Detalhe de um instrumento")
async def get_instrumento_detalhe(
    nr_instrumento: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "private, max-age=300"

    sql = f"""
        SELECT
            nr_proposta::text AS nr_proposta,
            nr_instrumento::text AS nr_instrumento,
            tipo_instrumento,
            nome_proponente,
            uf,
            objeto,
            municipios_beneficiados,
            qtde_municipios,
            valor_global,
            valor_repasse,
            valor_contrapartida,
            valor_empenhado,
            valor_desembolsado,
            valor_desbloqueado,
            valor_a_empenhar,
            valor_a_desembolsar,
            dia_assin_conv,
            dia_fim_vigenc_conv,
            motivo_suspensao,
            data_suspensiva,
            liminar_judicial,
            situacao_projeto,
            data_aceite_projeto,
            situacao_obra,
            primeira_data_emissao_aio,
            percentual_fisico_informado,
            data_ultimo_bm,
            percentual_fisico_aferido,
            data_ultima_vistoria,
            percentual_financeiro_desbloqueado,
            data_ultimo_desbloqueio,
            data_ultima_obtv,
            situacao_atual,
            data_dados_transferegov,
            data_dados_caixa,
            link_transferegov,
            operacao::text AS operacao
        FROM {MV}
        WHERE nr_instrumento::text = :nr_instrumento
        LIMIT 2
    """

    result = await _execute_query(
        db,
        sql,
        {"nr_instrumento": nr_instrumento.strip()},
    )

    rows = result.mappings().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Instrumento não encontrado.",
        )

    if len(rows) > 1:
        raise HTTPException(
            status_code=409,
            detail="Mais de uma linha encontrada para o mesmo instrumento. Verifique a granularidade da view instrumento.vw_carteira_dsr.",
        )

    return PesquisaInstrumentoDetalhe(**dict(rows[0]))
