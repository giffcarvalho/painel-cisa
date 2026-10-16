from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NotificacaoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class NotificacaoUsuarioItem(NotificacaoBase):
    id_notificacao: int
    tipo: str
    mensagem: str
    id_revisao: int
    identificador_instrumento: str
    criado_em: datetime
    lido_em: datetime | None = None


class NotificacoesUsuarioResponse(NotificacaoBase):
    data: list[NotificacaoUsuarioItem] = Field(default_factory=list)
    pagina: int
    limite: int
    total: int
    total_paginas: int
    nao_lidas: int


class ContagemNotificacoesResponse(NotificacaoBase):
    nao_lidas: int


class NotificacaoLeituraResponse(NotificacaoBase):
    atualizadas: int
    nao_lidas: int
