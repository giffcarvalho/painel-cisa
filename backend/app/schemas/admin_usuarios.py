from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


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


class UsuarioAdminDetalhe(UsuarioAdminResumo):
    criado_em: datetime
    atualizado_em: datetime
    codigo_acesso_expira_em: datetime | None = None
    codigo_acesso_usado_em: datetime | None = None
    instrumentos: list[InstrumentoUsuarioAdmin] = Field(default_factory=list)
    revisoes: list[RevisaoUsuarioAdmin] = Field(default_factory=list)
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
