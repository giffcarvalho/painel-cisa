"""Contrato de resposta para o endpoint GET /api/v1/carteira-dsr/kpis"""

from decimal import Decimal
from pydantic import BaseModel, Field

class KpisResponse(BaseModel):
    qtde_instrumentos: int = Field(
        ...,
        description="Contagem de instrumentos únicos (nr_instrumento).",
        examples=[1234],
    )
    valor_global: Decimal = Field(
        ...,
        description="Soma do valor global dos instrumentos (R$).",
        examples=[["9876543210.50"]],
    )
    valor_repasse: Decimal = Field(
        ...,
        description="Soma do valor de repasse federal (R$).",
        examples=[["7500000000.00"]],
    )
    valor_contrapartida: Decimal = Field(
        ...,
        description="Soma dos valores de contrapartida dos proponentes (R$).",
        examples=[["1200000000.00"]],
    )
    valor_empenhado: Decimal = Field(
        ...,
        description="Soma do valor empenhado (R$).",
        examples=[["4000000000.00"]],
    )
    valor_desembolsado: Decimal = Field(
        ...,
        description="Soma do valor efetivamente desembolsado (R$).",
        examples=[["3100000000.00"]],
    )
    valor_desbloqueado: Decimal = Field(
        ...,
        description="Soma do valor desbloqueado para pagamento (R$).",
        examples=[["3300000000.00"]],
    )
    qtde_municipios_beneficiados: int = Field(
        ...,
        description="Contagem distinta de municípios beneficiados",
        examples=[2418],
    )

    model_config = {"from_attributes": True}