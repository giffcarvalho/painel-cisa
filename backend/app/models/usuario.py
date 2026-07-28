from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Usuario(Base):
    __tablename__ = "tb_usuario"
    __table_args__ = {"schema": "painel_dsr"}

    id_usuario: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo_tecnico: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    setor: Mapped[str | None] = mapped_column(String, nullable=True)
    senha_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    conta_ativada: Mapped[bool] = mapped_column(Boolean, nullable=False)
    perfil: Mapped[str] = mapped_column(String, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False)
    codigo_acesso_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    codigo_acesso_expira_em: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    codigo_acesso_usado_em: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ultimo_acesso_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
