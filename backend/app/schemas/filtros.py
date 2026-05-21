"""Schema dos filtros/segmentações do painel."""

from pydantic import BaseModel

class OpcoesFiltros(BaseModel):
    componentes: list[str]
    ufs: list[str]
    municipios: list[str]
    novo_pac: list[str]
    situacoes_obra: list[str]
    situacoes_contratacao: list[str]
    fase_instrumento: list[str]
    anos_proposta: list[str]
    nr_proposta: list[str]
    nr_instrumento: list[str]
    nome_proponente: list[str]
    termino_vigencia: list[str]
    nr_proposta_selecao_pac: list[str]
    carteira_ativa: list[str]
    tipos_instrumento: list[str]
    acoes_padronizadas: list[str]
    acoes_orcamentarias: list[str]

    model_config = {"from_attributes": True}

class BuscaFiltroResponse(BaseModel):
    campo: str
    termo: str
    data: list[str]
