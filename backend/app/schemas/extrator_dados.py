"""Contratos do extrator de dados."""

from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator

TipoTabela = Literal["municipio", "setor_censitario", "instrumento"]

class CampoCatalogo(BaseModel):
    id: str
    label: str
    view: str
    column: str
    tipo_tabela: TipoTabela
    grupo: str
    tipo_dado: Literal["text", "integer", "decimal", "currency",  "percent", "date", "boolean"]
    formato: Literal["text", "integer", "decimal", "brl", "percent", "date", "datetime", "boolean"]
    visivel: bool
    exportavel: bool
    padrao: bool
    descricao: str = ""

class TipoTabelaItem(BaseModel):
    id: TipoTabela
    label: str
    descricao: str

class TiposTabelaResponse(BaseModel):
    data: list[TipoTabelaItem]

class CatalogoResponse(BaseModel):
    tipo_tabela: TipoTabela
    data: list[CampoCatalogo]

class FiltroOpcoesItem(BaseModel):
    campo: str
    label: str
    tipo_dado: str
    opcoes: list[Any] = Field(default_factory=list)
    busca: bool = False

class FiltrosResponse(BaseModel):
    tipo_tabela: TipoTabela
    data: list[FiltroOpcoesItem]

class ExtratorRequest(BaseModel):
    tipo_tabela: TipoTabela
    field_ids: list[str] = Field(min_length=1, max_length=80)
    filtros: dict[str, list[Any] | Any] = Field(default_factory=dict)

    @field_validator("field_ids")
    @classmethod
    def validar_field_ids_unicos(cls, value: list[str]) -> list[str]:
        clean = [item.strip() for item in value if item and item.strip()]
        if not clean: 
            raise ValueError("Selecione pelo menos uma coluna.")
        if len(set(clean)) != len(clean):
            raise ValueError("A lista de colunas possui campos repetidos.")
        return clean
    
class PreviewRequest(ExtratorRequest):
    limit: int = Field(default=100, ge=1, le=500)

class PreviewResponse(BaseModel):
    tipo_tabela: TipoTabela
    total_estimado: int
    limit: int
    columns: list[CampoCatalogo]
    data: list[dict[str, Any]]
    metadados: dict[str,Any] = Field(default_factory=dict)

class ExportRequest(ExtratorRequest):
    formato: Literal["xlsx"] = "xlsx"