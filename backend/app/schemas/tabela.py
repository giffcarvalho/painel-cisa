"""Contrato para endpoint paginado GET /api/v1/carteira-dsr/tabela"""

from datetime import date
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, Field

class TabelaItem(BaseModel):
    #--identificação
    nr_instrumento: str | None = None
    nr_proposta: str | None = None
    operacao: str | None = None
    nr_proposta_selecao_pac: str | None = None
    ano_proposta: str | None = None
    tipo_instrumento: str | None = None
    novo_pac: str | None = None
    acao_orcamentaria: str | None = None
    componente: str | None = None
    acao_padronizada: str | None = None
    
    #--proponente e localização
    nome_proponente: str | None = None
    uf: str | None = None
    qtde_municipios: str | None = None
    municipios_beneficiados: str | None = None
    comunidades_rurais_beneficiadas: str | None = None
    
    #--objeto e status
    objeto: str | None = None
    status: str | None = None
    situacao_contratacao: str | None = None
    carteira_ativa: str | None = None
    situacao_atual: str | None = None
    
    #--vigência (Tolerância a datas corrompidas)
    dia_assin_conv: Any = None
    dias_termino_vigencia: str | None = None
    termino_vigencia: str | None = None
    
    #--suspensivas
    liminar_judicial: str | None = None
    motivo_suspensao: str | None = None
    data_suspensiva: Any = None
    suspensiva_projeto: str | None = None
    suspensiva_licenca_ambiental: str | None = None
    suspensiva_sustentabilidade: str | None = None
    suspensiva_trabalho_social: str | None = None
    suspensiva_titularidade_area: str | None = None
    suspensiva_termo_referencia: str | None = None
    suspensiva_artigo_50: str | None = None
    suspensiva_outra: str | None = None
    data_retirada_suspensiva: Any = None
    
    #--execução
    primeira_data_emissao_aio: Any = None
    situacao_contrato: str | None = None
    situacao_obra: str | None = None
    percentual_fisico_informado: Any = None
    percentual_fisico_aferido: Any = None
    percentual_financeiro_desbloqueado: Any = None
    data_ultimo_bm: Any = None
    data_ultima_vistoria: Any = None
    data_ultimo_desbloqueio: Any = None
    data_ultima_obtv: Any = None
    data_termino_obra: Any = None
    
    #--paralisação
    paralisada: str | None = None
    principal_motivo_paralisacao: str | None = None
    detalhamento_motivo_paralisacao: str | None = None
    descricao_motivo_paralisacao: str | None = None
    data_paralisacao: Any = None
    dias_sem_evolucao: str | None = None
    
    #--valores financeiros (Tolerância a lixo numérico)
    valor_global: Any = None
    valor_repasse: Any = None
    valor_contrapartida: Any = None
    valor_empenhado: Any = None
    valor_a_empenhar: Any = None
    valor_desembolsado: Any = None
    valor_empenhado_a_desembolsar: Any = None
    valor_a_desembolsar: Any = None
    valor_desbloqueado: Any = None
    
    #--metadados e links
    link_transferegov: str | None = None
    data_dados_transferegov: Any = None
    data_dados_caixa: Any = None

    model_config = {"from_attributes": True}

class TabelaResponse(BaseModel):
    total: int = Field(
        ...,
        description="Total de registros (sem paginação)."
    )
    pagina: int
    tamanho_pagina: int
    data: list[TabelaItem]