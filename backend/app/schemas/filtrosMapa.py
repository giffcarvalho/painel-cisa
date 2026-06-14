"""Schema dos filtros/segmentações do mapa."""

from pydantic import BaseModel


class UfItem(BaseModel):
    cod_uf: int
    sigla_uf: str

class OpcoesFiltrosUf(BaseModel):
    data: list[UfItem]
    
class MunicipioItem(BaseModel):
    cod_municipio: int
    nome: str

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


class LocalidadeItem(BaseModel):
    cod_localidade: int
    nome_localidade: str

class OpcoesFiltrosLocalidade(BaseModel):
    data: list[LocalidadeItem]


class LocalidadeEnderecoItem(BaseModel):
    cod_dsc_localidade: int
    dsc_localidade: str

class OpcoesFiltrosLocalidadeEndereco(BaseModel):
    data: list[LocalidadeEnderecoItem]


class CategoriaMetropolitanaItem(BaseModel):
    cod_catmetropol: int
    label_catmetropol: str

class OpcoesFiltrosCategoriaMetropolitana(BaseModel):
    data: list[CategoriaMetropolitanaItem]


class InvestimentoSaneamentoItem(BaseModel):
    id: str
    cod_municipio: int
    descricao: str
    orgao: str | None = None
    link_transferegov: str | None = None
    link_obrasgov: str | None = None

class ListaInvestimentoSaneamento(BaseModel):
    data: list[InvestimentoSaneamentoItem]
    