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


class NrPropostaItem(BaseModel):
    nr_proposta: str

class OpcoesFiltrosNrProposta(BaseModel):
    data: list[NrPropostaItem]


class NrInstrumentoItem(BaseModel):
    nr_instrumento: int

class OpcoesFiltrosNrInstrumento(BaseModel):
    data: list[NrInstrumentoItem]


    