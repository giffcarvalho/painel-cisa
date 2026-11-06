"""Contratos de seleção e de substituição integral da distribuição."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Valores = Annotated[
    list[Annotated[str, Field(min_length=1, max_length=250)]],
    Field(max_length=500),
]
Ids = Annotated[list[Annotated[int, Field(gt=0)]], Field(max_length=10000)]
Chaves = Annotated[
    list[Annotated[str, Field(min_length=1, max_length=150)]],
    Field(max_length=100000),
]


class FiltrosDistribuicao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ufs: Ids = Field(default_factory=list)
    municipios: Ids = Field(default_factory=list)
    monitores: Ids = Field(default_factory=list)
    setores: Ids = Field(default_factory=list)
    posicoes: list[Literal[1, 2, 3]] = Field(default_factory=list, max_length=3)
    sem_monitor: bool = False
    nr_instrumento: Valores = Field(default_factory=list)
    nr_proposta: Valores = Field(default_factory=list)
    tipo_instrumento: Valores = Field(default_factory=list)
    situacao_atual: Valores = Field(default_factory=list)
    carteira_ativa: Valores = Field(default_factory=list)
    novo_pac: Valores = Field(default_factory=list)
    ano_proposta: Valores = Field(default_factory=list)
    operacao: Valores = Field(default_factory=list)
    nome_proponente: Valores = Field(default_factory=list)


class SelecaoDistribuicao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    # União de uma consulta capturada com inclusões explícitas, menos exclusões.
    filtros: FiltrosDistribuicao | None = None
    incluidos: Chaves = Field(default_factory=list)
    excluidos: Chaves = Field(default_factory=list)


class ConsultaDistribuicao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    filtros: FiltrosDistribuicao = Field(default_factory=FiltrosDistribuicao)
    selecao: SelecaoDistribuicao = Field(default_factory=SelecaoDistribuicao)
    somente_selecao: bool = False
    limit: int = Field(default=25, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class MonitorDistribuicao(BaseModel):
    id_usuario: int
    nome: str
    # Nulos expõem um eventual vínculo órfão; não equivalem a cadastro desativado.
    ativo: bool | None
    perfil: str | None
    conta_ativada: bool | None = None
    cadastro_encontrado: bool = True
    id_setor: int | None = None
    ordem_prioridade: int | None = None


class TerritorioDistribuicao(BaseModel):
    cod_municipio: int
    municipio: str
    uf: str


class InstrumentoDistribuicao(BaseModel):
    chave: str
    numero: str
    nr_proposta: str | None = None
    tipo_instrumento: str | None = None
    atributos: dict
    territorios: list[TerritorioDistribuicao] = Field(default_factory=list)
    monitores: list[MonitorDistribuicao]
    rascunhos: int
    alertas: list[str]
    selecionado: bool


class ConsultaDistribuicaoResponse(BaseModel):
    items: list[InstrumentoDistribuicao]
    total: int
    total_no_filtro: int
    selecionados: int
    selecionados_no_filtro: int
    limit: int
    offset: int


IdDestino = Annotated[int, Field(strict=True, gt=0, le=2147483647)]


class DistribuicaoFinal(BaseModel):
    model_config = ConfigDict(extra="forbid")
    principal: IdDestino
    # Campos obrigatórios: null significa uma posição explicitamente vazia.
    reserva_1: IdDestino | None
    reserva_2: IdDestino | None

    @model_validator(mode="after")
    def validar_posicoes(self):
        ids = [v for v in (self.principal, self.reserva_1, self.reserva_2) if v is not None]
        if len(ids) != len(set(ids)):
            raise ValueError("O mesmo monitor não pode ocupar duas posições.")
        if self.reserva_2 is not None and self.reserva_1 is None:
            raise ValueError("Reserva 2 exige Reserva 1.")
        return self


class PreviaDistribuicao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    instrumentos: Annotated[
        list[Annotated[str, Field(strict=True, min_length=1, max_length=150)]],
        Field(min_length=1, max_length=1000),
    ]
    distribuicao: DistribuicaoFinal

    @model_validator(mode="after")
    def validar_selecao(self):
        if len(set(self.instrumentos)) != len(self.instrumentos):
            raise ValueError("A seleção não pode conter instrumentos duplicados.")
        if any(c != c.strip() or ":" not in c for c in self.instrumentos):
            raise ValueError("Referência de instrumento inválida.")
        return self


class AplicarDistribuicao(PreviaDistribuicao):
    versao: Annotated[str, Field(strict=True, min_length=1, max_length=4096)]
