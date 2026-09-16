from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.meu_painel import PendenciasPorGrupo, RascunhoMeuPainelItem


class AdminBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ResumoAdministrativo(AdminBase):
    total_usuarios: int
    usuarios_ativos: int
    usuarios_desativados: int
    contas_ativadas: int
    contas_aguardando_ativacao: int
    revisoes_recentes: int


class UsuarioAdminResumo(AdminBase):
    id_usuario: int
    codigo_tecnico: int | None = None
    id_setor: int | None = None
    nome: str
    email: str
    setor: str | None = None
    perfil: str
    ativo: bool
    conta_ativada: bool
    ultimo_acesso_em: datetime | None = None
    instrumentos_ativos: int = 0
    revisoes_enviadas: int = 0
    rascunhos: int = 0


class UsuariosAdminResponse(AdminBase):
    resumo: ResumoAdministrativo
    data: list[UsuarioAdminResumo] = Field(default_factory=list)


class InstrumentoUsuarioAdmin(AdminBase):
    nr_instrumento: str
    ativo: bool


class RevisaoUsuarioAdmin(AdminBase):
    id_revisao: int
    identificador_instrumento: str
    tipo_instrumento: str
    status: str
    criado_em: datetime
    atualizado_em: datetime | None = None
    enviado_em: datetime | None = None


class PendenciasUsuarioAdmin(AdminBase):
    total: int
    concluidas: int
    abertas: int
    percentual_concluido: int
    instrumentos: list[dict] = Field(default_factory=list)
    instrumentos_total: int = 0
    limit: int = 5
    offset: int = 0


class PendenciaInstrumentoDetalheAdmin(AdminBase):
    identificador_instrumento: str
    tipo_instrumento: str
    tipo_instrumento_label: str
    total_pendencias: int
    grupos: PendenciasPorGrupo


class UsuarioAdminDetalhe(UsuarioAdminResumo):
    criado_em: datetime
    atualizado_em: datetime
    codigo_acesso_expira_em: datetime | None = None
    codigo_acesso_usado_em: datetime | None = None
    instrumentos: list[InstrumentoUsuarioAdmin] = Field(default_factory=list)
    instrumentos_total: int = 0
    revisoes: list[RevisaoUsuarioAdmin] = Field(default_factory=list)
    revisoes_total: int = 0
    pendencias: PendenciasUsuarioAdmin


class AlterarStatusUsuarioRequest(AdminBase):
    ativo: bool


class CodigoAcessoResponse(AdminBase):
    codigo: str
    expira_em: datetime


class VincularInstrumentoRequest(AdminBase):
    nr_instrumento: str = Field(min_length=1, max_length=50)

    @field_validator("nr_instrumento")
    @classmethod
    def limpar(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Informe um instrumento.")
        return value


class AlterarVinculoRequest(AdminBase):
    ativo: bool


class InstrumentoBuscaAdmin(AdminBase):
    nr_instrumento: str
    nr_proposta: str | None = None
    tipo_instrumento: str | None = None
    objeto: str | None = None


class InstrumentosUsuarioAdminResponse(AdminBase):
    items: list[InstrumentoUsuarioAdmin] = Field(default_factory=list)
    total: int
    limit: int
    offset: int


class RevisoesUsuarioAdminResponse(AdminBase):
    items: list[RevisaoUsuarioAdmin] = Field(default_factory=list)
    total: int
    limit: int
    offset: int


class RascunhosUsuarioAdminResponse(AdminBase):
    items: list[RascunhoMeuPainelItem] = Field(default_factory=list)
    total: int
    limit: int
    offset: int


class SetorAdmin(AdminBase):
    id_setor: int
    nome: str


class CriarUsuarioRequest(AdminBase):
    nome: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=3, max_length=150)
    perfil: Literal["tecnico", "admin"]
    id_setor: int | None = None

    @field_validator("nome", "email")
    @classmethod
    def limpar_texto(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def validar_email(cls, value: str) -> str:
        if "@" not in value:
            raise ValueError("Informe um e-mail válido.")
        return value.lower()

    @model_validator(mode="after")
    def validar_setor_tecnico(self):
        if self.perfil == "tecnico" and self.id_setor is None:
            raise ValueError("Setor é obrigatório para técnicos.")
        if self.perfil == "admin":
            self.id_setor = None
        return self


class CriarUsuarioResponse(AdminBase):
    id_usuario: int
    codigo_tecnico: int | None = None
    id_setor: int | None = None
    nome: str
    email: str
    perfil: str
    conta_ativada: bool
    ativo: bool


class AlterarSetorRequest(AdminBase):
    id_setor: int


class AlterarSetorResponse(AdminBase):
    id_usuario: int
    codigo_tecnico: int
    id_setor: int
    setor: str
