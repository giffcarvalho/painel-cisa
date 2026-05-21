"""Contrato para endpoint paginado GET /api/v1/carteira-dsr/tabela"""

from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class TabelaItem(BaseModel):
    #--identificação
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    operacao: str | None = None
    nr_proposta_selecao_pac: str | None = None
    ano_proposta: int | None = None
    tipo_instrumento: str | None = None
    novo_pac: str | None = None
    acao_orcamentaria: str | None = None
    componente: str | None = None
    acao_padronizada: str | None = None
    
    #--proponente e localização
    nome_proponente: str | None = None
    uf: str | None = None
    qtde_municipios: int | None = None
    municipios_beneficiados: str | None = None
    comunidades_rurais_beneficiadas: str | None = None
    
    #--objeto e status
    objeto: str | None = None
    status: str | None = None
    situacao_contratacao: str | None = None
    carteira_ativa: str | None = None
    situacao_atual: str | None = None
    
    #--vigência (Tolerância a datas corrompidas)
    dia_assin_conv: date | datetime | None = None
    dias_termino_vigencia: int | None = None
    termino_vigencia: str | None = None
    
    #--suspensivas
    liminar_judicial: str | None = None
    motivo_suspensao: str | None = None
    data_suspensiva: date | datetime | None = None
    suspensiva_projeto: str | None = None
    suspensiva_licenca_ambiental: str | None = None
    suspensiva_sustentabilidade: str | None = None
    suspensiva_trabalho_social: str | None = None
    suspensiva_titularidade_area: str | None = None
    suspensiva_termo_referencia: str | None = None
    suspensiva_artigo_50: str | None = None
    suspensiva_outra: str | None = None
    data_retirada_suspensiva: date | datetime | None = None
    
    #--execução
    primeira_data_emissao_aio: date | datetime | None = None
    situacao_contrato: str | None = None
    situacao_obra: str | None = None
    percentual_fisico_informado: Decimal | None = None
    percentual_fisico_aferido: Decimal | None = None
    percentual_financeiro_desbloqueado: Decimal | None = None
    data_ultimo_bm: date | datetime | None = None
    data_ultima_vistoria: date | datetime | None = None
    data_ultimo_desbloqueio: date | datetime | None = None
    data_ultima_obtv: date | datetime | None = None
    data_termino_obra: date | datetime | None = None
    
    #--paralisação
    paralisada: str | None = None
    principal_motivo_paralisacao: str | None = None
    detalhamento_motivo_paralisacao: str | None = None
    descricao_motivo_paralisacao: str | None = None
    data_paralisacao: date | datetime | None = None
    dias_sem_evolucao: int | None = None
    
    #--valores financeiros
    valor_global: Decimal | None = None
    valor_repasse: Decimal | None = None
    valor_contrapartida: Decimal | None = None
    valor_empenhado: Decimal | None = None
    valor_a_empenhar: Decimal | None = None
    valor_desembolsado: Decimal | None = None
    valor_empenhado_a_desembolsar: Decimal | None = None
    valor_a_desembolsar: Decimal | None = None
    valor_desbloqueado: Decimal | None = None
    
    #--metadados e links
    link_transferegov: str | None = None
    data_dados_transferegov: date | datetime | None = None
    data_dados_caixa: date | datetime | None = None

    model_config = {"from_attributes": True}

class TabelaResponse(BaseModel):
    total: int = Field(
        ...,
        description="Total de registros (sem paginação)."
    )
    pagina: int
    tamanho_pagina: int
    data: list[TabelaItem]