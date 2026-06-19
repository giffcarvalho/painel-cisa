"""Catalogo fechado do Extrator de Dados.
Nao use nomes de colunas recebidos do frontend.
O frontend envia field_ids; este arquivo traduz field_id -> view/column.
"""

from __future__ import annotations

from dataclasses import dataclass

TIPOS_TABELA = {
    "municipio": {
        "label": "Por municipio",
        "view": "territorio.vw_base_municipal",
        "descricao": "Uma linha por municipio.",
        "ordem": ["cod_municipio", "nome"],
    },
    "setor_censitario": {
        "label": "Por setor censitario",
        "view": "censo.vw_base_setor_censitario",
        "descricao": "Uma linha por setor censitario.",
        "ordem": ["cod_setor"],
    },
    "instrumento": {
        "label": "Por instrumento DSR",
        "view": "instrumento.vw_carteira_dsr",
        "descricao": "Uma linha por instrumento/proposta/registro da Carteira DSR.",
        "ordem": ["nr_instrumento", "nr_proposta"],
    },
}

CAMPOS_IGNORADOS = {
    "municipio": {
        "geom_sede",
        "geom_2022",
        "nome_municipio",
        "UF",
        "jenks_deficit_agua_rural_ibge",
        "jenks_deficit_esgoto_rural_ibge",
        "jenks_deficit_residuo_rural_ibge",
        "jenks_deficit_banheiro_rural_ibge",
        "jenks_deficit_agua_urbana_ibge",
        "jenks_deficit_esgoto_urbana_ibge",
        "jenks_deficit_residuo_urbana_ibge",
        "jenks_deficit_banheiro_urbana_ibge",
    },
    "setor_censitario": {
        "geom",
        "cod_sit_virtual",
        "jenks_perc_agua_forma_nao_adequada",
        "jenks_perc_ban_sem_ban_exclusivo",
        "jenks_perc_esgoto_tipo_nao_adequado",
        "jenks_perc_lixo_destino_nao_adequado",
    },
    "instrumento": set(),
}

CAMPOS_AVANCADOS = {
    "municipio": {
        "cod_municipio",
        "cod_uf",
        "latitude_sede",
        "longitude_sede",
        "populacao_total_censo_2022_maior_50000",
        "ranking_agua_nao_adequado_ibge",
        "ranking_esgoto_nao_adequado_ibge",
        "ranking_residuos_nao_adequado_ibge",
        "ranking_sem_banheiro_exclusivo_rural_ibge",
        "ranking_agua_nao_adequado_sinisa",
        "ranking_esgoto_nao_adequado_sinisa",
        "ranking_residuo_nao_adequado_sinisa",
        "referencia",
    },
    "setor_censitario": {
        "cod_setor",
        "cod_sit",
        "cod_tipo",
        "cod_municipio",
        "cod_uf",
        "latitude",
        "longitude",
    },
    "instrumento": {
        "operacao",
        "nr_reservado",
        "nivel",
        "normal",
        "qtde_parcelas",
        "parcela_1",
        "parcela_2",
        "parcela_3",
        "parcela_4",
        "parcela_5",
        "parcela_6",
        "parcela_7",
        "ultima_parcela_paga",
        "proxima_parcela_a_pagar",
        "valor_a_pagar_proxima_parcela",
        "saldo_empenho",
        "necessidade_empenho_proxima_parcela",
        "qtde_licitacoes_maior_10_porc",
        "qtde_licitacoes_maior_10_porc_enviada",
        "qtde_licitacoes_sem_aceite_15",
        "qtde_licitacoes_sem_aceite_30",
        "qtde_licitacoes_sem_contrato_15",
        "qtde_licitacoes_sem_contrato_30",
        "data_solicitacao_aio",
        "data_atendimento_equipe_aio",
        "data_atendimento_executiva_aio",
        "data_saida_processo_aio",
        "link_transferegov",
        "data_dados_transferegov",
        "data_dados_caixa",
    },
}

CAMPOS_PADRAO = {
    "municipio": {
        "nome",
        "sigla_uf",
        "regiao",
        "semiarido_2022",
        "amazonia_legal",
        "populacao_total_censo_2022",
        "populacao_rural_censo_2022",
        "dppo_rural",
        "deficit_agua_rural_ibge",
        "deficit_esgoto_rural_ibge",
        "deficit_residuo_rural_ibge",
        "deficit_banheiro_rural_ibge",
        "qtde_instrumentos_dsr",
    },
    "setor_censitario": {
        "cod_setor",
        "nome_municipio",
        "sigla_uf",
        "situacao",
        "situacao_detalhada",
        "tipo",
        "total_pessoas",
        "total_domicilios",
        "perc_agua_forma_nao_adequada",
        "perc_esgoto_tipo_nao_adequado",
        "perc_lixo_destino_nao_adequado",
        "perc_ban_sem_ban_exclusivo",
    },
    "instrumento": {
        "nr_instrumento",
        "nr_proposta",
        "tipo_instrumento",
        "ano_proposta",
        "acao_padronizada",
        "nome_proponente",
        "uf",
        "municipios_beneficiados",
        "valor_global",
        "valor_repasse",
        "valor_desembolsado",
        "situacao_contratacao",
        "fase_instrumento",
        "carteira_ativa",
    },
}

CAMPOS_REAIS = {
    "municipio": [
        "cod_municipio", "nome", "cod_uf", "sigla_uf", "regiao",
        "tipo_catmetropol", "categoria_metropolitana", "label_catmetropol",
        "rm_prioritaria", "subgrupo", "semiarido_2022", "amazonia_legal",
        "vale_jequetinhonha", "elegivel_pac_rural_2025", "idhm_2010",
        "indice_firjan_2016", "capag_municipal", "latitude_sede",
        "longitude_sede", "populacao_total_censo_2022",
        "populacao_total_censo_2022_maior_50000", "populacao_urbana_censo_2022",
        "populacao_rural_censo_2022", "domicilios_total",
        "domicilios_coletivos", "domicilios_particulares", "dppo_total",
        "dppo_urbana", "dppo_rural",
        "dppo_agua_adequado_urbana", "dppo_agua_adequado_rural",
        "dppo_agua_nao_adequado_urbana", "dppo_agua_nao_adequado_rural",
        "dppo_agua_rede_urbana", "dppo_agua_poco_prof_urbana",
        "dppo_agua_poco_raso_urbana", "dppo_agua_nascente_urbana",
        "dppo_agua_pipa_urbana", "dppo_agua_chuva_urbana",
        "dppo_agua_rio_acude_urbana", "dppo_agua_outra_urbana",
        "dppo_agua_rede_rural", "dppo_agua_poco_prof_rural",
        "dppo_agua_poco_raso_rural", "dppo_agua_nascente_rural",
        "dppo_agua_pipa_rural", "dppo_agua_chuva_rural",
        "dppo_agua_rio_acude_rural", "dppo_agua_outra_rural",
        "deficit_agua_rural_ibge", "deficit_agua_urbana_ibge",
        "snis_populacao_adequada_agua", "sinisa_populacao_rede_agua_urbana",
        "sinisa_populacao_rede_agua_rural", "sinisa_populacao_alternativa_agua_urbana",
        "sinisa_populacao_alternativa_agua_rural", "sinisa_agua_adequado_urbano",
        "sinisa_agua_adequado_rural", "sinisa_agua_nao_adequado_urbano",
        "sinisa_agua_nao_adequado_rural", "deficit_agua_rural_sinisa",
        "dppo_esgoto_adequado_urbana", "dppo_esgoto_adequado_rural",
        "dppo_esgoto_nao_adequado_urbana", "dppo_esgoto_nao_adequado_rural",
        "dppo_esgoto_rede_urbana", "dppo_esgoto_fossa_septica_lig_rede_urbana",
        "dppo_esgoto_fossa_septica_nao_lig_rede_urbana",
        "dppo_esgoto_fossa_rudimentar_urbana", "dppo_esgoto_vala_urbana",
        "dppo_esgoto_rio_lago_mar_urbana", "dppo_esgoto_outra_forma_urbana",
        "dppo_esgoto_sem_ban_nem_sanit_urbana", "dppo_esgoto_rede_rural",
        "dppo_esgoto_fossa_septica_lig_rede_rural",
        "dppo_esgoto_fossa_septica_nao_lig_rede_rural",
        "dppo_esgoto_fossa_rudimentar_rural", "dppo_esgoto_vala_rural",
        "dppo_esgoto_rio_lago_mar_rural", "dppo_esgoto_outra_forma_rural",
        "dppo_esgoto_sem_ban_nem_sanit_rural", "deficit_esgoto_rural_ibge",
        "deficit_esgoto_urbana_ibge", "snis_populacao_adequada_esgoto",
        "sinisa_populacao_rede_esgoto_urbana", "sinisa_populacao_rede_esgoto_rural",
        "sinisa_populacao_alternativa_esgoto_urbana",
        "sinisa_populacao_alternativa_esgoto_rural", "sinisa_esgoto_adequado_urbano",
        "sinisa_esgoto_adequado_rural", "sinisa_esgoto_nao_adequado_urbano",
        "sinisa_esgoto_nao_adequado_rural", "deficit_esgoto_rural_sinisa",
        "dppo_residuos_adequado_urbana", "dppo_residuos_adequado_rural",
        "dppo_residuos_nao_adequado_urbana", "dppo_residuos_nao_adequado_rural",
        "dppo_lixo_coletado_domicilio_urbana", "dppo_lixo_depositado_cacamba_urbana",
        "dppo_lixo_queimado_urbana", "dppo_lixo_enterrado_urbana",
        "dppo_lixo_jogado_terreno_encosta_urbana", "dppo_lixo_outro_destino_urbana",
        "dppo_lixo_coletado_domicilio_rural", "dppo_lixo_depositado_cacamba_rural",
        "dppo_lixo_queimado_rural", "dppo_lixo_enterrado_rural",
        "dppo_lixo_jogado_terreno_encosta_rural", "dppo_lixo_outro_destino_rural",
        "deficit_residuo_rural_ibge", "deficit_residuo_urbana_ibge",
        "snis_populacao_coleta_regular", "sinisa_domicilios_coleta_residuos_solidos_urbana",
        "sinisa_domicilios_coleta_residuos_solidos_rural", "sinisa_residuo_adequado_urbana",
        "sinisa_residuo_adequado_rural", "sinisa_residuo_nao_adequado_urbana",
        "sinisa_residuo_nao_adequado_rural", "sinisa_populacao_coleta_regular",
        "deficit_residuo_rural_sinisa",
        "dppo_com_banheiro_exclusivo_urbana", "dppo_com_banheiro_exclusivo_rural",
        "dppo_sem_banheiro_exclusivo_urbana", "dppo_sem_banheiro_exclusivo_rural",
        "dppo_1_ban_exclus_urbana", "dppo_2_ban_exclus_urbana",
        "dppo_3_ban_exclus_urbana", "dppo_4_ban_exclus_urbana",
        "dppo_ban_uso_comum_urbana", "dppo_sanit_buraco_urbana",
        "dppo_sem_ban_nem_sanit_urbana", "dppo_1_ban_exclus_rural",
        "dppo_2_ban_exclus_rural", "dppo_3_ban_exclus_rural",
        "dppo_4_ban_exclus_rural", "dppo_ban_uso_comum_rural",
        "dppo_sanit_buraco_rural", "dppo_sem_ban_nem_sanit_rural",
        "deficit_banheiro_rural_ibge", "deficit_banheiro_urbana_ibge",
        "snis_populacao_total_2022", "sinisa_populacao_total_2023",
        "sinisa_populacao_urbana_residente", "sinisa_populacao_rural_residente",
        "sinisa_domicilios_totais_existentes", "sinisa_domicilios_urbanos",
        "sinisa_domicilios_rurais", "sinisa_declarou_possuir_pmsb",
        "sinisa_declarou_possuir_pmsb_elaboracao", "componentes_abrangidos_pmsb",
        "area_abrangida_pmsb", "sinisa_declarou_possuir_pmgirs",
        "sinisa_declarou_possuir_plano_drenagem", "sinisa_existencia_entidade_regulacao_agua",
        "sinisa_nome_entidade_regulacao_agua", "sinisa_existencia_entidade_regulacao_esgoto",
        "sinisa_nome_entidade_regulacao_esgoto", "sinisa_existencia_entidade_regulacao_residuos",
        "sinisa_nome_entidade_regulacao_residuos", "sinisa_existencia_entidade_regulacao_drenagem",
        "sinisa_nome_entidade_regulacao_drenagem", "sinisa_existencia_conselho_saneamento",
        "sinisa_existencia_conselho_afins_saneamento", "sinisa_participacao_consorcio_saneamento",
        "sinisa_existencia_plano_regional_atuacao_consorcio", "sinisa_servicos_prestados_consorcio",
        "sinisa_adimplencia_gestao_municipal", "sinisa_adimplencia_agua",
        "sinisa_adimplencia_esgoto", "sinisa_adimplencia_residuos",
        "sinisa_adimplencia_aguas_pluviais", "sinisa_prestadores_servico_agua",
        "natureza_juridica_prestadores_agua", "area_atuacao_prestadores_agua",
        "sinisa_prestadores_servico_esgoto", "natureza_juridica_prestadores_esgoto",
        "area_atuacao_prestadores_esgoto", "qtde_familias_baixa_renda_urbana",
        "qtde_familias_baixa_renda_rural", "referencia",
        "qtde_familias_esgoto_nbf_rede", "qtde_familias_esgoto_nbf_fossa_septica",
        "qtde_familias_esgoto_nbf_fossa_rudimentar", "qtde_familias_esgoto_nbf_vala",
        "qtde_familias_esgoto_nbf_riolagomar", "qtde_familias_esgoto_nbf_outras",
        "qtde_familias_esgoto_nbf_sem_info", "qtde_familias_esgoto_bf_rede",
        "qtde_familias_esgoto_bf_fossa_septica", "qtde_familias_esgoto_bf_fossa_rudimentar",
        "qtde_familias_esgoto_bf_vala", "qtde_familias_esgoto_bf_riolagomar",
        "qtde_familias_esgoto_bf_outras", "qtde_familias_esgoto_bf_sem_info",
        "qtde_familias_agua_poco_nascente", "qtde_familias_agua_cisterna",
        "qtde_familias_agua_outras", "qtde_familias_agua_sem_info",
        "qtde_familias_pobreza_urbana", "qtde_familias_ate_meio_sm_urbana",
        "qtde_familias_acima_meio_sm_urbana", "qtde_familias_pobreza_rural",
        "qtde_familias_ate_meio_sm_rural", "qtde_familias_acima_meio_sm_rural",
        "percentual_familias_pobreza_baixa_renda_rural",
        "qtde_familias_lixo_coleta_diretamente", "qtde_familias_lixo_coleta_indiretamente",
        "qtde_familias_lixo_queimado_enterrado", "qtde_familias_lixo_terreno_baldio_logradouro",
        "qtde_familias_lixo_riolagomar", "qtde_familias_lixo_outras",
        "qtde_familias_lixo_sem_info", "qtde_instrumentos_dsr",
        "ranking_agua_nao_adequado_ibge", "ranking_esgoto_nao_adequado_ibge",
        "ranking_residuos_nao_adequado_ibge", "ranking_sem_banheiro_exclusivo_rural_ibge",
        "ranking_agua_nao_adequado_sinisa", "ranking_esgoto_nao_adequado_sinisa",
        "ranking_residuo_nao_adequado_sinisa",
    ],
    "setor_censitario": [
        "cod_setor", "cod_sit", "situacao", "situacao_detalhada", "cod_tipo",
        "tipo", "com_pessoas", "todos_dados_omitidos", "com_dados",
        "cod_municipio", "nome_municipio", "cod_uf", "semiarido_2022",
        "amazonia_legal", "vale_jequetinhonha", "sigla_uf", "regiao",
        "area_km2", "longitude", "latitude", "total_pessoas", "total_domicilios",
        "total_domicilios_particulares", "total_domicilios_coletivos",
        "total_domicilios_particulares_ocupados",
        "dppo_domicilios_particulares_permanentes_ocupados",
        "dpio_domicilios_particulares_improvisados_ocupados",
        "dccm_domicilios_coletivos_com_morador", "moradores_dppo",
        "moradores_dpio", "moradores_dccm", "dppo_agua_rede",
        "dppo_agua_poco_prof", "dppo_agua_poco_raso", "dppo_agua_nascente",
        "dppo_agua_pipa", "dppo_agua_chuva", "dppo_agua_rio_acude",
        "dppo_agua_outra", "perc_agua_forma_adequada",
        "perc_agua_forma_nao_adequada", "dppo_agua_encanada_interna",
        "dppo_agua_encanada_terreno", "dppo_agua_nao_chega_encanada",
        "dppo_ban_1_exclus", "dppo_ban_2_exclus", "dppo_ban_3_exclus",
        "dppo_ban_4_mais_exclus", "dppo_ban_uso_comum",
        "dppo_ban_sanit_buraco", "dppo_ban_sem_ban_nem_sanit",
        "dppo_ban_com_ban_exclusivo", "dppo_ban_sem_ban_exclusivo",
        "perc_ban_com_ban_exclusivo", "perc_ban_sem_ban_exclusivo",
        "dppo_esgoto_rede", "dppo_esgoto_fossa_septica_lig_rede",
        "dppo_esgoto_fossa_septica_nao_lig_rede",
        "dppo_esgoto_fossa_rudimentar", "dppo_esgoto_vala",
        "dppo_esgoto_rio_lago_mar", "dppo_esgoto_outra_forma",
        "dppo_esgoto_sem_ban_nem_sanit", "perc_esgoto_tipo_adequado",
        "perc_esgoto_tipo_nao_adequado", "dppo_lixo_coletado_domicilio",
        "dppo_lixo_depositado_cacamba", "dppo_lixo_queimado",
        "dppo_lixo_enterrado", "dppo_lixo_jogado_terreno_encosta",
        "dppo_lixo_outro_destino", "perc_lixo_destino_adequado",
        "perc_lixo_destino_nao_adequado", "dppo_agua_rede_mas_utiliza_outra_forma",
        "dppo_agua_sem_ligacao_rede", "demografia_qtde_moradores",
        "demografia_masculino", "demografia_femenino", "demografia_0_4_anos",
        "demografia_5_9_anos", "demografia_10_14_anos",
        "demografia_15_19_anos", "demografia_20_24_anos",
        "demografia_25_29_anos", "demografia_30_39_anos",
        "demografia_40_49_anos", "demografia_50_59_anos",
        "demografia_60_69_anos", "demografia_70_mais_anos",
    ],
    "instrumento": [
        "nr_instrumento", "nr_proposta", "operacao", "nr_proposta_selecao_pac",
        "nr_reservado", "ano_proposta", "tipo_instrumento", "novo_pac",
        "acao_orcamentaria", "componente", "acao_padronizada",
        "nome_proponente", "uf", "qtde_municipios", "municipios_beneficiados",
        "qtde_comunidades_rurais_beneficiadas", "comunidades_rurais_beneficiadas",
        "qtde_familias_beneficiadas", "objeto", "categoria", "status",
        "dia_assin_conv", "dia_inic_vigenc_conv", "dia_fim_vigenc_conv",
        "dias_termino_vigencia", "termino_vigencia", "valor_global",
        "valor_repasse", "valor_contrapartida", "nivel", "valor_empenhado",
        "valor_a_empenhar", "valor_desembolsado", "valor_empenhado_a_desembolsar",
        "valor_a_desembolsar", "qtde_parcelas", "parcela_1", "parcela_2",
        "parcela_3", "parcela_4", "parcela_5", "parcela_6", "parcela_7",
        "ultima_parcela_paga", "proxima_parcela_a_pagar",
        "valor_a_pagar_proxima_parcela", "saldo_empenho",
        "necessidade_empenho_proxima_parcela", "situacao_contratacao",
        "liminar_judicial", "normal", "motivo_suspensao", "data_suspensiva",
        "dias_prazo_suspensiva", "prazo_suspensiva", "suspensiva_projeto",
        "suspensiva_licenca_ambiental", "suspensiva_sustentabilidade",
        "suspensiva_trabalho_social", "suspensiva_titularidade_area",
        "suspensiva_termo_referencia", "suspensiva_artigo_50",
        "suspensiva_outra", "data_retirada_suspensiva",
        "data_condicao_suspensiva", "situacao_projeto",
        "data_primeiro_envio_projeto", "data_ultima_versao_lae",
        "situacao_ultima_versao_lae", "data_aceite_projeto",
        "qtde_licitacoes_maior_10_porc", "qtde_licitacoes_maior_10_porc_enviada",
        "data_primeira_publicacao_licitacao", "qtde_licitacoes_sem_aceite_15",
        "qtde_licitacoes_sem_aceite_30", "data_primeiro_aceite_vrpl",
        "qtde_licitacoes_sem_contrato_15", "qtde_licitacoes_sem_contrato_30",
        "data_solicitacao_aio", "data_atendimento_equipe_aio",
        "data_atendimento_executiva_aio", "data_saida_processo_aio",
        "possui_aio", "primeira_data_emissao_aio", "data_inicio_obra",
        "previsao_duracao_obra", "data_fim_periodo_ultima_medicao",
        "qtde_dias_sem_medicao", "data_primeiro_pagamento",
        "data_ultimo_pagamento", "valor_pago", "situacao_contrato",
        "situacao_obra", "percentual_fisico_informado",
        "percentual_fisico_aferido", "percentual_financeiro_desbloqueado",
        "valor_desbloqueado", "data_ultimo_bm", "data_ultima_vistoria",
        "data_ultimo_desbloqueio", "data_ultima_obtv", "carteira_ativa",
        "data_termino_obra", "situacao_atual", "paralisada",
        "principal_motivo_paralisacao", "detalhamento_motivo_paralisacao",
        "descricao_motivo_paralisacao", "data_paralisacao",
        "dias_sem_evolucao", "fase_instrumento", "classificacao_tempo",
        "prestador_agua_sinisa", "prestador_esgoto_sinisa",
        "link_transferegov", "data_dados_transferegov",
        "data_dados_caixa", "coordenacao",
    ],
}

LABELS = {
    "nome": "Município",
    "sigla_uf": "UF",
    "regiao": "Região",
    "cod_municipio": "Código IBGE do município",
    "cod_uf": "Código da UF",

    "tipo_catmetropol": "Tipo de categoria metropolitana",
    "categoria_metropolitana": "Categoria metropolitana",
    "label_catmetropol": "Descrição da categoria metropolitana",
    "rm_prioritaria": "Região metropolitana prioritária",
    "subgrupo": "Subgrupo territorial",
    "semiarido_2022": "Semiárido",
    "amazonia_legal": "Amazônia Legal",
    "vale_jequetinhonha": "Vale do Jequitinhonha",
    "elegivel_pac_rural_2025": "Elegível ao PAC Rural 2025",
    "idhm_2010": "IDHM 2010",
    "indice_firjan_2016": "Índice Firjan 2016",
    "capag_municipal": "CAPAG municipal",

    "cod_setor": "Código do setor censitário",
    "situacao": "Situação",
    "situacao_detalhada": "Situação detalhada",
    "com_dados": "Com dados",
    "com_pessoas": "Com pessoas",
    "todos_dados_omitidos": "Dados omitidos",

    "nr_instrumento": "Número do instrumento",
    "nr_proposta": "Número da proposta",
    "operacao": "Operação",
    "nome_proponente": "Proponente",
    "uf": "UF",
    "municipios_beneficiados": "Municípios beneficiados",
    "valor_global": "Valor global",
    "valor_repasse": "Valor de repasse",
    "valor_contrapartida": "Valor de contrapartida",
    "valor_empenhado": "Valor empenhado",
    "valor_desembolsado": "Valor desembolsado",
    "valor_desbloqueado": "Valor desbloqueado",
    "situacao_contratacao": "Situação da contratação",
    "fase_instrumento": "Fase do instrumento",
    "tipo_instrumento": "Tipo de instrumento",
    "acao_padronizada": "Ação",
    "carteira_ativa": "Carteira ativa",
    "novo_pac": "Novo PAC",
    "coordenacao": "Coordenação",
    "data_dados_transferegov": "Data dos dados Transferegov",
    "data_dados_caixa": "Data dos dados Caixa",
}

def _grupo(tipo_tabela: str, column: str) -> str:
    if column in CAMPOS_AVANCADOS[tipo_tabela]:
        return "Campos avançados"

    if tipo_tabela == "municipio":
        if column in {"nome", "sigla_uf", "regiao"}:
            return "Identificação e localização"
        if column in {"tipo_catmetropol", "categoria_metropolitana", "label_catmetropol", "rm_prioritaria", "subgrupo", "semiarido_2022", "amazonia_legal", "vale_jequetinhonha", "elegivel_pac_rural_2025"}:
            return "Território"
        if column == "qtde_instrumentos_dsr":
            return "Carteira DSR"
        if column.startswith("populacao") or column.startswith("domicilios") or column.startswith("dppo_total") or column in {"dppo_urbana", "dppo_rural"}:
            return "População e domicílios"
        if "agua" in column:
            return "Água"
        if "esgoto" in column:
            return "Esgoto"
        if "residuo" in column or "lixo" in column:
            return "Resíduos sólidos"
        if "ban" in column or "sanit" in column:
            return "Banheiro/sanitário"
        if column.startswith("snis_"):
            return "SNIS"
        if column.startswith("sinisa_") or column.startswith("componentes_") or column.startswith("area_abrangida"):
            if "prestador" in column or "natureza_juridica" in column or "area_atuacao" in column:
                return "Prestadores de serviço"
            if "plano" in column or "regulacao" in column or "conselho" in column or "consorcio" in column or "adimplencia" in column or "pmsb" in column or "pmgirs" in column:
                return "Planos e regulação"
            return "SINISA"
        if column.startswith("qtde_familias") or column == "percentual_familias_pobreza_baixa_renda_rural":
            return "CadÚnico"
        return "Indicadores"

    if tipo_tabela == "setor_censitario":
        if column in {"nome_municipio", "sigla_uf", "regiao", "area_km2"}:
            return "Identificação e localização"
        if column in {"situacao", "situacao_detalhada", "tipo", "com_pessoas", "todos_dados_omitidos", "com_dados"}:
            return "Situação do setor"
        if column in {"semiarido_2022", "amazonia_legal", "vale_jequetinhonha"}:
            return "Território"
        if column.startswith("total_") or column.startswith("moradores") or column.startswith("dppo_domicilios") or column.startswith("dpio") or column.startswith("dccm"):
            return "População e domicílios"
        if "agua" in column:
            return "Água"
        if "esgoto" in column:
            return "Esgoto"
        if "lixo" in column:
            return "Resíduos sólidos"
        if "ban" in column or "sanit" in column:
            return "Banheiro/sanitário"
        if column.startswith("demografia"):
            return "Demografia"
        return "Campos avançados"

    if tipo_tabela == "instrumento":
        if column in {"nr_instrumento", "nr_proposta", "nr_proposta_selecao_pac", "ano_proposta", "tipo_instrumento", "novo_pac", "link_transferegov"}:
            return "Identificação do instrumento"
        if column in {"uf", "qtde_municipios", "municipios_beneficiados"}:
            return "Localização"
        if column in {"acao_orcamentaria", "componente", "acao_padronizada", "categoria", "objeto", "coordenacao", "qtde_comunidades_rurais_beneficiadas", "comunidades_rurais_beneficiadas", "qtde_familias_beneficiadas"}:
            return "Carteira DSR"
        if column.startswith("valor_") or column in {"saldo_empenho", "necessidade_empenho_proxima_parcela"}:
            return "Valores financeiros"
        if column.startswith("data_") or column.startswith("dia_") or column in {"termino_vigencia", "dias_termino_vigencia"}:
            return "Datas"
        if column == "nome_proponente":
            return "Proponente"
        if column in {"status", "situacao_contratacao", "fase_instrumento", "carteira_ativa", "situacao_atual", "situacao_contrato", "classificacao_tempo"}:
            return "Situação e fase"
        if "suspensiva" in column or column in {"liminar_judicial", "motivo_suspensao", "paralisada", "principal_motivo_paralisacao", "detalhamento_motivo_paralisacao", "descricao_motivo_paralisacao", "dias_sem_evolucao"}:
            return "Suspensivas e paralisação"
        if column in {"situacao_obra", "percentual_fisico_informado", "percentual_fisico_aferido", "percentual_financeiro_desbloqueado", "possui_aio", "previsao_duracao_obra", "qtde_dias_sem_medicao", "valor_pago", "prestador_agua_sinisa", "prestador_esgoto_sinisa"}:
            return "Obra e execução"
        return "Campos avançados"

    return "Campos avançados"

def _tipo_dado(column: str) -> tuple[str, str]:
    if column.startswith("data_") or column.startswith("dia_") or column in {"termino_vigencia", "referencia"}:
        return "date", "date"
    if column.startswith("valor_") or column in {"saldo_empenho", "necessidade_empenho_proxima_parcela"}:
        return "currency", "brl"
    if column.startswith("perc_") or column.startswith("percentual_") or column.startswith("deficit_"):
        return "percent", "percent"
    if column.startswith("cod_") or column.startswith("qtde_") or column.startswith("dias_") or column.startswith("ranking_") or column.startswith("total_") or column.startswith("domicilios") or column.startswith("dppo") or column.startswith("dpio") or column.startswith("dccm") or column.startswith("moradores") or column.startswith("demografia") or column.startswith("populacao") or column.startswith("snis_populacao") or column.startswith("sinisa_populacao") or column.startswith("sinisa_domicilios"):
        return "integer", "integer"
    if column.startswith("latitude") or column.startswith("longitude") or column == "area_km2":
        return "decimal", "decimal"
    if column in {"semiarido_2022", "amazonia_legal", "vale_jequetinhonha", "rm_prioritaria", "elegivel_pac_rural_2025", "com_pessoas", "todos_dados_omitidos", "com_dados", "populacao_total_censo_2022_maior_50000"}:
        return "boolean", "boolean"
    return "text", "text"

def _label(column: str) -> str:
    if column in LABELS:
        return LABELS[column]

    replacements = {
        "cod": "Codigo",
        "qtde": "Quantidade",
        "dppo": "DPPO",
        "dpio": "DPIO",
        "dccm": "DCCM",
        "snis": "SNIS",
        "sinisa": "SINISA",
        "idhm": "IDHM",
        "ifdm": "IFDM",
        "ibge": "IBGE",
        "uf": "UF",
        "aio": "AIO",
        "bm": "BM",
        "obtv": "OBTV",
        "pmsb": "PMSB",
        "pmgirs": "PMGIRS",
        "pac": "PAC",
        "dsr": "DSR",
        "rural": "rural",
        "urbana": "urbana",
        "urbano": "urbano",
    }

    parts = column.split("_")
    words = [replacements.get(part, part.capitalize()) for part in parts]
    return " ".join(words)

def montar_catalogo() -> list[dict]:
    catalogo: list[dict] = []

    for tipo_tabela, columns in CAMPOS_REAIS.items():
        view = TIPOS_TABELA[tipo_tabela]["view"]

        for column in columns:
            if column in CAMPOS_IGNORADOS[tipo_tabela]:
                continue

            tipo_dado, formato = _tipo_dado(column)
            grupo = _grupo(tipo_tabela, column)

            catalogo.append({
                "id": f"{tipo_tabela}.{column}",
                "label": _label(column),
                "view": view,
                "column": column,
                "tipo_tabela": tipo_tabela,
                "grupo": grupo,
                "tipo_dado": tipo_dado,
                "formato": formato,
                "visivel": True,
                "exportavel": True,
                "padrao": column in CAMPOS_PADRAO[tipo_tabela],
                "descricao": "",
            })

    return catalogo

FIELD_CATALOG = montar_catalogo()
FIELD_BY_ID = {field["id"]: field for field in FIELD_CATALOG}

def listar_campos(tipo_tabela: str) -> list[dict]:
    return [field for field in FIELD_CATALOG if field["tipo_tabela"] == tipo_tabela]

def obter_campo(field_id: str) -> dict | None:
    return FIELD_BY_ID.get(field_id)