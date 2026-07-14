"""Contratos dos envios de teste."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


class TesteEnvioBase(BaseModel):
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


class TesteEnvioCreate(TesteEnvioBase):
    uf: str = Field(..., min_length=2, max_length=2)
    cod_teste: int | None = None
    nome_municipio_teste: str | None = Field(default=None, max_length=150)
    descricao: str | None = None

    @field_validator("uf", mode="before")
    @classmethod
    def normalizar_uf(cls, value: Any) -> str:
        uf = str(value or "").strip().upper()

        if len(uf) != 2:
            raise ValueError("UF deve ter exatamente 2 caracteres.")

        return uf


class TesteEnvioItem(TesteEnvioBase):
    id_envio: int
    id_usuario_tecnico: int
    uf: str
    cod_teste: int | None = None
    nome_municipio_teste: str | None = None
    descricao: str | None = None
    status: str
    data_envio: datetime | None = None
    data_criacao: datetime
    data_atualizacao: datetime