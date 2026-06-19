"""Endpoints do Extrator de Dados."""

from __future__ import annotations

import io
import logging
from datetime import datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.extrator_catalogo import FIELD_BY_ID, TIPOS_TABELA, listar_campos
from app.schemas.extrator_dados import (
    CatalogoResponse,
    ExportRequest,
    FiltroBuscaResponse,
    FiltrosResponse,
    PreviewRequest,
    PreviewResponse,
    TiposTabelaResponse,
)

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill
    from openpyxl.utils import get_column_letter
except ImportError:  # pragma: no cover
    Workbook = None

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_EXPORT_ROWS = 50000

FILTROS_PERMITIDOS = {
    "municipio": {
        "sigla_uf": {
            "label": "UF",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "cod_municipio": {
            "label": "Município",
            "tipo": "integer",
            "cast": "int[]",
            "busca": True,
        },
        "regiao": {
            "label": "Região",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "semiarido_2022": {
            "label": "Semiárido",
            "tipo": "boolean",
            "cast": "boolean[]",
            "busca": False,
        },
        "amazonia_legal": {
            "label": "Amazônia Legal",
            "tipo": "boolean",
            "cast": "boolean[]",
            "busca": False,
        },
        "vale_jequetinhonha": {
            "label": "Vale do Jequitinhonha",
            "tipo": "boolean",
            "cast": "boolean[]",
            "busca": False,
        },
    },
    "setor_censitario": {
        "sigla_uf": {
            "label": "UF",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "cod_municipio": {
            "label": "Município",
            "tipo": "integer",
            "cast": "int[]",
            "busca": True,
        },
        "regiao": {
            "label": "Região",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "semiarido_2022": {
            "label": "Semiárido",
            "tipo": "boolean",
            "cast": "boolean[]",
            "busca": False,
        },
        "amazonia_legal": {
            "label": "Amazônia Legal",
            "tipo": "boolean",
            "cast": "boolean[]",
            "busca": False,
        },
        "situacao": {
            "label": "Situação",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "situacao_detalhada": {
            "label": "Situação detalhada",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "tipo": {
            "label": "Tipo",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "com_dados": {
            "label": "Com dados",
            "tipo": "boolean",
            "cast": "boolean[]",
            "busca": False,
        },
        "com_pessoas": {
            "label": "Com pessoas",
            "tipo": "boolean",
            "cast": "boolean[]",
            "busca": False,
        },
        "todos_dados_omitidos": {
            "label": "Dados omitidos",
            "tipo": "boolean",
            "cast": "boolean[]",
            "busca": False,
        },
    },
    "instrumento": {
        "uf": {
            "label": "UF",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "situacao_contratacao": {
            "label": "Situação da contratação",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "fase_instrumento": {
            "label": "Fase do instrumento",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "acao_padronizada": {
            "label": "Ação",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "tipo_instrumento": {
            "label": "Tipo de instrumento",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "nome_proponente": {
            "label": "Proponente",
            "tipo": "text",
            "cast": "text[]",
            "busca": True,
        },
        "ano_proposta": {
            "label": "Ano da proposta",
            "tipo": "integer",
            "cast": "int[]",
            "busca": False,
        },
        "nr_proposta": {
            "label": "Número da proposta",
            "tipo": "text",
            "cast": "text[]",
            "busca": True,
            "sql": "nr_proposta::text",
        },
        "nr_instrumento": {
            "label": "Número do instrumento",
            "tipo": "text",
            "cast": "text[]",
            "busca": True,
            "sql": "nr_instrumento::text",
        },
        "operacao": {
            "label": "Operação",
            "tipo": "text",
            "cast": "text[]",
            "busca": True,
            "sql": "operacao::text",
        },
        "carteira_ativa": {
            "label": "Carteira ativa",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "novo_pac": {
            "label": "Novo PAC",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "componente": {
            "label": "Componente",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
        "coordenacao": {
            "label": "Coordenação",
            "tipo": "text",
            "cast": "text[]",
            "busca": False,
        },
    },
}

def _view(tipo_tabela: str) -> str:
    config = TIPOS_TABELA.get(tipo_tabela)
    if not config:
        raise HTTPException(status_code=400, detail="Tipo de tabela invalido.")
    return config["view"]

async def _execute_query(db: AsyncSession, sql: str, params: dict | None = None):
    try:
        return await db.execute(text(sql), params or {})
    except SQLAlchemyError as exc:
        logger.exception("Erro no banco de dados do Extrator: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao consultar a base de dados.",
        )

def _normalizar_lista(value: Any) -> list[Any]:
    if value is None or value == "":
        return []
    if isinstance(value, list):
        return [item for item in value if item not in (None, "")]
    return [value]

def _campos_solicitados(tipo_tabela: str, field_ids: list[str]) -> list[dict]:
    campos: list[dict] = []

    for field_id in field_ids:
        campo = FIELD_BY_ID.get(field_id)
        if not campo or campo["tipo_tabela"] != tipo_tabela or not campo["exportavel"]:
            raise HTTPException(
                status_code=400,
                detail=f"Campo nao permitido para esta tabela: {field_id}",
            )
        campos.append(campo)

    return campos

def _build_select(campos: list[dict]) -> str:
    return ",\n            ".join(
        f'{campo["column"]} AS "{campo["id"]}"'
        for campo in campos
    )

def _build_where(tipo_tabela: str, filtros: dict[str, Any]) -> tuple[str, dict]:
    permitidos = FILTROS_PERMITIDOS[tipo_tabela]
    clauses: list[str] = []
    params: dict[str, Any] = {}

    for filtro, raw_value in (filtros or {}).items():
        if filtro not in permitidos:
            raise HTTPException(
                status_code=400,
                detail=f"Filtro nao permitido para {tipo_tabela}: {filtro}",
            )

        values = _normalizar_lista(raw_value)
        if not values:
            continue

        config = permitidos[filtro]
        param_key = f"f_{filtro}"
        sql_column = config.get("sql", filtro)

        if config["tipo"] == "integer":
            try:
                params[param_key] = [int(v) for v in values]
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail=f"Filtro {filtro} deve ser numerico.")
        elif config["tipo"] == "boolean":
            params[param_key] = [str(v).lower() in {"true", "1", "sim"} for v in values]
        else:
            params[param_key] = [str(v).strip() for v in values if str(v).strip()]

        clauses.append(f"{sql_column} = ANY(CAST(:{param_key} AS {config['cast']}))")

    return ("WHERE " + " AND ".join(clauses), params) if clauses else ("", params)

def _order_by(tipo_tabela: str) -> str:
    columns = TIPOS_TABELA[tipo_tabela]["ordem"]
    return ", ".join(columns)

async def _count_rows(db: AsyncSession, tipo_tabela: str, where: str, params: dict) -> int:
    result = await _execute_query(
        db,
        f"""
        SELECT COUNT(*)
        FROM {_view(tipo_tabela)}
        {where}
        """,
        params,
    )
    return int(result.scalar_one() or 0)

async def _metadata(db: AsyncSession, tipo_tabela: str, where: str, params: dict) -> dict[str, Any]:
    if tipo_tabela != "instrumento":
        return {}

    result = await _execute_query(
        db,
        f"""
        SELECT
            MAX(data_dados_transferegov) AS data_dados_transferegov,
            MAX(data_dados_caixa) AS data_dados_caixa
        FROM {_view(tipo_tabela)}
        {where}
        """,
        params,
    )
    row = dict(result.mappings().one())
    return jsonable_encoder(row)

def _formatar_filtros(tipo_tabela: str, filtros: dict[str, Any]) -> str:
    if not filtros:
        return "Sem filtros aplicados"

    permitidos = FILTROS_PERMITIDOS.get(tipo_tabela, {})
    partes = []

    for key, value in filtros.items():
        values = _normalizar_lista(value)
        if not values:
            continue

        label = permitidos.get(key, {}).get("label", key)
        valores_formatados = []

        for item in values:
            if isinstance(item, bool):
                valores_formatados.append("Sim" if item else "Não")
            elif str(item).lower() == "true":
                valores_formatados.append("Sim")
            elif str(item).lower() == "false":
                valores_formatados.append("Não")
            else:
                valores_formatados.append(str(item))

        partes.append(f"{label}: {', '.join(valores_formatados)}")

    return "; ".join(partes) if partes else "Sem filtros aplicados"

@router.get("/tipos-tabela", response_model=TiposTabelaResponse)
async def get_tipos_tabela(response: Response):
    response.headers["Cache-Control"] = "public, max-age=3600"
    return {
        "data": [
            {"id": key, "label": value["label"], "descricao": value["descricao"]}
            for key, value in TIPOS_TABELA.items()
        ]
    }

@router.get("/catalogo", response_model=CatalogoResponse)
async def get_catalogo(tipo_tabela: str, response: Response):
    if tipo_tabela not in TIPOS_TABELA:
        raise HTTPException(status_code=400, detail="Tipo de tabela invalido.")
    response.headers["Cache-Control"] = "public, max-age=3600"
    return {"tipo_tabela": tipo_tabela, "data": listar_campos(tipo_tabela)}

@router.get("/filtros", response_model=FiltrosResponse)
async def get_filtros(tipo_tabela: str, response: Response, db: AsyncSession = Depends(get_db)):
    if tipo_tabela not in TIPOS_TABELA:
        raise HTTPException(status_code=400, detail="Tipo de tabela invalido.")

    response.headers["Cache-Control"] = "public, max-age=1800"

    filtros_config = FILTROS_PERMITIDOS[tipo_tabela]
    select_parts = []
    for campo, config in filtros_config.items():
        if config.get("busca"):
            continue
        sql_column = config.get("sql", campo)
        select_parts.append(
            f"array_remove(array_agg(DISTINCT {sql_column} ORDER BY {sql_column}), NULL) AS {campo}"
        )

    if not select_parts:
        return {"tipo_tabela": tipo_tabela, "data": []}

    result = await _execute_query(
        db,
        f"""
        SELECT
            {", ".join(select_parts)}
        FROM {_view(tipo_tabela)}
        """,
    )
    row = dict(result.mappings().one())

    return {
        "tipo_tabela": tipo_tabela,
        "data": [
            {
                "campo": campo,
                "label": config["label"],
                "tipo_dado": config["tipo"],
                "opcoes": row.get(campo) or [],
                "busca": config.get("busca", False),
            }
            for campo, config in filtros_config.items()
        ],
    }

@router.get("/filtros/busca", response_model=FiltroBuscaResponse)
async def buscar_filtro(
    tipo_tabela: str,
    campo: str,
    response: Response,
    q: str = Query("", max_length=100),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    if tipo_tabela not in TIPOS_TABELA:
        raise HTTPException(status_code=400, detail="Tipo de tabela invalido.")

    config = FILTROS_PERMITIDOS[tipo_tabela].get(campo)
    if not config or not config.get("busca"):
        raise HTTPException(status_code=400, detail="Filtro de busca nao permitido.")

    response.headers["Cache-Control"] = "private, max-age=120"

    value_expr = config.get("sql", campo)

    if campo == "cod_municipio":
        nome_col = "nome" if tipo_tabela == "municipio" else "nome_municipio"
        label_expr = f"({nome_col} || ' - ' || sigla_uf)"
        search_expr = f"(CAST({value_expr} AS text) || ' ' || COALESCE({nome_col}, '') || ' ' || COALESCE(sigla_uf, ''))"
    else:
        label_expr = f"CAST({value_expr} AS text)"
        search_expr = f"CAST({value_expr} AS text)"

    termo = q.strip()

    result = await _execute_query(
        db,
        f"""
        SELECT DISTINCT
            CAST({value_expr} AS text) AS value,
            {label_expr} AS label
        FROM {_view(tipo_tabela)}
        WHERE {value_expr} IS NOT NULL
          AND (:q = '' OR {search_expr} ILIKE :q_like)
        ORDER BY label
        LIMIT :limit
        """,
        {
            "q": termo,
            "q_like": f"%{termo}%",
            "limit": limit,
        },
    )

    return {
        "tipo_tabela": tipo_tabela,
        "campo": campo,
        "data": [dict(row) for row in result.mappings().all()],
    }

@router.post("/previa", response_model=PreviewResponse)
async def post_previa(payload: PreviewRequest, db: AsyncSession = Depends(get_db)):
    campos = _campos_solicitados(payload.tipo_tabela, payload.field_ids)
    select_sql = _build_select(campos)
    where, params = _build_where(payload.tipo_tabela, payload.filtros)

    total = await _count_rows(db, payload.tipo_tabela, where, params)
    metadados = await _metadata(db, payload.tipo_tabela, where, params)

    data_params = {**params, "limit": payload.limit}

    result = await _execute_query(
        db,
        f"""
        SELECT
            {select_sql}
        FROM {_view(payload.tipo_tabela)}
        {where}
        ORDER BY {_order_by(payload.tipo_tabela)}
        LIMIT :limit
        """,
        data_params,
    )

    return {
        "tipo_tabela": payload.tipo_tabela,
        "total_estimado": total,
        "limit": payload.limit,
        "columns": campos,
        "data": jsonable_encoder([dict(row) for row in result.mappings().all()]),
        "metadados": metadados,
    }

@router.post("/exportar/excel")
async def post_exportar_excel(payload: ExportRequest, db: AsyncSession = Depends(get_db)):
    if Workbook is None:
        raise HTTPException(
            status_code=500,
            detail="A dependencia openpyxl nao esta instalada no backend.",
        )

    campos = _campos_solicitados(payload.tipo_tabela, payload.field_ids)
    select_sql = _build_select(campos)
    where, params = _build_where(payload.tipo_tabela, payload.filtros)

    total = await _count_rows(db, payload.tipo_tabela, where, params)
    if total > MAX_EXPORT_ROWS:
        raise HTTPException(
            status_code=413,
            detail=f"A exportacao possui {total} linhas. Refine os filtros ou limite a extracao a ate {MAX_EXPORT_ROWS} linhas.",
        )

    metadados = await _metadata(db, payload.tipo_tabela, where, params)

    result = await _execute_query(
        db,
        f"""
        SELECT
            {select_sql}
        FROM {_view(payload.tipo_tabela)}
        {where}
        ORDER BY {_order_by(payload.tipo_tabela)}
        """,
        params,
    )
    rows = [dict(row) for row in result.mappings().all()]

    wb = Workbook()
    ws = wb.active
    ws.title = "Extrator"

    tipo_label = TIPOS_TABELA[payload.tipo_tabela]["label"]
    data_extracao = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    header_rows = [
        ["Portal DSR"],
        ["Extrator de Dados"],
        ["Tipo de tabela", tipo_label],
        ["Data e hora da extracao", data_extracao],
        ["Filtros aplicados", _formatar_filtros(payload.tipo_tabela, payload.filtros)],
        ["Colunas selecionadas", ", ".join(campo["label"] for campo in campos)],
    ]

    if payload.tipo_tabela == "instrumento":
        header_rows.append(["Data dados Transferegov", metadados.get("data_dados_transferegov") or ""])
        header_rows.append(["Data dados Caixa", metadados.get("data_dados_caixa") or ""])

    for row in header_rows:
        ws.append(row)

    ws.append([])
    table_header_row = ws.max_row + 1
    ws.append([campo["label"] for campo in campos])

    fill = PatternFill("solid", fgColor="1E3A8A")
    white_font = Font(color="FFFFFF", bold=True)
    for cell in ws[table_header_row]:
        cell.fill = fill
        cell.font = white_font

    for row in rows:
        ws.append([row.get(campo["id"]) for campo in campos])

    for idx, campo in enumerate(campos, start=1):
        letter = get_column_letter(idx)
        ws.column_dimensions[letter].width = min(max(len(campo["label"]) + 4, 14), 45)

        if campo["formato"] == "brl":
            for cell in ws[table_header_row + 1: ws.max_row]:
                cell[idx - 1].number_format = 'R$ #,##0.00'
        elif campo["formato"] == "percent":
            for cell in ws[table_header_row + 1: ws.max_row]:
                cell[idx - 1].number_format = '0.00%'

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"extrator_dados_{payload.tipo_tabela}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )