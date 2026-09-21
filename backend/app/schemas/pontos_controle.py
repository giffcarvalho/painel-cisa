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
    cod_municipio: str  # <--- Ajustado para incluir o ID/Código do município
    municipio: str      # Nome do município

class PontosControleFiltrosResponse(BaseModel):
    nr_instrumento: list[str]
    proponente: list[str]
    municipios_beneficiados: list[MunicipioBeneficiadoFiltroItem]  # <--- Utiliza o novo item estruturado
    uf: list[str]
    carteira_ativa: list[str]
    projeto_aprovado: list[str]
    possui_aio: list[str]
    coordenacao: list[str]
    acao: list[str]
    monitor: list[str]
    prazo_clausulas_suspensivas: list[str]
    prazo_emissao_lae: list[str]
    prazo_inicio_licitacao: list[str]
    prazo_conclusao_licitacao: list[str]
    prazo_vrpl: list[str]
    prazo_contratacao: list[str]
    prazo_solicitacao_aio: list[str]
    prazo_analise_tecnica_aio: list[str]
    prazo_analise_executiva_aio: list[str]
    prazo_registro_aio: list[str]
    prazo_emissao_os: list[str]
    prazo_inicio_execucao_fisica: list[str]
    prazo_progresso_fisico: list[str]
    prazo_indicio_paralisacao: list[str]
    status_paralisacao_obra: list[str]
    vistoria_in_loco_parciais: list[str]
    prazo_vistoria_final: list[str]
    obras_proximas_conclusao: list[str]
    registro_conclusao: list[str]
    vigencia: list[str]
    status_de_execucao_da_obra: list[str]
    
    model_config = {"from_attributes": True}

class PontosControleBuscaFiltroResponse(BaseModel):
    campo: str
    termo: str
    data: list[str]

class PontosControleListaItem(PontosControleBase):
    nr_instrumento: str | None = None
    proponente: str | None = None
    municipios_beneficiados: str | None = None
    uf: str | None = None
    link_transferegov: str | None = None
    carteira_ativa: str | None = None
    projeto_aprovado: str | None = None
    possui_aio: str | None = None
    coordenacao: str | None = None
    acao: str | None = None
    monitor: str | None = None
    prazo_clausulas_suspensivas: str | None = None
    prazo_emissao_lae: str | None = None
    prazo_inicio_licitacao: str | None = None
    prazo_conclusao_licitacao: str | None = None
    prazo_vrpl: str | None = None
    prazo_contratacao: str | None = None
    prazo_solicitacao_aio: str | None = None
    prazo_analise_tecnica_aio: str | None = None
    prazo_analise_executiva_aio: str | None = None
    prazo_registro_aio: str | None = None
    prazo_emissao_os: str | None = None
    prazo_inicio_execucao_fisica: str | None = None
    prazo_progresso_fisico: str | None = None
    prazo_indicio_paralisacao: str | None = None
    status_paralisacao_obra: str | None = None
    vistoria_in_loco_parciais: str | None = None
    prazo_vistoria_final: str | None = None
    obras_proximas_conclusao: str | None = None
    registro_conclusao: str | None = None
    vigencia: str | None = None
    status_de_execucao_da_obra: str | None = None

class PontosControleListaResponse(BaseModel):
    total: int = Field(..., description="Total de registros sem paginação.")
    pagina: int
    tamanho_pagina: int
    data: list[PontosControleListaItem]

class PontosControleDataDadosItem(BaseModel):
    fonte: str | None = None
    data_dados: date | None = None

class PontosControleDataDados(BaseModel):
    data: list[PontosControleDataDadosItem]