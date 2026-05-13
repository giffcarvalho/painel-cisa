"""Contratos de resposta para todos os endpoints de gráficos da Carteira DSR."""

from decimal import Decimal
from pydantic import BaseModel, Field

# Gráfico de Valores por UF -- Barras Empilhadas Horizontais
class ValoresPorUFItem(BaseModel):
    uf: str = Field(..., description="Sigla do estado (ex: 'SP').")
    desembolsado: Decimal
    empenhado_a_desembolsar: Decimal
    a_empenhar: Decimal
    contrapartida: Decimal

    model_config = {"from_attributes": True}

class ValoresPorUFResponse(BaseModel):
    data: list[ValoresPorUFItem]

# Gráfico de Valores por Ação -- Barras Empilhadas Verticais
class ValoresPorAcaoItem(BaseModel):
    acao_padronizada: str
    desembolsado: Decimal
    empenhado_a_desembolsar: Decimal
    a_empenhar: Decimal
    contrapartida: Decimal

    model_config = {"from_attributes": True}

class ValoresPorAcaoResponse(BaseModel):
    data: list[ValoresPorAcaoItem]

# Gráfico de Quantidade de Instrumentos por Ação -- Barras Verticais
class InstrumentosPorAcaoItem(BaseModel):
    acao_padronizada: str
    qtde_instrumentos: int

    model_config = {"from_attributes": True}

class InstrumentosPorAcaoResponse(BaseModel):
    data: list[InstrumentosPorAcaoItem]

#Gráfico de Valor Global por Tipo de Instrumento -- Gráfico de Rosca
class ValorPorTipoItem(BaseModel):
    tipo_instrumento: str
    valor_global: Decimal

    model_config = {"from_attributes": True}

class ValorPorTipoResponse(BaseModel):
    data: list[ValorPorTipoItem]

# Gráfico de Instrumentos por Fase de Execução -- Barras
class InstrumentosPorFaseItem(BaseModel):
    fase_instrumento: str
    qtde_instrumentos: int

    model_config = {"from_attributes": True}

class InstrumentosPorFaseResponse(BaseModel):
    data: list[InstrumentosPorAcaoItem]

# Gráfico de Instrumentos por Situação de Contratação -- Gráfico de Rosca
class InstrumentosPorSituacaoItem(BaseModel):
    situacao_contratacao: str
    qtde_instrumentos: int

    model_config = {"from_attributes": True}

class InstrumentosPorSituacaoResponse(BaseModel):
    data: list[InstrumentosPorSituacaoItem]

# Valor global Proporcional por UF -- Mapa coroplético
class MapaCoropleticoItem(BaseModel):
    uf: str
    valor_global_proporcional: Decimal
    qtde_instrumentos: int

    model_config = {"from_attributes": True}

class MapaCoropleticoResponse(BaseModel):
    data: list[MapaCoropleticoItem]

# Coordenadas dos Municípios Beneficiados -- Mapa de Pontos
class MapaPontosItem(BaseModel):
    acao_padronizada: str | None
    latitude_sede: float | None
    longitude_sede: float | None
    nome_municipio: str | None

    model_config = {"from_attributes": True}

class MapaPontosResponse(BaseModel):
    total: int
    data: list[MapaPontosItem]