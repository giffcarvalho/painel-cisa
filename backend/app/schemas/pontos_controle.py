"""Contratos da Pesquisa por Instrumento"""

from datetime import date
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, Field, model_validator

class PontosControleBase(BaseModel):
    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def limpar_sujeira_banco(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return {
                k: (None if isinstance(v, str) and not v.strip() else v)
                for k, v in data.items()
            }
        return data

class MunicipioBeneficiadoFiltroItem(BaseModel):
    municipio: str
    uf: str


class PontosControleFiltrosResponse(BaseModel):
    monitor: list[str]
    municipios_beneficiados: list[MunicipioBeneficiadoFiltroItem]
    nr_instrumento: list[str]
    uf: list[str]
    acao: list[str]

    model_config = {"from_attributes": True}


class PontosControleBuscaFiltroResponse(BaseModel):
    campo: str
    termo: str
    data: list[str]


class PontosControleListaItem(PontosControleBase):
    nr_instrumento: str | None = None
    municipios_beneficiados: str | None = None
    uf: str | None = None
    carteira_ativa: str | None = None
    possui_aio: str | None = None
    projeto_aprovado: str | None = None
    acao: str | None = None
    coordenacao: str | None = None
    monitor: str | None = None
    

class PontosControleListaResponse(BaseModel):
    total: int = Field(..., description="Total de registros sem paginação.")
    pagina: int
    tamanho_pagina: int
    data: list[PontosControleListaItem]