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
    nr_instrumento: str

class OpcoesFiltrosNrInstrumento(BaseModel):
    data: list[NrInstrumentoItem]


class CodTciItem(BaseModel):
    cod_tci: str

class OpcoesFiltrosCodTci(BaseModel):
    data: list[CodTciItem]


class ModalidadeItem(BaseModel):
    modalidade: str

class OpcoesFiltrosModalidade(BaseModel):
    data: list[ModalidadeItem]


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
    


class DadosMunicipiosItem(BaseModel):
    cod_municipio: int
    nome: str
    label_catmetropol: str | None = None
    rm_prioritaria: str | None = None
    subgrupo: str | None = None
    populacao_total_censo_2022: int | None = None

class ListaDadosMunicipios(BaseModel):
    data: list[DadosMunicipiosItem]