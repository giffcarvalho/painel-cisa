"""Contratos da revisão de instrumentos DSR."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


TipoInstrumento = Literal["contrato_repasse", "termo_compromisso", "ted"]
OrigemRegistro = Literal["base_atual", "adicionado_tecnico"]
AcaoMunicipio = Literal["manter", "remover", "adicionar"]
AcaoLocalidade = Literal["manter", "remover", "adicionar", "corrigir"]
RelacaoInstrumento = Literal[
    "nao_analisada",
    "sem_conflito_aparente",
    "possivel_sobreposicao",
]
ConfirmacaoStatus = Literal[
    "nao_confirmada",
    "sem_conflito",
    "sobreposicao_confirmada",
]
StatusRevisao = Literal["rascunho", "enviado"]
StatusPublicoAlvo = Literal["ok", "informacao_incorreta", "sem_informacao"]
CorrecaoSolicitadaPublicoAlvo = Literal["sim", "nao", "nao_necessaria"]

CONFIRMACOES_COMPATIVEIS = {
    "nao_analisada": {"nao_confirmada"},
    "sem_conflito_aparente": {"nao_confirmada", "sem_conflito"},
    "possivel_sobreposicao": {
        "nao_confirmada",
        "sobreposicao_confirmada",
    },
}


def _validar_relacao_confirmacao(
    relacao_instrumento: RelacaoInstrumento,
    confirmacao_status: ConfirmacaoStatus,
) -> None:
    if confirmacao_status not in CONFIRMACOES_COMPATIVEIS[relacao_instrumento]:
        raise ValueError(
            "confirmacao_status incompatível com relacao_instrumento: "
            f"'{confirmacao_status}' não pode ser usado com "
            f"'{relacao_instrumento}'."
        )


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
    valido_ate: datetime | None = None


class ObraSaneamentoRevisaoItem(RevisaoInstrumentoBase):
    id_revisao_obra: int | None = None
    id_obra: str
    cod_municipio: int | None = None

    descricao: str | None = None
    orgao: str | None = None
    link_transferegov: str | None = None
    link_obrasgov: str | None = None

    relacao_instrumento: RelacaoInstrumento = "nao_analisada"
    confirmacao_status: ConfirmacaoStatus = "nao_confirmada"
    justificativa: str | None = None
    conferido_em: datetime | None = None
    valido_ate: datetime | None = None

    @model_validator(mode="after")
    def validar_confirmacao_status(self):
        _validar_relacao_confirmacao(
            self.relacao_instrumento, self.confirmacao_status
        )
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

    relacao_instrumento: RelacaoInstrumento
    confirmacao_status: ConfirmacaoStatus = "nao_confirmada"
    justificativa: str | None = None

    @model_validator(mode="after")
    def validar_confirmacao_status(self):
        _validar_relacao_confirmacao(
            self.relacao_instrumento, self.confirmacao_status
        )
        return self


class PublicoAlvoRevisaoItem(RevisaoInstrumentoBase):
    id_revisao_publico_alvo: int | None = None
    id_projeto_investimento: str

    tipo_instrumento: TipoInstrumento | None = None
    nr_instrumento: str | None = None
    nome_obra: str | None = None

    populacao_beneficiada_original: str | None = None
    desc_populacao_beneficiada_original: str | None = None
    status_populacao_beneficiada: StatusPublicoAlvo | None = None
    status_desc_populacao_beneficiada: StatusPublicoAlvo | None = None
    observacao_publico_alvo: str | None = None
    status_correcao_solicitada: CorrecaoSolicitadaPublicoAlvo | None = None

    conferido_em: datetime | None = None
    valido_ate: datetime | None = None


class PublicoAlvoRevisaoAlteracao(RevisaoInstrumentoBase):
    id_revisao_publico_alvo: int | None = None
    id_projeto_investimento: str

    populacao_beneficiada_original: str | None = None
    desc_populacao_beneficiada_original: str | None = None
    status_populacao_beneficiada: StatusPublicoAlvo | None = None
    status_desc_populacao_beneficiada: StatusPublicoAlvo | None = None
    observacao_publico_alvo: str | None = None
    status_correcao_solicitada: CorrecaoSolicitadaPublicoAlvo | None = None


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
    conferido_em: datetime | None = None
    valido_ate: datetime | None = None

    localidades: list[LocalidadeRevisaoItem] = Field(default_factory=list)
    obras_saneamento: list[ObraSaneamentoRevisaoItem] = Field(default_factory=list)


class MunicipioOficialItem(RevisaoInstrumentoBase):
    cod_municipio: int
    nome_municipio: str
    cod_uf: int
    sigla_uf: str
    nome_uf: str


class RevisaoInstrumentoBuscaResponse(RevisaoInstrumentoBase):
    id_revisao: int | None = None
    identificador_busca: str
    instrumento: InstrumentoRevisaoInfo
    pode_editar: bool = False
    pode_editar_revisao: bool = False
    status: str | None = None
    status_revisao_geral: str = "pendente"
    status_revisao_geral_label: str = "Revisão pendente"
    observacao_geral: str | None = None
    municipios: list[MunicipioRevisaoItem]
    publico_alvo: list[PublicoAlvoRevisaoItem] = Field(default_factory=list)
    dados_oficiais: dict[str, Any] | None = None
    rascunho_global: dict[str, Any] | None = None
    rascunho_usuario: dict[str, Any] | None = None
    revisao_pendente_aplicacao: dict[str, Any] | None = None
    quantidade_revisoes_pendentes: int = 0
    ultima_revisao_usuario: dict[str, Any] | None = None
    situacao_atualizacao: dict[str, Any] = Field(default_factory=dict)
    situacao_validade: dict[str, Any] = Field(default_factory=dict)
    situacao_colaborativa: dict[str, Any] = Field(default_factory=dict)
    completude: dict[str, Any] = Field(default_factory=dict)


class UsuarioRevisaoInfo(RevisaoInstrumentoBase):
    id_usuario: int
    nome: str


class RevisaoInstrumentoDetalheResponse(RevisaoInstrumentoBase):
    id_revisao: int
    id_revisao_anterior: int | None = None
    status: str
    observacao_geral: str | None = None
    criado_em: datetime
    atualizado_em: datetime
    enviado_em: datetime | None = None
    aplicado_em: datetime | None = None
    base_referencia_em: datetime | None = None
    identificador_busca: str
    instrumento: InstrumentoRevisaoInfo
    usuario: UsuarioRevisaoInfo
    municipios: list[MunicipioRevisaoItem] = Field(default_factory=list)
    publico_alvo: list[PublicoAlvoRevisaoItem] = Field(default_factory=list)


class RevisaoHistoricoItem(RevisaoInstrumentoBase):
    id_revisao: int
    id_revisao_anterior: int | None = None
    identificador_busca: str
    tipo_instrumento: TipoInstrumento
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    nr_ted: int | None = None
    objeto: str | None = None
    status: str
    status_label: str
    criado_em: datetime
    atualizado_em: datetime
    enviado_em: datetime | None = None
    aplicado_em: datetime | None = None
    usuario: UsuarioRevisaoInfo


class HistoricoRevisoesResponse(RevisaoInstrumentoBase):
    data: list[RevisaoHistoricoItem] = Field(default_factory=list)
    pagina: int
    limite: int
    total: int
    total_paginas: int
    instrumento: InstrumentoRevisaoInfo | None = None


class MeuInstrumentoRevisaoItem(RevisaoInstrumentoBase):
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    nr_ted: int | None = None
    tipo_instrumento: TipoInstrumento
    tipo_instrumento_label: str | None = None
    uf: str | None = None
    municipios_beneficiados: str | None = None
    valor_global: Decimal | None = None
    objeto: str | None = None
    percentual_fisico_aferido: Decimal | None = None
    situacao_atual: str | None = None
    status_revisao: str | None = None
    status_revisao_label: str = "Sem revisão"


class MeusInstrumentosRevisaoResponse(RevisaoInstrumentoBase):
    data: list[MeuInstrumentoRevisaoItem] = Field(default_factory=list)


class RevisaoInstrumentoCreate(RevisaoInstrumentoBase):
    id_revisao: int | None = None
    status: StatusRevisao = "rascunho"
    observacao_geral: str | None = None

    instrumento: InstrumentoRevisaoInfo
    municipios: list[MunicipioRevisaoItem] = Field(default_factory=list)
    publico_alvo: list[PublicoAlvoRevisaoAlteracao] = Field(default_factory=list)

    @model_validator(mode="after")
    def validar_municipios_sem_duplicidade(self):
        codigos = [municipio.cod_municipio for municipio in self.municipios]
        if len(codigos) != len(set(codigos)):
            raise ValueError("Um município não pode aparecer mais de uma vez no mesmo rascunho.")
        return self


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
    publico_alvo: list[PublicoAlvoRevisaoItem] = Field(default_factory=list)
    completude: dict[str, Any] = Field(default_factory=dict)


class RevisaoInstrumentoMunicipioSalvoResponse(RevisaoInstrumentoBase):
    id_revisao: int
    status: str
    status_revisao_geral: str = "pendente"
    status_revisao_geral_label: str = "Revisão pendente"
    mensagem: str
    municipio: MunicipioRevisaoItem
