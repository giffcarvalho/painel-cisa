"""Todos os endpoints da Carteira DSR"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy import text, CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db
from app.schemas.filtros import OpcoesFiltros
from app.schemas.graficos import (
    InstrumentosPorAcaoResponse,
    InstrumentosPorFaseResponse,
    InstrumentosPorSituacaoResponse,
    MapaCoropleticoResponse,
    MapaPontosResponse,
    ValoresPorAcaoResponse,
    ValoresPorUFResponse,
    ValorPorTipoResponse
)
from app.schemas.kpis import KpisResponse
from app.schemas.tabela import TabelaResponse

router = APIRouter()
logger = logging.getLogger(__name__)

MV = "temporario.mvw_cisa_tabelao"

def _parse_list_param(param: list[str] | None) -> list[str] | None:  #--Garante que parâmetros passados como string separada por vírgula no frontend sejam convertidos em uma lista válida.
    if not param:
        return None
    parsed = []
    for item in param:
        if "," in item:
            parsed.extend([p.strip() for p in item.split(",") if p.strip()])
        else:
            if item.strip():
                parsed.append(item.strip())
    return parsed if parsed else None

async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None) -> CursorResult: #--Executa a query com tratamento de erro para evitar que exceções brutas do banco vazem.
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as e:
        logger.error(f"Erro no banco de dados: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno de processamento ao consultar a base de dados."
        )

#--Dependência de filtros
class FiltrosCarteiraDSR:  #-- Dependência do FastAPI para agrupar todos os Query Parameters. Evita repetição nas assinaturas das funções de rota.
    def __init__(
            self,
            componente: list[str] | None = Query(None),
            uf: list[str] | None = Query(None),
            municipio: list[str] | None = Query(None),
            novo_pac: list[str] | None = Query(None),
            situacao_obra: list[str] | None = Query(None),
            situacao_contratacao: list[str] | None = Query(None),
            fase_instrumento: list[str] | None = Query(None),
            carteira_ativa: list[str] | None = Query(None),
            ano_proposta: list[str] | None = Query(None),
            tipo_instrumento: list[str] | None = Query(None),
            acao_padronizada: list[str] | None = Query(None),
            acao_orcamentaria: list[str] | None = Query(None),
    ):
        self.componente = _parse_list_param(componente)
        self.uf = _parse_list_param(uf)
        self.municipio = _parse_list_param(municipio)
        self.novo_pac = _parse_list_param(novo_pac)
        self.situacao_obra = _parse_list_param(situacao_obra)
        self.situacao_contratacao = _parse_list_param(situacao_contratacao)
        self.fase_instrumento = _parse_list_param(fase_instrumento)
        self.carteira_ativa = _parse_list_param(carteira_ativa)
        self.ano_proposta = _parse_list_param(ano_proposta)
        self.tipo_instrumento = _parse_list_param(tipo_instrumento)
        self.acao_padronizada = _parse_list_param(acao_padronizada)
        self.acao_orcamentaria = _parse_list_param(acao_orcamentaria)

def _build_where(filtros: FiltrosCarteiraDSR) -> tuple[str, dict]:  #-- Os parâmetros são passados de forma segura via bind params do SQLAlchemy.
    clauses: list[str] = []
    params: dict = {}

    list_filters = [
        ("componente", filtros.componente, "componente"),
        ("uf", filtros.uf, "uf"),
        ("municipio", filtros.municipio, "municipio"),
        ("situacao_obra", filtros.situacao_obra, "situacao_obra"),
        ("situacao_contratacao", filtros.situacao_contratacao, "situacao_contratacao"),
        ("fase_instrumento", filtros.fase_instrumento, "fase_instrumento"),
        ("tipo_instrumento", filtros.tipo_instrumento, "tipo_instrumento"),
        ("acao_padronizada", filtros.acao_padronizada, "acao_padronizada"),
        ("acao_orcamentaria", filtros.acao_orcamentaria, "acao_orcamentaria"),
        ("novo_pac", filtros.novo_pac, "novo_pac"),
        ("carteira_ativa", filtros.carteira_ativa, "carteira_ativa"),
        ("ano_proposta", filtros.ano_proposta, "ano_proposta")
    ]

    for col, values, param_key in list_filters:
        if values:
            placeholder = ", ".join(f":{param_key}_{i}" for i in range(len(values)))
            clauses.append(f"{col} IN ({placeholder})")
            for i, v in enumerate(values):
                params[f"{param_key}_{i}"] = v

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    return where, params

# KPIs / Scorecards
@router.get("/kpis", response_model=KpisResponse, summary="Scorecards da carteira DSR")
async def get_kpis(
    response: Response,
    filtros: FiltrosCarteiraDSR = Depends(),
    db: AsyncSession = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=300"
    where, params = _build_where(filtros)

    sql = f"""
        WITH instrumentos AS (
            SELECT DISTINCT ON (nr_instrumento)
                nr_instrumento, valor_global, valor_repasse, valor_contrapartida,
                valor_empenhado, valor_desembolsado, valor_desbloqueado
            FROM {MV}
            {where}
        )
        SELECT
            COUNT(nr_instrumento)                     AS qtde_instrumentos,
            COALESCE(SUM(valor_global), 0)            AS valor_global,
            COALESCE(SUM(valor_repasse), 0)           AS valor_repasse,
            COALESCE(SUM(valor_contrapartida), 0)     AS valor_contrapartida,
            COALESCE(SUM(valor_empenhado), 0)         AS valor_empenhado,
            COALESCE(SUM(valor_desembolsado), 0)      AS valor_desembolsado,
            COALESCE(SUM(valor_desbloqueado), 0)      AS valor_desbloqueado,
            (
                SELECT COUNT(DISTINCT cod_municipio)
                FROM {MV} sub
                {where}
            )                                         AS qtde_municipios_beneficiados
            FROM instrumentos
    """
    result = await _execute_query(db, sql, params)
    return KpisResponse(**result.mappings().one())

# Filtros Disponíveis
@router.get("/filtros", response_model=OpcoesFiltros, summary="Opções de Filtro")
async def get_filtros(response: Response, db: AsyncSession = Depends(get_db)):
    response.headers["Cache-Control"] = "public, max-age=3600"

    sql = f"""
        SELECT
            array_remove(array_agg(DISTINCT componente ORDER BY componente), NULL) AS componentes,
            array_remove(array_agg(DISTINCT uf ORDER BY uf), NULL) AS ufs,
            array_remove(array_agg(DISTINCT municipio ORDER BY municipio), NULL) AS municipios,
            array_remove(array_agg(DISTINCT novo_pac ORDER BY novo_pac), NULL) AS novo_pac,
            array_remove(array_agg(DISTINCT situacao_obra ORDER BY situacao_obra), NULL) AS situacoes_obra,
            array_remove(array_agg(DISTINCT situacao_contratacao ORDER BY situacao_contratacao), NULL) AS situacoes_contratacao,
            array_remove(array_agg(DISTINCT fase_instrumento ORDER BY fase_instrumento), NULL) AS fase_instrumento,
            array_remove(array_agg(DISTINCT ano_proposta::text ORDER BY ano_proposta::text), NULL) AS anos_proposta,
            array_remove(array_agg(DISTINCT tipo_instrumento ORDER BY tipo_instrumento), NULL) AS tipos_instrumento,
            array_remove(array_agg(DISTINCT acao_padronizada ORDER BY acao_padronizada), NULL) AS acoes_padronizadas,
            array_remove(array_agg(DISTINCT acao_orcamentaria ORDER BY acao_orcamentaria), NULL) AS acoes_orcamentarias,
            array_remove(array_agg(DISTINCT nr_proposta::text ORDER BY nr_proposta::text), NULL) AS nr_proposta,
            array_remove(array_agg(DISTINCT nr_instrumento::text ORDER BY nr_instrumento::text), NULL) AS nr_instrumento,
            array_remove(array_agg(DISTINCT nome_proponente ORDER BY nome_proponente), NULL) AS nome_proponente,
            array_remove(array_agg(DISTINCT termino_vigencia::text ORDER BY termino_vigencia::text), NULL) AS termino_vigencia,
            array_remove(array_agg(DISTINCT nr_proposta_selecao_pac::text ORDER BY nr_proposta_selecao_pac::text), NULL) AS nr_proposta_selecao_pac,
            array_remove(array_agg(DISTINCT carteira_ativa ORDER BY carteira_ativa), NULL) AS carteira_ativa
        
        FROM {MV}
        WHERE componente IS NOT NULL
    """
    result = await _execute_query(db, sql)
    return OpcoesFiltros(**dict(result.mappings().one()))

# valores por UF
@router.get("/graficos/localidade", response_model=ValoresPorUFResponse, summary="Valores proporcionais por UF")
async def get_valores_por_uf(
    response: Response,
    filtros: FiltrosCarteiraDSR = Depends(),
    db: AsyncSession = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=300"
    where, params = _build_where(filtros)
    sql = f"""
        SELECT 
            uf,
            SUM(valor_desembolsado_proporcional)                   AS desembolsado,
            SUM(valor_empenhado_a_desembolsar_proporcional)        AS empenhado_a_desembolsar,
            SUM(valor_a_empenhar_proporcional)                     AS a_empenhar,
            SUM(valor_contrapartida_proporcional)                  AS contrapartida
        FROM {MV}
        {where}
        GROUP BY uf
        ORDER BY uf
    """
    result = await _execute_query(db, sql, params)
    return ValoresPorUFResponse(data=[dict(r) for r in result.mappings().all()])

# Valores por ação
@router.get("/graficos/acoes", response_model=ValoresPorAcaoResponse, summary="Valores financeiros por ação padronizada")
async def get_valores_por_acao(
    response: Response,
    filtros: FiltrosCarteiraDSR = Depends(),
    db: AsyncSession = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=300"
    where, params = _build_where(filtros)
    sql = f"""
        WITH instrumentos AS (
            SELECT DISTINCT ON (nr_instrumento)
                nr_instrumento, acao_padronizada, valor_desembolsado,
                valor_empenhado_a_desembolsar, valor_a_empenhar, valor_contrapartida
            FROM {MV}
            {where}
        )
        SELECT
            acao_padronizada,
            SUM(valor_desembolsado)                 AS desembolsado,
            SUM(valor_empenhado_a_desembolsar)       AS empenhado_a_desembolsar,
            SUM(valor_a_empenhar)                   AS a_empenhar,
            SUM(valor_contrapartida)                AS contrapartida
        FROM instrumentos
        GROUP BY acao_padronizada
        ORDER BY acao_padronizada
    """
    result = await _execute_query(db, sql, params)
    return ValoresPorAcaoResponse(data=[dict(r) for r in result.mappings().all()])

# Quantidade de Instrumentos por Ação
@router.get("/graficos/acoes-qtde", response_model=InstrumentosPorAcaoResponse, summary="Contagem de instrumentos por ação padronizada")
async def get_instrumentos_por_acao(
    response: Response,
    filtros: FiltrosCarteiraDSR = Depends(),
    db: AsyncSession = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=300"
    where, params = _build_where(filtros)
    sql = f"""
        SELECT
            acao_padronizada,
            COUNT(DISTINCT nr_instrumento) AS qtde_instrumentos
        FROM {MV}
        {where}
        GROUP BY acao_padronizada
        ORDER BY acao_padronizada
    """
    result = await _execute_query(db, sql, params)
    return InstrumentosPorAcaoResponse(data=[dict(r) for r in result.mappings().all()])

#valor global por tipo de instrumento
@router.get("/graficos/tipo-instrumento", response_model=ValorPorTipoResponse, summary="Valor global por tipo de instrumento (rosca)")
async def get_valor_por_tipo(
    response: Response,
    filtros: FiltrosCarteiraDSR = Depends(),
    db: AsyncSession = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=300"
    where, params = _build_where(filtros)
    sql = f"""
        WITH instrumentos AS (
            SELECT DISTINCT ON (nr_instrumento)
                nr_instrumento, tipo_instrumento, valor_global
            FROM {MV}
            {where}
        )
        SELECT
            tipo_instrumento,
            SUM(valor_global) AS valor_global
        FROM instrumentos
        GROUP BY tipo_instrumento
        ORDER BY tipo_instrumento
    """
    result = await _execute_query(db, sql, params)
    return ValorPorTipoResponse(data=[dict(r) for r in result.mappings().all()])

# instrumentos por fase de execução
@router.get("/graficos/fase-situacao", response_model=InstrumentosPorFaseResponse, summary="Contagem de instrumentos por fase de execução")
async def get_instrumentos_por_fase(
    response: Response,
    filtros: FiltrosCarteiraDSR = Depends(),
    db: AsyncSession = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=300"
    where, params = _build_where(filtros)
    sql = f"""
        SELECT
            fase_instrumento,
            COUNT(DISTINCT nr_instrumento) AS qtde_instrumentos
        FROM {MV}
        {where}
        GROUP BY fase_instrumento
        ORDER BY fase_instrumento
    """
    result = await _execute_query (db, sql, params)
    return InstrumentosPorFaseResponse(data=[dict(r) for r in result.mappings().all()])

# instrumentos por situação de contratação
@router.get("/graficos/situacao-contratacao", response_model=InstrumentosPorSituacaoResponse, summary="Contagem de instrumentos por situação de contratação")
async def get_instrumentos_por_situacao(
    response: Response,
    filtros: FiltrosCarteiraDSR = Depends(),
    db: AsyncSession = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=300"
    where, params = _build_where(filtros)
    sql = f"""
        SELECT
            situacao_contratacao,
            COUNT(DISTINCT nr_instrumento) AS qtde_instrumentos
        FROM {MV}
        {where}
        GROUP BY situacao_contratacao
        ORDER BY situacao_contratacao
    """
    result = await _execute_query(db, sql, params)
    return InstrumentosPorSituacaoResponse(data=[dict(r) for r in result.mappings().all()])

# mapa coroplético - valor global proporcional por UF
@router.get("/graficos/mapa-coropletico", response_model=MapaCoropleticoResponse, summary="Valor global proporcional e contagem de instrumentos por UF")
async def get_mapa_coropletico(
    response: Response,
    filtros: FiltrosCarteiraDSR = Depends(),
    db: AsyncSession = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=300"
    where, params = _build_where(filtros)
    sql = f"""
        SELECT
            uf,
            SUM(valor_global_proporcional)      AS valor_global_proporcional,
            COUNT(DISTINCT nr_instrumento)      AS qtde_instrumentos
        FROM {MV}
        {where}
        GROUP BY uf
        ORDER BY valor_global_proporcional DESC
    """
    result = await _execute_query(db, sql, params)
    return MapaCoropleticoResponse(data=[dict(r) for r in result.mappings().all()])

