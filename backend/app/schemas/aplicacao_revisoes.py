"""Contratos da aplicação administrativa de revisões."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class AplicacaoBase(BaseModel):
    model_config = {"from_attributes": True}


class ContagemAlteracoes(AplicacaoBase):
    municipios: int = 0
    localidades: int = 0
    publico_alvo: int = 0
    obras: int = 0
    total: int = 0


class RevisaoPendenteItem(AplicacaoBase):
    id_revisao: int
    tipo_instrumento: str
    tipo_instrumento_label: str
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    nr_ted: int | None = None
    identificador_principal: str
    tecnico_responsavel: str
    enviado_em: datetime
    observacao_geral: str | None = None
    status: str
    situacao: str = "aguardando_aplicacao"
    alteracoes: ContagemAlteracoes


class RevisoesPendentesResponse(AplicacaoBase):
    data: list[RevisaoPendenteItem] = Field(default_factory=list)
    total: int = 0


class AlteracaoRevisaoItem(AplicacaoBase):
    id_item: int
    entidade: Literal["municipio", "localidade"]
    acao: str
    cod_municipio: int | None = None
    municipio: str | None = None
    uf: str | None = None
    cod_comunidade_rural: int | None = None
    localidade: str | None = None
    origem_registro: str | None = None
    valor_anterior: int | None = None
    valor_sugerido: int | None = None
    justificativa: str | None = None


class PublicoAlvoRevisaoItem(AplicacaoBase):
    id_item: int
    id_projeto_investimento: str
    status_populacao_beneficiada: str | None = None
    status_desc_populacao_beneficiada: str | None = None
    status_correcao_solicitada: str | None = None
    observacao_publico_alvo: str | None = None


class ObraRevisaoItem(AplicacaoBase):
    id_item: int
    id_obra: str
    cod_municipio: int
    municipio: str | None = None
    uf: str | None = None
    relacao_instrumento: str
    confirmacao_status: str
    justificativa: str | None = None


class ValidacaoAplicacao(AplicacaoBase):
    aplicavel: bool
    status: Literal["pronta", "possui_pendencias", "ja_aplicada"]
    pendencias: list[str] = Field(default_factory=list)
    avisos: list[str] = Field(default_factory=list)


class RevisaoAplicacaoDetalhe(AplicacaoBase):
    revisao: RevisaoPendenteItem
    municipios: list[AlteracaoRevisaoItem] = Field(default_factory=list)
    localidades: list[AlteracaoRevisaoItem] = Field(default_factory=list)
    publico_alvo: list[PublicoAlvoRevisaoItem] = Field(default_factory=list)
    obras: list[ObraRevisaoItem] = Field(default_factory=list)
    validacao: ValidacaoAplicacao


class DetalheExecucao(AplicacaoBase):
    id_detalhe: int | None = None
    entidade: str
    acao: str
    resultado: str
    chave: dict[str, Any] = Field(default_factory=dict)
    valores_anteriores: dict[str, Any] | None = None
    valores_novos: dict[str, Any] | None = None
    mensagem: str | None = None


class ResumoResultados(AplicacaoBase):
    municipios: dict[str, int] = Field(default_factory=dict)
    localidades: dict[str, int] = Field(default_factory=dict)
    publico_alvo: dict[str, int] = Field(default_factory=dict)
    obras: dict[str, int] = Field(default_factory=dict)


class ExecucaoAplicacaoResponse(AplicacaoBase):
    id_execucao: int
    id_revisao: int
    status: str
    iniciado_em: datetime
    concluido_em: datetime | None = None
    aplicado_em: datetime | None = None
    cancelado_em: datetime | None = None
    administrador: str
    administrador_cancelamento: str | None = None
    motivo_cancelamento: str | None = None
    pode_cancelar: bool = False
    motivo_bloqueio_cancelamento: str | None = None
    tipo_instrumento: str | None = None
    tipo_instrumento_label: str | None = None
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    nr_ted: int | None = None
    identificador_instrumento: str
    resumo: ResumoResultados
    detalhes: list[DetalheExecucao] = Field(default_factory=list)
    mensagem: str


class ExecucaoHistoricoItem(AplicacaoBase):
    id_execucao: int
    id_revisao: int
    status: Literal["em_processamento", "sucesso", "falha", "cancelado"]
    status_label: str
    iniciado_em: datetime
    concluido_em: datetime | None = None
    tipo_instrumento: str
    tipo_instrumento_label: str
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    nr_ted: int | None = None
    identificador_instrumento: str
    administrador: str
    qtd_municipios: int = 0
    qtd_localidades: int = 0
    qtd_publico_alvo: int = 0
    qtd_obras: int = 0
    mensagem_erro: str | None = None


class HistoricoAplicacoesResponse(AplicacaoBase):
    data: list[ExecucaoHistoricoItem] = Field(default_factory=list)
    page: int
    page_size: int
    total: int
    total_pages: int


class CancelamentoAplicacaoRequest(AplicacaoBase):
    motivo: str = Field(..., min_length=1, max_length=2000)

    @field_validator("motivo")
    @classmethod
    def validar_motivo(cls, value: str) -> str:
        motivo = value.strip()
        if not motivo:
            raise ValueError("O motivo do cancelamento é obrigatório.")
        return motivo


class ValidacaoCancelamento(AplicacaoBase):
    pode_cancelar: bool
    status: Literal["disponivel", "bloqueado", "ja_cancelado"]
    motivo_bloqueio: str | None = None
    resumo: ResumoResultados = Field(default_factory=ResumoResultados)


class SolicitacaoCancelamentoRequest(AplicacaoBase):
    motivo_solicitacao: str = Field(..., min_length=1, max_length=2000)

    @field_validator("motivo_solicitacao")
    @classmethod
    def validar_motivo(cls, value: str) -> str:
        motivo = value.strip()
        if not motivo:
            raise ValueError("O motivo da solicitação é obrigatório.")
        return motivo


class RespostaSolicitacaoCancelamentoRequest(AplicacaoBase):
    observacao_resposta: str | None = Field(default=None, max_length=2000)

    @field_validator("observacao_resposta")
    @classmethod
    def normalizar_observacao(cls, value: str | None) -> str | None:
        observacao = (value or "").strip()
        return observacao or None


class SolicitacaoCancelamentoResponse(AplicacaoBase):
    id_solicitacao: int
    id_execucao: int
    id_revisao: int | None = None
    id_usuario_solicitante: int
    motivo_solicitacao: str
    status: Literal["pendente", "aprovada", "rejeitada"]
    solicitado_em: datetime
    id_usuario_resposta: int | None = None
    respondido_em: datetime | None = None
    observacao_resposta: str | None = None
    usuario_solicitante: str | None = None
    usuario_resposta: str | None = None
    status_execucao: str | None = None
    cancelado_em: datetime | None = None
    administrador_cancelamento: str | None = None
    motivo_cancelamento: str | None = None
    cancelamento_permitido: bool = False
    motivo_bloqueio_cancelamento: str | None = None
    tipo_instrumento: str | None = None
    tipo_instrumento_label: str | None = None
    identificador_instrumento: str | None = None


class SolicitacoesCancelamentoResponse(AplicacaoBase):
    data: list[SolicitacaoCancelamentoResponse] = Field(default_factory=list)
    page: int
    page_size: int
    total: int
    total_pages: int
