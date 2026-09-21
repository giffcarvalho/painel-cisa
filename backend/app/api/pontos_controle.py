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
    PontosControleDataDados
)

router = APIRouter()
logger = logging.getLogger(__name__)

MV = "instrumento.vw_monitoramento_instrumento"
MV_MUNICIPIOS = "instrumento.vw_instrumento_municipio"  # Nova Materialized View de Relacionamento

CAMPOS_BUSCA_FILTROS = {
    "nr_instrumento": "nr_instrumento::text",
    "proponente": "proponente",
    "municipios_beneficiados": "nome",  # Agora aponta para a coluna 'nome' da view de municípios
    "uf": "uf",
    "carteira_ativa": "carteira_ativa",
    "projeto_aprovado": "projeto_aprovado",
    "possui_aio": "possui_aio",
    "coordenacao": "coordenacao",
    "acao": "acao",
    "monitor": "monitor",
    "prazo_clausulas_suspensivas": "prazo_clausulas_suspensivas",
    "prazo_emissao_lae": "prazo_emissao_lae",
    "prazo_inicio_licitacao": "prazo_inicio_licitacao",
    "prazo_conclusao_licitacao": "prazo_conclusao_licitacao",
    "prazo_vrpl": "prazo_vrpl",
    "prazo_contratacao": "prazo_contratacao",
    "prazo_solicitacao_aio": "prazo_solicitacao_aio",
    "prazo_analise_tecnica_aio": "prazo_analise_tecnica_aio",
    "prazo_analise_executiva_aio": "prazo_analise_executiva_aio",
    "prazo_registro_aio": "prazo_registro_aio",
    "prazo_emissao_os": "prazo_emissao_os",
    "prazo_inicio_execucao_fisica": "prazo_inicio_execucao_fisica",
    "prazo_progresso_fisico": "prazo_progresso_fisico",
    "prazo_indicio_paralisacao": "prazo_indicio_paralisacao",
    "status_paralisacao_obra": "status_paralisacao_obra",
    "vistoria_in_loco_parciais": "vistoria_in_loco_parciais",
    "prazo_vistoria_final": "prazo_vistoria_final",
    "obras_proximas_conclusao": "obras_proximas_conclusao",
    "registro_conclusao": "registro_conclusao",
    "vigencia": "vigencia",
    "status_de_execucao_da_obra": "status_de_execucao_da_obra",
}

class FiltrosPontosControle:
    def __init__(
            self,
            nr_instrumento: list[str] | None = Query(None),
            proponente: list[str] | None = Query(None),
            municipios_beneficiados: list[str] | None = Query(None),
            uf: list[str] | None = Query(None),
            carteira_ativa: list[str] | None = Query(None),
            projeto_aprovado: list[str] | None = Query(None),
            possui_aio: list[str] | None = Query(None),
            coordenacao: list[str] | None = Query(None),
            acao: list[str] | None = Query(None),
            monitor: list[str] | None = Query(None),
            prazo_clausulas_suspensivas: list[str] | None = Query(None),
            prazo_emissao_lae: list[str] | None = Query(None),
            prazo_inicio_licitacao: list[str] | None = Query(None),
            prazo_conclusao_licitacao: list[str] | None = Query(None),
            prazo_vrpl: list[str] | None = Query(None),
            prazo_contratacao: list[str] | None = Query(None),
            prazo_solicitacao_aio: list[str] | None = Query(None),
            prazo_analise_tecnica_aio: list[str] | None = Query(None),
            prazo_analise_executiva_aio: list[str] | None = Query(None),
            prazo_registro_aio: list[str] | None = Query(None),
            prazo_emissao_os: list[str] | None = Query(None),
            prazo_inicio_execucao_fisica: list[str] | None = Query(None),
            prazo_progresso_fisico: list[str] | None = Query(None),
            prazo_indicio_paralisacao: list[str] | None = Query(None),
            status_paralisacao_obra: list[str] | None = Query(None),
            vistoria_in_loco_parciais: list[str] | None = Query(None),
            prazo_vistoria_final: list[str] | None = Query(None),
            obras_proximas_conclusao: list[str] | None = Query(None),
            registro_conclusao: list[str] | None = Query(None),
            vigencia: list[str] | None = Query(None),
            status_de_execucao_da_obra: list[str] | None = Query(None),
    ):
        self.nr_instrumento = nr_instrumento
        self.proponente = proponente
        self.municipios_beneficiados = municipios_beneficiados
        self.uf = uf
        self.carteira_ativa = carteira_ativa
        self.projeto_aprovado = projeto_aprovado
        self.possui_aio = possui_aio
        self.coordenacao = coordenacao
        self.acao = acao
        self.monitor = monitor
        self.prazo_clausulas_suspensivas = prazo_clausulas_suspensivas
        self.prazo_emissao_lae = prazo_emissao_lae
        self.prazo_inicio_licitacao = prazo_inicio_licitacao
        self.prazo_conclusao_licitacao = prazo_conclusao_licitacao
        self.prazo_vrpl = prazo_vrpl
        self.prazo_contratacao = prazo_contratacao
        self.prazo_solicitacao_aio = prazo_solicitacao_aio
        self.prazo_analise_tecnica_aio = prazo_analise_tecnica_aio
        self.prazo_analise_executiva_aio = prazo_analise_executiva_aio
        self.prazo_registro_aio = prazo_registro_aio
        self.prazo_emissao_os = prazo_emissao_os
        self.prazo_inicio_execucao_fisica = prazo_inicio_execucao_fisica
        self.prazo_progresso_fisico = prazo_progresso_fisico
        self.prazo_indicio_paralisacao = prazo_indicio_paralisacao
        self.status_paralisacao_obra = status_paralisacao_obra
        self.vistoria_in_loco_parciais = vistoria_in_loco_parciais
        self.prazo_vistoria_final = prazo_vistoria_final
        self.obras_proximas_conclusao = obras_proximas_conclusao
        self.registro_conclusao = registro_conclusao
        self.vigencia = vigencia
        self.status_de_execucao_da_obra = status_de_execucao_da_obra

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

    # Otimização do Filtro de Municípios Beneficiados usando a nova MV normalizada
    if filtros.municipios_beneficiados:
        municipio_clauses = []
        for i, value in enumerate(filtros.municipios_beneficiados):
            value = str(value).strip()
            if not value:
                continue

            key = f"cod_municipio_{i}"
            municipio_clauses.append(f"""
                EXISTS (
                    SELECT 1 
                    FROM {MV_MUNICIPIOS} m_filtro
                    WHERE m_filtro.nr_instrumento::text = {MV}.nr_instrumento::text
                      AND m_filtro.cod_municipio::text = :{key}
                )
            """)
            params[key] = value

        if municipio_clauses:
            clauses.append("(" + " OR ".join(municipio_clauses) + ")")

    if filtros.monitor:
        monitor_clauses = []
        for i, value in enumerate(filtros.monitor):
            key = f"monitor_{i}"
            monitor_clauses.append(f"""
                EXISTS (
                    SELECT 1 
                    FROM painel_dsr.tb_usuario_instrumento_monitoramento ui_f
                    JOIN painel_dsr.tb_usuario u_f ON u_f.id_usuario = ui_f.id_usuario
                    WHERE ui_f.nr_instrumento::text = {MV}.nr_instrumento::text
                    AND u_f.nome ILIKE :{key}
                )
            """)
            params[key] = f"%{value}%"
        if monitor_clauses:
            clauses.append("(" + " OR ".join(monitor_clauses) + ")")

    list_filters = [
        ("nr_instrumento", filtros.nr_instrumento, "nr_instrumento", "text"),
        ("proponente", filtros.proponente, "proponente", None),
        ("uf", filtros.uf, "uf", None),
        ("carteira_ativa", filtros.carteira_ativa, "carteira_ativa", None),
        ("projeto_aprovado", filtros.projeto_aprovado, "projeto_aprovado", None),
        ("possui_aio", filtros.possui_aio, "possui_aio", None),
        ("coordenacao", filtros.coordenacao, "coordenacao", None),
        ("acao", filtros.acao, "acao", None),
        ("prazo_clausulas_suspensivas", filtros.prazo_clausulas_suspensivas, "prazo_clausulas_suspensivas", None),
        ("prazo_emissao_lae", filtros.prazo_emissao_lae, "prazo_emissao_lae", None),
        ("prazo_inicio_licitacao", filtros.prazo_inicio_licitacao, "prazo_inicio_licitacao", None),
        ("prazo_conclusao_licitacao", filtros.prazo_conclusao_licitacao, "prazo_conclusao_licitacao", None),
        ("prazo_vrpl", filtros.prazo_vrpl, "prazo_vrpl", None),
        ("prazo_contratacao", filtros.prazo_contratacao, "prazo_contratacao", None),
        ("prazo_solicitacao_aio", filtros.prazo_solicitacao_aio, "prazo_solicitacao_aio", None),
        ("prazo_analise_tecnica_aio", filtros.prazo_analise_tecnica_aio, "prazo_analise_tecnica_aio", None),
        ("prazo_analise_executiva_aio", filtros.prazo_analise_executiva_aio, "prazo_analise_executiva_aio", None),
        ("prazo_registro_aio", filtros.prazo_registro_aio, "prazo_registro_aio", None),
        ("prazo_emissao_os", filtros.prazo_emissao_os, "prazo_emissao_os", None),
        ("prazo_inicio_execucao_fisica", filtros.prazo_inicio_execucao_fisica, "prazo_inicio_execucao_fisica", None),
        ("prazo_progresso_fisico", filtros.prazo_progresso_fisico, "prazo_progresso_fisico", None),
        ("prazo_indicio_paralisacao", filtros.prazo_indicio_paralisacao, "prazo_indicio_paralisacao", None),
        ("status_paralisacao_obra", filtros.status_paralisacao_obra, "status_paralisacao_obra", None),
        ("vistoria_in_loco_parciais", filtros.vistoria_in_loco_parciais, "vistoria_in_loco_parciais", None),
        ("prazo_vistoria_final", filtros.prazo_vistoria_final, "prazo_vistoria_final", None),
        ("obras_proximas_conclusao", filtros.obras_proximas_conclusao, "obras_proximas_conclusao", None),
        ("registro_conclusao", filtros.registro_conclusao, "registro_conclusao", None),
        ("vigencia", filtros.vigencia, "vigencia", None),
        ("status_de_execucao_da_obra", filtros.status_de_execucao_da_obra, "status_de_execucao_da_obra", None),
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
            SELECT json_agg(
                json_build_object(
                    'cod_municipio', m.cod_municipio,
                    'municipio', m.nome
                )
                ORDER BY m.nome
            ) AS lista
            FROM (
                SELECT DISTINCT m_view.cod_municipio, m_view.nome
                FROM base b
                JOIN {MV_MUNICIPIOS} m_view ON m_view.nr_instrumento::text = b.nr_instrumento::text
                WHERE m_view.nome IS NOT NULL
            ) m
        ),
        monitores AS (
            SELECT 
                COALESCE(
                    array_agg(DISTINCT u.nome ORDER BY u.nome) 
                    FILTER (WHERE u.nome IS NOT NULL), 
                    ARRAY[]::text[]
                ) AS lista
            FROM base b
            JOIN painel_dsr.tb_usuario_instrumento_monitoramento ui ON ui.nr_instrumento::text = b.nr_instrumento::text
            JOIN painel_dsr.tb_usuario u ON u.id_usuario = ui.id_usuario
        )
        SELECT
            COALESCE(
                array_agg(DISTINCT nr_instrumento::text ORDER BY nr_instrumento::text) 
                FILTER (WHERE nr_instrumento::text IS NOT NULL), 
                ARRAY[]::text[]
            ) AS nr_instrumento,

            COALESCE(
                array_agg(DISTINCT proponente ORDER BY proponente) 
                FILTER (WHERE proponente IS NOT NULL), 
                ARRAY[]::text[]
            ) AS proponente,

            COALESCE(
                (SELECT lista FROM municipios), 
                '[]'::json
            ) AS municipios_beneficiados,
            
            COALESCE(
                array_agg(DISTINCT uf ORDER BY uf) 
                FILTER (WHERE uf IS NOT NULL), 
                ARRAY[]::text[]
            ) AS uf,
            
            COALESCE(
                array_agg(DISTINCT carteira_ativa ORDER BY carteira_ativa) 
                FILTER (WHERE carteira_ativa IS NOT NULL), 
                ARRAY[]::text[]
            ) AS carteira_ativa,
            
            COALESCE(
                array_agg(DISTINCT projeto_aprovado ORDER BY projeto_aprovado) 
                FILTER (WHERE projeto_aprovado IS NOT NULL), 
                ARRAY[]::text[]
            ) AS projeto_aprovado,

            COALESCE(
                array_agg(DISTINCT possui_aio ORDER BY possui_aio) 
                FILTER (WHERE possui_aio IS NOT NULL), 
                ARRAY[]::text[]
            ) AS possui_aio,
            
            COALESCE(
                array_agg(DISTINCT coordenacao ORDER BY coordenacao) 
                FILTER (WHERE coordenacao IS NOT NULL), 
                ARRAY[]::text[]
            ) AS coordenacao,
            
            COALESCE(
                array_agg(DISTINCT acao ORDER BY acao) 
                FILTER (WHERE acao IS NOT NULL), 
                ARRAY[]::text[]
            ) AS acao,
            
            COALESCE(
                (SELECT lista FROM monitores), 
                ARRAY[]::text[]
            ) AS monitor,

            COALESCE(
                array_agg(DISTINCT prazo_clausulas_suspensivas ORDER BY prazo_clausulas_suspensivas) 
                FILTER (WHERE prazo_clausulas_suspensivas IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_clausulas_suspensivas,

            COALESCE(
                array_agg(DISTINCT prazo_emissao_lae ORDER BY prazo_emissao_lae) 
                FILTER (WHERE prazo_emissao_lae IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_emissao_lae,

            COALESCE(
                array_agg(DISTINCT prazo_inicio_licitacao ORDER BY prazo_inicio_licitacao) 
                FILTER (WHERE prazo_inicio_licitacao IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_inicio_licitacao,

            COALESCE(
                array_agg(DISTINCT prazo_conclusao_licitacao ORDER BY prazo_conclusao_licitacao) 
                FILTER (WHERE prazo_conclusao_licitacao IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_conclusao_licitacao,

            COALESCE(
                array_agg(DISTINCT prazo_vrpl ORDER BY prazo_vrpl) 
                FILTER (WHERE prazo_vrpl IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_vrpl,

            COALESCE(
                array_agg(DISTINCT prazo_contratacao ORDER BY prazo_contratacao) 
                FILTER (WHERE prazo_contratacao IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_contratacao,

            COALESCE(
                array_agg(DISTINCT prazo_solicitacao_aio ORDER BY prazo_solicitacao_aio) 
                FILTER (WHERE prazo_solicitacao_aio IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_solicitacao_aio,

            COALESCE(
                array_agg(DISTINCT prazo_analise_tecnica_aio ORDER BY prazo_analise_tecnica_aio) 
                FILTER (WHERE prazo_analise_tecnica_aio IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_analise_tecnica_aio,

            COALESCE(
                array_agg(DISTINCT prazo_analise_executiva_aio ORDER BY prazo_analise_executiva_aio) 
                FILTER (WHERE prazo_analise_executiva_aio IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_analise_executiva_aio,

            COALESCE(
                array_agg(DISTINCT prazo_registro_aio ORDER BY prazo_registro_aio) 
                FILTER (WHERE prazo_registro_aio IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_registro_aio,

            COALESCE(
                array_agg(DISTINCT prazo_emissao_os ORDER BY prazo_emissao_os) 
                FILTER (WHERE prazo_emissao_os IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_emissao_os,

            COALESCE(
                array_agg(DISTINCT prazo_inicio_execucao_fisica ORDER BY prazo_inicio_execucao_fisica) 
                FILTER (WHERE prazo_inicio_execucao_fisica IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_inicio_execucao_fisica,

            COALESCE(
                array_agg(DISTINCT prazo_progresso_fisico ORDER BY prazo_progresso_fisico) 
                FILTER (WHERE prazo_progresso_fisico IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_progresso_fisico,

            COALESCE(
                array_agg(DISTINCT prazo_indicio_paralisacao ORDER BY prazo_indicio_paralisacao) 
                FILTER (WHERE prazo_indicio_paralisacao IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_indicio_paralisacao,

            COALESCE(
                array_agg(DISTINCT status_paralisacao_obra ORDER BY status_paralisacao_obra) 
                FILTER (WHERE status_paralisacao_obra IS NOT NULL), 
                ARRAY[]::text[]
            ) AS status_paralisacao_obra,

            COALESCE(
                array_agg(DISTINCT vistoria_in_loco_parciais ORDER BY vistoria_in_loco_parciais) 
                FILTER (WHERE vistoria_in_loco_parciais IS NOT NULL), 
                ARRAY[]::text[]
            ) AS vistoria_in_loco_parciais,

            COALESCE(
                array_agg(DISTINCT prazo_vistoria_final ORDER BY prazo_vistoria_final) 
                FILTER (WHERE prazo_vistoria_final IS NOT NULL), 
                ARRAY[]::text[]
            ) AS prazo_vistoria_final,

            COALESCE(
                array_agg(DISTINCT obras_proximas_conclusao ORDER BY obras_proximas_conclusao) 
                FILTER (WHERE obras_proximas_conclusao IS NOT NULL), 
                ARRAY[]::text[]
            ) AS obras_proximas_conclusao,

            COALESCE(
                array_agg(DISTINCT registro_conclusao ORDER BY registro_conclusao) 
                FILTER (WHERE registro_conclusao IS NOT NULL), 
                ARRAY[]::text[]
            ) AS registro_conclusao,

            COALESCE(
                array_agg(DISTINCT vigencia ORDER BY vigencia) 
                FILTER (WHERE vigencia IS NOT NULL), 
                ARRAY[]::text[]
            ) AS vigencia,

            COALESCE(
                array_agg(DISTINCT status_de_execucao_da_obra ORDER BY status_de_execucao_da_obra) 
                FILTER (WHERE status_de_execucao_da_obra IS NOT NULL), 
                ARRAY[]::text[]
            ) AS status_de_execucao_da_obra
        FROM base;
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

    # Tratamento diferenciado caso o campo buscado seja o município (vindo da nova MV)
    if campo == "municipios_beneficiados":
        sql = f"""
            SELECT DISTINCT cod_municipio AS id, nome AS valor
            FROM {MV_MUNICIPIOS}
            WHERE nome IS NOT NULL
              AND nome ILIKE :termo
            ORDER BY valor
            LIMIT :limit
        """
        # Nota: Se o seu schema de resposta espera objetos com ID/Valor para municípios no autocomplete, ajuste conforme necessário.
    else:
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
            proponente,
            municipios_beneficiados,
            uf,
            link_transferegov,
            carteira_ativa,
            projeto_aprovado,
            possui_aio,
            coordenacao,
            acao,
            monitor,
            prazo_clausulas_suspensivas,
            prazo_emissao_lae,
            prazo_inicio_licitacao,
            prazo_conclusao_licitacao,
            prazo_vrpl,
            prazo_contratacao,
            prazo_solicitacao_aio,
            prazo_analise_tecnica_aio,
            prazo_analise_executiva_aio,
            prazo_registro_aio,
            prazo_emissao_os,
            prazo_inicio_execucao_fisica,
            prazo_progresso_fisico,
            prazo_indicio_paralisacao,
            status_paralisacao_obra,
            vistoria_in_loco_parciais,
            prazo_vistoria_final,
            obras_proximas_conclusao,
            registro_conclusao,
            vigencia,
            status_de_execucao_da_obra
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

@router.get("/data_dados", response_model=PontosControleDataDados, summary="Informa a data dos dados que alimenta os pontos de controle")
async def get_data_dados(
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "private, max-age=300"
    
    sql = f"""
        SELECT
            fonte,
            data_dados
        FROM public.tb_data_dados
        WHERE fonte IN ('transferegov', 'caixa')
    """

    result = await _execute_query(db, sql)

    return PontosControleDataDados(data=[dict(r) for r in result.mappings().all()])