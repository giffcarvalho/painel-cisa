"""Schema dos filtros/segmentações do mapa."""

from pydantic import BaseModel

class OpcoesFiltros(BaseModel):
    cod_uf: list[int]
    cod_municipio: list[int]
    nr_instrumento: list[int]
    tipos_instrumento: list[str]
    acoes_padronizadas: list[str]
    
    model_config = {"from_attributes": True}

class BuscaFiltroResponse(BaseModel):
    campo: str
    termo: str
    data: list[str]