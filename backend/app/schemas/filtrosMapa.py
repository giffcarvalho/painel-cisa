"""Schema dos filtros/segmentações do mapa."""

from pydantic import BaseModel


class UfItem(BaseModel):
    cod_uf: int
    sigla_uf: str

class OpcoesFiltrosUf(BaseModel):
    data: list[UfItem]
    
class MunicipioItem(BaseModel):
    cod_municipio: int
    nome_municipio: str

class OpcoesFiltrosMunicipio(BaseModel):
    data: list[MunicipioItem]