"""Schema dos filtros/segmentações do mapa."""

from pydantic import BaseModel

class OpcoesFiltros(BaseModel):
    ufs: list[str]
    municipios: list[str]
    nr_instrumento: list[str]
    tipos_instrumento: list[str]
    acoes_padronizadas: list[str]
    
    model_config = {"from_attributes": True}

class BuscaFiltroResponse(BaseModel):
    campo: str
    termo: str
    data: list[str]