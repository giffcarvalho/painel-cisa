"""Contrato para endpoint paginado GET /api/v1/carteira-dsr/tabela"""

from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field

class TabelaItem(BaseModel):
    #--identificação
    nr_instrumento: int | None
    nr_proposta: str | None
    operacao: int | None
    nr_proposta_selecao_pac: str | None
    ano_proposta: int | None
    tipo_instrumento: str | None
    novo_pac: str | None
    acao_orcamentaria: str | None
    componente: str | None
    acao_padronizada: str | None
    #--proponente e localização
    nome_proponente: str | None
    uf: str | None
    qtde_municipios: int | None
    municipios_beneficiados: str | None
    comunidades_rurais_beneficiadas: str | None
    #--objeto e status
    objeto: str | None
    status: str | None
    situacao_contratacao: str | None
    carteira_ativa: str | None
    situacao_atual: str | None
    #--vigência
    dia_assin_conv: date | None
    dia_fim_vigenc_conv: date | None
    dias_termino_vigencia: int | None
    termino_vigencia: str | None
    #--suspensivas
    liminar_judicial: str | None
    motivo_suspensao: str | None
    data_suspensiva: date | None
    suspensiva_projeto: str | None
    suspensiva_licenca_ambiental: str | None
    suspensiva_sustentabilidade: str | None
    suspensiva_trabalho_social: str | None
    suspensiva_titularidade_area: str | None
    suspensiva_termo_referencia: str | None
    suspensiva_artigo_50: str | None
    suspensiva_outra: str | None
    data_retirada_suspensiva: date | None
    #--execução
    primeira_data_emissao_aio: date | None
    situacao_contrato: str | None
    situacao_obra: str | None
    percentual_fisico_informado: float | None
    percentual_fisico_aferido: float | None
    percentual_financeiro_desbloqueado: float | None
    data_ultimo_bm: date | None
    data_ultima_vistoria: date | None
    data_ultimo_desbloqueio: date | None
    data_ultima_obtv: date | None
    data_termino_obra: date | None
    #--paralisação
    paralisada: str | None
    principal_motivo_paralisacao: str | None
    detalhamento_motivo_paralisacao: str | None
    descricao_motivo_paralisacao: str | None
    data_paralisacao: date | None
    dias_sem_evolucao: int | None
    #--valores financeiros
    valor_global: Decimal | None
    valor_repasse: Decimal | None
    valor_contrapartida: Decimal | None
    valor_empenhado: Decimal | None
    valor_a_empenhar: Decimal | None
    valor_desembolsado: Decimal | None
    valor_empenhado_a_desembolsar: Decimal | None
    valor_a_desembolsar: Decimal | None
    valor_desbloqueado: Decimal | None
    #--metadados e links
    link_transferegov: str | None
    data_dados_transferegov: date | None
    data_dados_caixa: date | None

    model_config = {"from_attributes": True}

class TabelaResponse(BaseModel):
    total: int = Field(
        ...,
        description="Total de registros (sem paginação)."
    )
    pagina: int
    tamanho_pagina: int
    data: list[TabelaItem]