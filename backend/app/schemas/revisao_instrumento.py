"""Contratos da revisão de instrumentos DSR."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


TipoInstrumento = Literal["contrato_repasse", "termo_compromisso", "ted"]
OrigemRegistro = Literal["base_atual", "adicionado_tecnico"]
AcaoMunicipio = Literal["manter", "remover", "adicionar"]
AcaoLocalidade = Literal["manter", "remover", "adicionar", "corrigir"]
RelacaoInstrumentoObra = Literal[
    "nao_analisada",
    "sem_conflito_aparente",
    "possivel_sobreposicao",
]
ConfirmacaoStatusObra = Literal[
    "nao_confirmada",
    "sem_conflito",
    "sobreposicao_confirmada",
]
StatusRevisao = Literal["rascunho", "enviado"]


class RevisaoInstrumentoBase(BaseModel):
    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def limpar_strings_vazias(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return {
                key: None if isinstance(value, str) and not value.strip() else value
                for key, value in data.items()
            }
        return data


class InstrumentoRevisaoInfo(RevisaoInstrumentoBase):
    identificador_busca: str = Field(..., min_length=1, max_length=100)
    tipo_instrumento: TipoInstrumento

    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    nr_ted: int | None = None

    tipo_obra: str | None = None
    objeto: str | None = None
    nome_proponente: str | None = None
    orgao: str | None = None
    uf: str | None = None
    situacao_atual: str | None = None
    link_transferegov: str | None = None
    link_saci: str | None = None

    dados_oficiais: dict[str, Any] | None = None


class LocalidadeRevisaoItem(RevisaoInstrumentoBase):
    id_revisao_localidade: int | None = None
    cod_municipio: int | None = None
    cod_comunidade_rural: int | None = None

    nome_localidade: str | None = None
    nome_localidade_informada: str | None = Field(default=None, max_length=255)

    origem_registro: OrigemRegistro = "base_atual"
    acao_sugerida: AcaoLocalidade | None = None

    qtde_familias_ben_original: int | None = None
    qtde_familias_ben_sugerida: int | None = None

    justificativa: str | None = None
    conferido_em: datetime | None = None


class ObraSaneamentoRevisaoItem(RevisaoInstrumentoBase):
    id_revisao_obra: int | None = None
    id_obra: str
    cod_municipio: int | None = None

    descricao: str | None = None
    orgao: str | None = None
    link_transferegov: str | None = None
    link_obrasgov: str | None = None
    populacao_beneficiada: str | None = None
    desc_populacao_beneficiada: str | None = None
    populacao_beneficiada_revisada: str | None = None
    desc_populacao_beneficiada_revisada: str | None = None

    relacao_instrumento: RelacaoInstrumentoObra | None = None
    confirmacao_status: ConfirmacaoStatusObra | None = None
    justificativa: str | None = None
    conferido_em: datetime | None = None

    @model_validator(mode="after")
    def validar_confirmacao_status(self):
        if self.relacao_instrumento in (None, "nao_analisada"):
            self.confirmacao_status = None
            return self

        if self.confirmacao_status is None:
            self.confirmacao_status = "nao_confirmada"

        return self


class LocalidadeRevisaoAlteracao(RevisaoInstrumentoBase):
    id_revisao_localidade: int | None = None
    cod_municipio: int | None = None
    cod_comunidade_rural: int | None = None

    nome_localidade: str | None = None
    nome_localidade_informada: str | None = Field(default=None, max_length=255)

    origem_registro: OrigemRegistro = "base_atual"
    acao_sugerida: AcaoLocalidade

    qtde_familias_ben_original: int | None = None
    qtde_familias_ben_sugerida: int | None = None

    justificativa: str | None = None


class ObraSaneamentoRevisaoAlteracao(RevisaoInstrumentoBase):
    id_revisao_obra: int | None = None
    id_obra: str
    cod_municipio: int | None = None

    descricao: str | None = None
    orgao: str | None = None
    link_transferegov: str | None = None
    link_obrasgov: str | None = None
    populacao_beneficiada: str | None = None
    desc_populacao_beneficiada: str | None = None
    populacao_beneficiada_revisada: str | None = None
    desc_populacao_beneficiada_revisada: str | None = None

    relacao_instrumento: RelacaoInstrumentoObra
    confirmacao_status: ConfirmacaoStatusObra | None = None
    justificativa: str | None = None

    @model_validator(mode="after")
    def validar_confirmacao_status(self):
        if self.relacao_instrumento == "nao_analisada":
            self.confirmacao_status = None
            return self

        if self.confirmacao_status is None:
            self.confirmacao_status = "nao_confirmada"

        return self


class MunicipioRevisaoItem(RevisaoInstrumentoBase):
    cod_municipio: int
    nome: str | None = None
    uf: str | None = None

    origem_registro: OrigemRegistro = "base_atual"
    acao_sugerida: AcaoMunicipio | None = None
    justificativa: str | None = None
    revisao_municipio_conferida_em: datetime | None = None
    localidades_conferidas_em: datetime | None = None
    obras_conferidas_em: datetime | None = None

    localidades: list[LocalidadeRevisaoItem] = Field(default_factory=list)
    obras_saneamento: list[ObraSaneamentoRevisaoItem] = Field(default_factory=list)


class RevisaoInstrumentoBuscaResponse(RevisaoInstrumentoBase):
    id_revisao: int | None = None
    identificador_busca: str
    instrumento: InstrumentoRevisaoInfo
    status: str | None = None
    status_revisao_geral: str = "pendente"
    status_revisao_geral_label: str = "Revisão pendente"
    observacao_geral: str | None = None
    municipios: list[MunicipioRevisaoItem]


class RevisaoInstrumentoCreate(RevisaoInstrumentoBase):
    id_revisao: int | None = None
    status: StatusRevisao = "rascunho"
    observacao_geral: str | None = None

    instrumento: InstrumentoRevisaoInfo
    municipios: list[MunicipioRevisaoItem] = Field(default_factory=list)


class MunicipioRevisaoAlteracao(RevisaoInstrumentoBase):
    cod_municipio: int
    nome: str | None = None
    uf: str | None = None
    origem_registro: OrigemRegistro = "base_atual"
    acao_sugerida: AcaoMunicipio
    justificativa: str | None = None


class RevisaoInstrumentoMunicipioSave(RevisaoInstrumentoBase):
    id_revisao: int | None = None
    instrumento: InstrumentoRevisaoInfo
    cod_municipio: int
    municipio: MunicipioRevisaoAlteracao | None = None
    localidades: list[LocalidadeRevisaoAlteracao] = Field(default_factory=list)
    obras_saneamento: list[ObraSaneamentoRevisaoAlteracao] = Field(default_factory=list)


class RevisaoInstrumentoSalvoResponse(RevisaoInstrumentoBase):
    id_revisao: int
    status: str
    status_revisao_geral: str = "pendente"
    status_revisao_geral_label: str = "Revisão pendente"
    mensagem: str
    criado_em: datetime
    atualizado_em: datetime
    enviado_em: datetime | None = None
    municipios: list[MunicipioRevisaoItem] = Field(default_factory=list)


class RevisaoInstrumentoMunicipioSalvoResponse(RevisaoInstrumentoBase):
    id_revisao: int
    status: str
    status_revisao_geral: str = "pendente"
    status_revisao_geral_label: str = "Revisão pendente"
    mensagem: str
    municipio: MunicipioRevisaoItem
