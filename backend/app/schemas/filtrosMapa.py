"""Schema dos filtros/segmentações do mapa."""

from pydantic import BaseModel, field_validator
from typing import Literal


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



#modelo dos dados da última análise das coordenadas
class DadosAnaliseCoordenadasItem(BaseModel):
    id_coordenada: int
    cod_tci: str
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    latitude: float
    longitude: float
    situacao_analise: str | None = None
    situacao_correcao: str | None = None
    observacao_geral: str | None = None
    

class ListaDadosAnaliseCoordenadas(BaseModel):
    data: list[DadosAnaliseCoordenadasItem]


#modelo dos dados que vão ser inseridos em tb_revisao_instrumento_coordenada
#também é o modelo dos dados que são buscados pela função que faz um select na ultima situacao da analise e filtra somente as alteradas
class CoordenadaAnaliseCreate(BaseModel):
    id_coordenada: int
    cod_tci: str
    situacao_analise: Literal[
        "Correta",
        "Município errado",
        "Local genérico - sede",
        "Local incoerente",
        "Incoerência urbano/rural",
        "Sem análise"
    ]


class AnaliseCoordenadasCreate(BaseModel):
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    cod_tci: str | None = None
    observacao_geral: str | None = None
    situacao_correcao: str | None = "Não"
    coordenadas: list[CoordenadaAnaliseCreate]

    @field_validator("observacao_geral", mode="before")
    @classmethod
    def sanitizar_observacao(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v


class AnaliseCoordenadasSalvaResponse(BaseModel):
    id_revisao: int | None = None
    mensagem: str