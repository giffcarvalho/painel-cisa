"""Contratos da Pesquisa por Instrumento"""

from datetime import date
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, Field, model_validator

class PesquisaInstrumentoBase(BaseModel):
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


class PesquisaInstrumentoFiltrosResponse(BaseModel):
    nome_proponente: list[str]
    municipios_beneficiados: list[str]
    nr_instrumento: list[str]
    nr_proposta: list[str]
    operacao: list[str]

    model_config = {"from_attributes": True}


class PesquisaInstrumentoBuscaFiltroResponse(BaseModel):
    campo: str
    termo: str
    data: list[str]


class PesquisaInstrumentoListaItem(PesquisaInstrumentoBase):
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    operacao: str | None = None
    tipo_instrumento: str | None = None
    nome_proponente: str | None = None
    uf: str | None = None
    municipios_beneficiados: str | None = None
    valor_global: Decimal | None = None
    valor_repasse: Decimal | None = None
    situacao_obra: str | None = None
    situacao_atual: str | None = None

class PesquisaInstrumentoListaResponse(BaseModel):
    total: int = Field(..., description="Total de registros sem paginação.")
    pagina: int
    tamanho_pagina: int
    data: list[PesquisaInstrumentoListaItem]


class PesquisaInstrumentoDetalhe(PesquisaInstrumentoBase):
    nr_proposta: str | None = None
    nr_instrumento: str | None = None
    tipo_instrumento: str | None = None
    nome_proponente: str | None = None
    uf: str | None = None
    objeto: str | None = None
    municipios_beneficiados: str | None = None
    qtde_municipios: int | None = None
    valor_global: Decimal | None = None
    valor_repasse: Decimal | None = None
    valor_contrapartida: Decimal | None = None
    valor_empenhado: Decimal | None = None
    valor_desembolsado: Decimal | None = None
    valor_desbloqueado: Decimal | None = None
    valor_a_empenhar: Decimal | None = None
    valor_a_desembolsar: Decimal | None = None
    dia_assin_conv: date | None = None
    dia_fim_vigenc_conv: date | None = None
    motivo_suspensao: str | None = None
    data_suspensiva: date | None = None
    liminar_judicial: str | None = None
    situacao_projeto: str | None = None
    data_aceite_projeto: date | None = None
    situacao_obra: str | None = None
    primeira_data_emissao_aio: date | None = None
    percentual_fisico_informado: Decimal | None = None
    data_ultimo_bm: date | None = None
    percentual_fisico_aferido: Decimal | None = None
    data_ultima_vistoria: date | None = None
    percentual_financeiro_desbloqueado: Decimal | None = None
    data_ultimo_desbloqueio: date | None = None
    data_ultima_obtv: date | None = None
    situacao_atual: str | None = None
    data_dados_transferegov: date | None = None
    data_dados_caixa: date | None = None
    operacao: str | None = None