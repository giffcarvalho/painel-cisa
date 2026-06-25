"""Catálogo fechado do Extrator de Dados.

O frontend envia apenas field_ids. Este módulo traduz cada field_id para a
view, a coluna técnica e os metadados de apresentação autorizados.
"""

from __future__ import annotations


TIPOS_TABELA = {
    "municipio": {
        "label": "Por município",
        "view": "territorio.vw_base_municipal",
        "descricao": "Uma linha por município.",
        "ordem": ["cod_municipio", "nome"],
    },
    "setor_censitario": {
        "label": "Por setor censitário",
        "view": "censo.vw_base_setor_censitario",
        "descricao": "Uma linha por setor censitário.",
        "ordem": ["cod_setor"],
    },
    "instrumento": {
        "label": "Por instrumento DSR",
        "view": "instrumento.vw_carteira_dsr",
        "descricao": "Uma linha por instrumento da Carteira DSR.",
        "ordem": ["nr_instrumento", "nr_proposta"],
    },
}


CAMPOS_IGNORADOS = {
    "municipio": {
        "nome_municipio",
        "jenks_deficit_agua_rural_ibge",
        "jenks_deficit_esgoto_rural_ibge",
        "jenks_deficit_residuo_rural_ibge",
        "jenks_deficit_banheiro_rural_ibge",
        "jenks_deficit_agua_urbana_ibge",
        "jenks_deficit_esgoto_urbana_ibge",
        "jenks_deficit_residuo_urbana_ibge",
        "jenks_deficit_banheiro_urbana_ibge",
        "uf",
        "geom_sede",
        "geom_2022",
    },
    "setor_censitario": {
        "cod_sit_virtual",
        "jenks_perc_agua_forma_nao_adequada",
        "jenks_perc_ban_sem_ban_exclusivo",
        "jenks_perc_esgoto_tipo_nao_adequado",
        "jenks_perc_lixo_destino_nao_adequado",
        "geom",
    },
    "instrumento": {
        "normal",
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


CAMPOS_CATALOGADOS = {
    "municipio": {
        "Identificação territorial": [
            ("cod_municipio", "Código do município"),
            ("nome", "Nome do município"),
            ("cod_uf", "Código da UF"),
            ("sigla_uf", "Sigla da UF"),
        ],
        "Território": [
            ("regiao", "Região"),
            ("tipo_catmetropol", "Tipo de categoria metropolitana"),
            ("categoria_metropolitana", "Categoria metropolitana"),
            ("label_catmetropol", "Rótulo da categoria metropolitana"),
            ("rm_prioritaria", "RM prioritária"),
            ("subgrupo", "Subgrupo"),
            ("semiarido_2022", "Semiárido 2022"),
            ("amazonia_legal", "Amazônia Legal"),
            ("vale_jequetinhonha", "Vale do Jequitinhonha"),
            ("elegivel_pac_rural_2025", "Elegível ao PAC Rural 2025"),
        ],
        "Indicadores socioeconômicos": [
            ("idhm_2010", "IDHM 2010"),
            ("indice_firjan_2016", "Índice FIRJAN 2016"),
            ("capag_municipal", "CAPAG municipal"),
        ],
        "Coordenadas": [
            ("latitude_sede", "Latitude da sede"),
            ("longitude_sede", "Longitude da sede"),
        ],
        "IBGE — População e domicílios": [
            ("populacao_total_censo_2022", "População total — Censo 2022"),
            ("populacao_total_censo_2022_maior_50000", "População total maior que 50.000 — Censo 2022"),
            ("populacao_urbana_censo_2022", "População urbana — Censo 2022"),
            ("populacao_rural_censo_2022", "População rural — Censo 2022"),
            ("domicilios_total", "Domicílios totais"),
            ("domicilios_coletivos", "Domicílios coletivos"),
            ("domicilios_particulares", "Domicílios particulares"),
            ("dppo_total", "DPPO total"),
            ("dppo_urbana", "DPPO urbana"),
            ("dppo_rural", "DPPO rural"),
        ],
        "IBGE — Água": [
            ("dppo_agua_adequado_urbana", "DPPO com abastecimento de água por forma adequada — urbana"),
            ("dppo_agua_adequado_rural", "DPPO com abastecimento de água por forma adequada — rural"),
            ("dppo_agua_nao_adequado_urbana", "DPPO com abastecimento de água por forma não adequada — urbana"),
            ("dppo_agua_nao_adequado_rural", "DPPO com abastecimento de água por forma não adequada — rural"),
            ("dppo_agua_rede_urbana", "DPPO com abastecimento de água por rede geral — urbana"),
            ("dppo_agua_poco_prof_urbana", "DPPO com abastecimento de água por poço profundo — urbana"),
            ("dppo_agua_poco_raso_urbana", "DPPO com abastecimento de água por poço raso — urbana"),
            ("dppo_agua_nascente_urbana", "DPPO com abastecimento de água por nascente — urbana"),
            ("dppo_agua_pipa_urbana", "DPPO com abastecimento de água por carro-pipa — urbana"),
            ("dppo_agua_chuva_urbana", "DPPO com abastecimento de água por água da chuva — urbana"),
            ("dppo_agua_rio_acude_urbana", "DPPO com abastecimento de água por rio ou açude — urbana"),
            ("dppo_agua_outra_urbana", "DPPO com abastecimento de água por outra forma — urbana"),
            ("dppo_agua_rede_rural", "DPPO com abastecimento de água por rede geral — rural"),
            ("dppo_agua_poco_prof_rural", "DPPO com abastecimento de água por poço profundo — rural"),
            ("dppo_agua_poco_raso_rural", "DPPO com abastecimento de água por poço raso — rural"),
            ("dppo_agua_nascente_rural", "DPPO com abastecimento de água por nascente — rural"),
            ("dppo_agua_pipa_rural", "DPPO com abastecimento de água por carro-pipa — rural"),
            ("dppo_agua_chuva_rural", "DPPO com abastecimento de água por água da chuva — rural"),
            ("dppo_agua_rio_acude_rural", "DPPO com abastecimento de água por rio ou açude — rural"),
            ("dppo_agua_outra_rural", "DPPO com abastecimento de água por outra forma — rural"),
            ("deficit_agua_rural_ibge", "Déficit de água rural — IBGE"),
            ("deficit_agua_urbana_ibge", "Déficit de água urbana — IBGE"),
            ("ranking_agua_nao_adequado_ibge", "Ranking de água não adequada — IBGE"),
        ],
        "IBGE — Esgoto": [
            ("dppo_esgoto_adequado_urbana", "DPPO com esgotamento sanitário por tipo adequado — urbana"),
            ("dppo_esgoto_adequado_rural", "DPPO com esgotamento sanitário por tipo adequado — rural"),
            ("dppo_esgoto_nao_adequado_urbana", "DPPO com esgotamento sanitário por tipo não adequado — urbana"),
            ("dppo_esgoto_nao_adequado_rural", "DPPO com esgotamento sanitário por tipo não adequado — rural"),
            ("dppo_esgoto_rede_urbana", "DPPO com esgotamento sanitário por rede geral — urbana"),
            ("dppo_esgoto_fossa_septica_lig_rede_urbana", "DPPO com esgotamento sanitário por fossa séptica ligada à rede — urbana"),
            ("dppo_esgoto_fossa_septica_nao_lig_rede_urbana", "DPPO com esgotamento sanitário por fossa séptica não ligada à rede — urbana"),
            ("dppo_esgoto_fossa_rudimentar_urbana", "DPPO com esgotamento sanitário por fossa rudimentar — urbana"),
            ("dppo_esgoto_vala_urbana", "DPPO com esgotamento sanitário por vala — urbana"),
            ("dppo_esgoto_rio_lago_mar_urbana", "DPPO com esgotamento sanitário por rio, lago ou mar — urbana"),
            ("dppo_esgoto_outra_forma_urbana", "DPPO com esgotamento sanitário por outra forma — urbana"),
            ("dppo_esgoto_sem_ban_nem_sanit_urbana", "DPPO com esgotamento sanitário por sem banheiro nem sanitário — urbana"),
            ("dppo_esgoto_rede_rural", "DPPO com esgotamento sanitário por rede geral — rural"),
            ("dppo_esgoto_fossa_septica_lig_rede_rural", "DPPO com esgotamento sanitário por fossa séptica ligada à rede — rural"),
            ("dppo_esgoto_fossa_septica_nao_lig_rede_rural", "DPPO com esgotamento sanitário por fossa séptica não ligada à rede — rural"),
            ("dppo_esgoto_fossa_rudimentar_rural", "DPPO com esgotamento sanitário por fossa rudimentar — rural"),
            ("dppo_esgoto_vala_rural", "DPPO com esgotamento sanitário por vala — rural"),
            ("dppo_esgoto_rio_lago_mar_rural", "DPPO com esgotamento sanitário por rio, lago ou mar — rural"),
            ("dppo_esgoto_outra_forma_rural", "DPPO com esgotamento sanitário por outra forma — rural"),
            ("dppo_esgoto_sem_ban_nem_sanit_rural", "DPPO com esgotamento sanitário por sem banheiro nem sanitário — rural"),
            ("deficit_esgoto_rural_ibge", "Déficit de esgoto rural — IBGE"),
            ("deficit_esgoto_urbana_ibge", "Déficit de esgoto urbana — IBGE"),
            ("ranking_esgoto_nao_adequado_ibge", "Ranking de esgoto não adequado — IBGE"),
        ],
        "IBGE — Resíduos sólidos": [
            ("dppo_residuos_adequado_urbana", "DPPO com resíduos sólidos em adequado dos resíduos — urbana"),
            ("dppo_residuos_adequado_rural", "DPPO com resíduos sólidos em adequado dos resíduos — rural"),
            ("dppo_residuos_nao_adequado_urbana", "DPPO com resíduos sólidos em não adequado dos resíduos — urbana"),
            ("dppo_residuos_nao_adequado_rural", "DPPO com resíduos sólidos em não adequado dos resíduos — rural"),
            ("dppo_lixo_coletado_domicilio_urbana", "DPPO com lixo coletado no domicílio — urbana"),
            ("dppo_lixo_depositado_cacamba_urbana", "DPPO com lixo depositado em caçamba — urbana"),
            ("dppo_lixo_queimado_urbana", "DPPO com lixo queimado — urbana"),
            ("dppo_lixo_enterrado_urbana", "DPPO com lixo enterrado — urbana"),
            ("dppo_lixo_jogado_terreno_encosta_urbana", "DPPO com lixo jogado em terreno ou encosta — urbana"),
            ("dppo_lixo_outro_destino_urbana", "DPPO com outro destino do lixo — urbana"),
            ("dppo_lixo_coletado_domicilio_rural", "DPPO com lixo coletado no domicílio — rural"),
            ("dppo_lixo_depositado_cacamba_rural", "DPPO com lixo depositado em caçamba — rural"),
            ("dppo_lixo_queimado_rural", "DPPO com lixo queimado — rural"),
            ("dppo_lixo_enterrado_rural", "DPPO com lixo enterrado — rural"),
            ("dppo_lixo_jogado_terreno_encosta_rural", "DPPO com lixo jogado em terreno ou encosta — rural"),
            ("dppo_lixo_outro_destino_rural", "DPPO com outro destino do lixo — rural"),
            ("deficit_residuo_rural_ibge", "Déficit de resíduos rurais — IBGE"),
            ("deficit_residuo_urbana_ibge", "Déficit de resíduos urbanos — IBGE"),
            ("ranking_residuos_nao_adequado_ibge", "Ranking de resíduos não adequados — IBGE"),
        ],
        "IBGE — Banheiro e instalações sanitárias": [
            ("dppo_com_banheiro_exclusivo_urbana", "DPPO com banheiro de uso exclusivo — urbana"),
            ("dppo_com_banheiro_exclusivo_rural", "DPPO com banheiro de uso exclusivo — rural"),
            ("dppo_sem_banheiro_exclusivo_urbana", "DPPO sem banheiro de uso exclusivo — urbana"),
            ("dppo_sem_banheiro_exclusivo_rural", "DPPO sem banheiro de uso exclusivo — rural"),
            ("dppo_1_ban_exclus_urbana", "DPPO com 1 banheiro de uso exclusivo — urbana"),
            ("dppo_2_ban_exclus_urbana", "DPPO com 2 banheiros de uso exclusivo — urbana"),
            ("dppo_3_ban_exclus_urbana", "DPPO com 3 banheiros de uso exclusivo — urbana"),
            ("dppo_4_ban_exclus_urbana", "DPPO com 4 ou mais banheiros de uso exclusivo — urbana"),
            ("dppo_ban_uso_comum_urbana", "DPPO com banheiro de uso comum — urbana"),
            ("dppo_sanit_buraco_urbana", "DPPO com sanitário ou buraco para dejeções — urbana"),
            ("dppo_sem_ban_nem_sanit_urbana", "DPPO sem banheiro nem sanitário — urbana"),
            ("dppo_1_ban_exclus_rural", "DPPO com 1 banheiro de uso exclusivo — rural"),
            ("dppo_2_ban_exclus_rural", "DPPO com 2 banheiros de uso exclusivo — rural"),
            ("dppo_3_ban_exclus_rural", "DPPO com 3 banheiros de uso exclusivo — rural"),
            ("dppo_4_ban_exclus_rural", "DPPO com 4 ou mais banheiros de uso exclusivo — rural"),
            ("dppo_ban_uso_comum_rural", "DPPO com banheiro de uso comum — rural"),
            ("dppo_sanit_buraco_rural", "DPPO com sanitário ou buraco para dejeções — rural"),
            ("dppo_sem_ban_nem_sanit_rural", "DPPO sem banheiro nem sanitário — rural"),
            ("deficit_banheiro_rural_ibge", "Déficit de banheiro rural — IBGE"),
            ("deficit_banheiro_urbana_ibge", "Déficit de banheiro urbano — IBGE"),
            ("ranking_sem_banheiro_exclusivo_rural_ibge", "Ranking sem banheiro de uso exclusivo rural — IBGE"),
        ],
        "SNIS": [
            ("snis_populacao_total_2022", "População total SNIS 2022"),
            ("snis_populacao_adequada_agua", "População com água adequada — SNIS"),
            ("snis_populacao_adequada_esgoto", "População com esgoto adequado — SNIS"),
            ("snis_populacao_coleta_regular", "População com coleta regular — SNIS"),
        ],
        "SINISA — População e domicílios": [
            ("sinisa_populacao_total_2023", "População total SINISA 2023"),
            ("sinisa_populacao_urbana_residente", "População urbana residente — SINISA"),
            ("sinisa_populacao_rural_residente", "População rural residente — SINISA"),
            ("sinisa_domicilios_totais_existentes", "Domicílios totais existentes — SINISA"),
            ("sinisa_domicilios_urbanos", "Domicílios urbanos — SINISA"),
            ("sinisa_domicilios_rurais", "Domicílios rurais — SINISA"),
        ],
        "SINISA — Água": [
            ("sinisa_populacao_rede_agua_urbana", "População com rede de agua — urbana — SINISA"),
            ("sinisa_populacao_rede_agua_rural", "População com rede de agua — rural — SINISA"),
            ("sinisa_populacao_alternativa_agua_urbana", "População com solução alternativa de agua — urbana — SINISA"),
            ("sinisa_populacao_alternativa_agua_rural", "População com solução alternativa de agua — rural — SINISA"),
            ("sinisa_agua_adequado_urbano", "Água adequado — urbano — SINISA"),
            ("sinisa_agua_adequado_rural", "Água adequado — rural — SINISA"),
            ("sinisa_agua_nao_adequado_urbano", "Água não adequado — urbano — SINISA"),
            ("sinisa_agua_nao_adequado_rural", "Água não adequado — rural — SINISA"),
            ("deficit_agua_rural_sinisa", "Déficit de água rural — SINISA"),
            ("ranking_agua_nao_adequado_sinisa", "Ranking de água não adequada — SINISA"),
        ],
        "SINISA — Esgoto": [
            ("sinisa_populacao_rede_esgoto_urbana", "População com rede de esgoto — urbana — SINISA"),
            ("sinisa_populacao_rede_esgoto_rural", "População com rede de esgoto — rural — SINISA"),
            ("sinisa_populacao_alternativa_esgoto_urbana", "População com solução alternativa de esgoto — urbana — SINISA"),
            ("sinisa_populacao_alternativa_esgoto_rural", "População com solução alternativa de esgoto — rural — SINISA"),
            ("sinisa_esgoto_adequado_urbano", "Esgoto adequado — urbano — SINISA"),
            ("sinisa_esgoto_adequado_rural", "Esgoto adequado — rural — SINISA"),
            ("sinisa_esgoto_nao_adequado_urbano", "Esgoto não adequado — urbano — SINISA"),
            ("sinisa_esgoto_nao_adequado_rural", "Esgoto não adequado — rural — SINISA"),
            ("deficit_esgoto_rural_sinisa", "Déficit de esgoto rural — SINISA"),
            ("ranking_esgoto_nao_adequado_sinisa", "Ranking de esgoto não adequado — SINISA"),
        ],
        "SINISA — Resíduos sólidos": [
            ("sinisa_domicilios_coleta_residuos_solidos_urbana", "Domicílios com coleta de resíduos sólidos — urbana — SINISA"),
            ("sinisa_domicilios_coleta_residuos_solidos_rural", "Domicílios com coleta de resíduos sólidos — rural — SINISA"),
            ("sinisa_residuo_adequado_urbana", "Resíduos sólidos adequado — urbana — SINISA"),
            ("sinisa_residuo_adequado_rural", "Resíduos sólidos adequado — rural — SINISA"),
            ("sinisa_residuo_nao_adequado_urbana", "Resíduos sólidos não adequado — urbana — SINISA"),
            ("sinisa_residuo_nao_adequado_rural", "Resíduos sólidos não adequado — rural — SINISA"),
            ("sinisa_populacao_coleta_regular", "População com coleta regular — SINISA"),
            ("deficit_residuo_rural_sinisa", "Déficit de resíduos rurais — SINISA"),
            ("ranking_residuo_nao_adequado_sinisa", "Ranking de resíduos não adequados — SINISA"),
        ],
        "SINISA — Planos, regulação e gestão": [
            ("sinisa_declarou_possuir_pmsb", "Declarou possuir PMSB — SINISA"),
            ("sinisa_declarou_possuir_pmsb_elaboracao", "Declarou possuir PMSB em elaboração — SINISA"),
            ("componentes_abrangidos_pmsb", "Componentes abrangidos pelo PMSB"),
            ("area_abrangida_pmsb", "Área abrangida pelo PMSB"),
            ("sinisa_declarou_possuir_pmgirs", "Declarou possuir PMGIRS — SINISA"),
            ("sinisa_declarou_possuir_plano_drenagem", "Declarou possuir plano de drenagem — SINISA"),
            ("sinisa_existencia_entidade_regulacao_agua", "Existência de entidade reguladora de água — SINISA"),
            ("sinisa_nome_entidade_regulacao_agua", "Nome da entidade reguladora de água — SINISA"),
            ("sinisa_existencia_entidade_regulacao_esgoto", "Existência de entidade reguladora de esgoto — SINISA"),
            ("sinisa_nome_entidade_regulacao_esgoto", "Nome da entidade reguladora de esgoto — SINISA"),
            ("sinisa_existencia_entidade_regulacao_residuos", "Existência de entidade reguladora de resíduos — SINISA"),
            ("sinisa_nome_entidade_regulacao_residuos", "Nome da entidade reguladora de resíduos — SINISA"),
            ("sinisa_existencia_entidade_regulacao_drenagem", "Existência de entidade reguladora de drenagem — SINISA"),
            ("sinisa_nome_entidade_regulacao_drenagem", "Nome da entidade reguladora de drenagem — SINISA"),
            ("sinisa_existencia_conselho_saneamento", "Existência de conselho de saneamento — SINISA"),
            ("sinisa_existencia_conselho_afins_saneamento", "Existência de conselho afim ao saneamento — SINISA"),
            ("sinisa_participacao_consorcio_saneamento", "Participação em consórcio de saneamento — SINISA"),
            ("sinisa_existencia_plano_regional_atuacao_consorcio", "Existência de plano regional de atuação do consórcio — SINISA"),
            ("sinisa_servicos_prestados_consorcio", "Serviços prestados pelo consórcio — SINISA"),
            ("sinisa_adimplencia_gestao_municipal", "Adimplência da gestão municipal — SINISA"),
            ("sinisa_adimplencia_agua", "Adimplência de água — SINISA"),
            ("sinisa_adimplencia_esgoto", "Adimplência de esgoto — SINISA"),
            ("sinisa_adimplencia_residuos", "Adimplência de resíduos — SINISA"),
            ("sinisa_adimplencia_aguas_pluviais", "Adimplência de águas pluviais — SINISA"),
        ],
        "SINISA — Prestadores de serviço": [
            ("sinisa_prestadores_servico_agua", "Prestadores de serviço de água — SINISA"),
            ("natureza_juridica_prestadores_agua", "Natureza jurídica dos prestadores de água"),
            ("area_atuacao_prestadores_agua", "Área de atuação dos prestadores de água"),
            ("sinisa_prestadores_servico_esgoto", "Prestadores de serviço de esgoto — SINISA"),
            ("natureza_juridica_prestadores_esgoto", "Natureza jurídica dos prestadores de esgoto"),
            ("area_atuacao_prestadores_esgoto", "Área de atuação dos prestadores de esgoto"),
        ],
        "Vulnerabilidade e CadÚnico": [
            ("referencia", "Referência"),
            ("qtde_familias_baixa_renda_urbana", "Quantidade de famílias de baixa renda urbana"),
            ("qtde_familias_baixa_renda_rural", "Quantidade de famílias de baixa renda rural"),
            ("qtde_familias_esgoto_nbf_rede", "Quantidade de famílias não beneficiárias do Bolsa Família com esgotamento sanitário por rede geral"),
            ("qtde_familias_esgoto_nbf_fossa_septica", "Quantidade de famílias não beneficiárias do Bolsa Família com esgotamento sanitário por fossa séptica"),
            ("qtde_familias_esgoto_nbf_fossa_rudimentar", "Quantidade de famílias não beneficiárias do Bolsa Família com esgotamento sanitário por fossa rudimentar"),
            ("qtde_familias_esgoto_nbf_vala", "Quantidade de famílias não beneficiárias do Bolsa Família com esgotamento sanitário por vala"),
            ("qtde_familias_esgoto_nbf_riolagomar", "Quantidade de famílias não beneficiárias do Bolsa Família com esgotamento sanitário por rio, lago ou mar"),
            ("qtde_familias_esgoto_nbf_outras", "Quantidade de famílias não beneficiárias do Bolsa Família com esgotamento sanitário por outras formas"),
            ("qtde_familias_esgoto_nbf_sem_info", "Quantidade de famílias não beneficiárias do Bolsa Família com esgotamento sanitário por sem informação"),
            ("qtde_familias_esgoto_bf_rede", "Quantidade de famílias beneficiárias do Bolsa Família com esgotamento sanitário por rede geral"),
            ("qtde_familias_esgoto_bf_fossa_septica", "Quantidade de famílias beneficiárias do Bolsa Família com esgotamento sanitário por fossa séptica"),
            ("qtde_familias_esgoto_bf_fossa_rudimentar", "Quantidade de famílias beneficiárias do Bolsa Família com esgotamento sanitário por fossa rudimentar"),
            ("qtde_familias_esgoto_bf_vala", "Quantidade de famílias beneficiárias do Bolsa Família com esgotamento sanitário por vala"),
            ("qtde_familias_esgoto_bf_riolagomar", "Quantidade de famílias beneficiárias do Bolsa Família com esgotamento sanitário por rio, lago ou mar"),
            ("qtde_familias_esgoto_bf_outras", "Quantidade de famílias beneficiárias do Bolsa Família com esgotamento sanitário por outras formas"),
            ("qtde_familias_esgoto_bf_sem_info", "Quantidade de famílias beneficiárias do Bolsa Família com esgotamento sanitário por sem informação"),
            ("qtde_familias_agua_poco_nascente", "Quantidade de famílias com abastecimento de água por poço ou nascente"),
            ("qtde_familias_agua_cisterna", "Quantidade de famílias com abastecimento de água por cisterna"),
            ("qtde_familias_agua_outras", "Quantidade de famílias com abastecimento de água por outras formas"),
            ("qtde_familias_agua_sem_info", "Quantidade de famílias com abastecimento de água por sem informação"),
            ("qtde_familias_pobreza_urbana", "Quantidade de famílias em situação de pobreza — urbana"),
            ("qtde_familias_ate_meio_sm_urbana", "Quantidade de famílias com renda até meio salário mínimo — urbana"),
            ("qtde_familias_acima_meio_sm_urbana", "Quantidade de famílias com renda acima de meio salário mínimo — urbana"),
            ("qtde_familias_pobreza_rural", "Quantidade de famílias em situação de pobreza — rural"),
            ("qtde_familias_ate_meio_sm_rural", "Quantidade de famílias com renda até meio salário mínimo — rural"),
            ("qtde_familias_acima_meio_sm_rural", "Quantidade de famílias com renda acima de meio salário mínimo — rural"),
            ("percentual_familias_pobreza_baixa_renda_rural", "Percentual de famílias rurais em pobreza ou baixa renda"),
            ("qtde_familias_lixo_coleta_diretamente", "Quantidade de famílias com coleta direta"),
            ("qtde_familias_lixo_coleta_indiretamente", "Quantidade de famílias com coleta indireta"),
            ("qtde_familias_lixo_queimado_enterrado", "Quantidade de famílias com lixo queimado ou enterrado"),
            ("qtde_familias_lixo_terreno_baldio_logradouro", "Quantidade de famílias com lixo em terreno baldio ou logradouro"),
            ("qtde_familias_lixo_riolagomar", "Quantidade de famílias com lixo em rio, lago ou mar"),
            ("qtde_familias_lixo_outras", "Quantidade de famílias com outros destinos"),
            ("qtde_familias_lixo_sem_info", "Quantidade de famílias com sem informação"),
        ],
        "Carteira DSR": [
            ("qtde_instrumentos_dsr", "Quantidade de instrumentos DSR"),
        ],
    },
    "setor_censitario": {
        "Identificação do setor": [
            ("cod_setor", "Código do setor censitário"),
            ("cod_municipio", "Código do município"),
            ("nome_municipio", "Nome do município"),
            ("cod_uf", "Código da UF"),
            ("sigla_uf", "Sigla da UF"),
        ],
        "Território": [
            ("regiao", "Região"),
            ("semiarido_2022", "Semiárido 2022"),
            ("amazonia_legal", "Amazônia Legal"),
            ("vale_jequetinhonha", "Vale do Jequitinhonha"),
            ("area_km2", "Área em km²"),
        ],
        "Situação do setor": [
            ("cod_sit", "Código da situação"),
            ("situacao", "Situação"),
            ("situacao_detalhada", "Situação detalhada"),
            ("cod_tipo", "Código do tipo"),
            ("tipo", "Tipo"),
            ("com_pessoas", "Com pessoas"),
            ("todos_dados_omitidos", "Todos os dados omitidos"),
            ("com_dados", "Com dados"),
        ],
        "IBGE — População e domicílios": [
            ("total_pessoas", "Total de pessoas"),
            ("total_domicilios", "Total de domicílios"),
            ("total_domicilios_particulares", "Total de domicílios particulares"),
            ("total_domicilios_coletivos", "Total de domicílios coletivos"),
            ("total_domicilios_particulares_ocupados", "Total de domicílios particulares ocupados"),
            ("dppo_domicilios_particulares_permanentes_ocupados", "DPPO — domicílios particulares permanentes ocupados"),
            ("dpio_domicilios_particulares_improvisados_ocupados", "DPIO — domicílios particulares improvisados ocupados"),
            ("dccm_domicilios_coletivos_com_morador", "DCCM — domicílios coletivos com morador"),
            ("moradores_dppo", "Moradores em DPPO"),
            ("moradores_dpio", "Moradores em DPIO"),
            ("moradores_dccm", "Moradores em DCCM"),
        ],
        "IBGE — Água": [
            ("dppo_agua_rede", "DPPO com abastecimento de água por rede geral"),
            ("dppo_agua_poco_prof", "DPPO com abastecimento de água por poço profundo"),
            ("dppo_agua_poco_raso", "DPPO com abastecimento de água por poço raso"),
            ("dppo_agua_nascente", "DPPO com abastecimento de água por nascente"),
            ("dppo_agua_pipa", "DPPO com abastecimento de água por carro-pipa"),
            ("dppo_agua_chuva", "DPPO com abastecimento de água por água da chuva"),
            ("dppo_agua_rio_acude", "DPPO com abastecimento de água por rio ou açude"),
            ("dppo_agua_outra", "DPPO com abastecimento de água por outra forma"),
            ("perc_agua_forma_adequada", "Percentual com forma adequada de abastecimento de água"),
            ("perc_agua_forma_nao_adequada", "Percentual com forma não adequada de abastecimento de água"),
            ("dppo_agua_encanada_interna", "DPPO com abastecimento de água por água encanada dentro do domicílio"),
            ("dppo_agua_encanada_terreno", "DPPO com abastecimento de água por água encanada no terreno"),
            ("dppo_agua_nao_chega_encanada", "DPPO com abastecimento de água por água não chega encanada"),
            ("dppo_agua_rede_mas_utiliza_outra_forma", "DPPO com abastecimento de água por ligado à rede, mas utiliza outra forma"),
            ("dppo_agua_sem_ligacao_rede", "DPPO com abastecimento de água por sem ligação à rede"),
        ],
        "IBGE — Esgoto": [
            ("dppo_esgoto_rede", "DPPO com esgotamento sanitário por rede geral"),
            ("dppo_esgoto_fossa_septica_lig_rede", "DPPO com esgotamento sanitário por fossa séptica ligada à rede"),
            ("dppo_esgoto_fossa_septica_nao_lig_rede", "DPPO com esgotamento sanitário por fossa séptica não ligada à rede"),
            ("dppo_esgoto_fossa_rudimentar", "DPPO com esgotamento sanitário por fossa rudimentar"),
            ("dppo_esgoto_vala", "DPPO com esgotamento sanitário por vala"),
            ("dppo_esgoto_rio_lago_mar", "DPPO com esgotamento sanitário por rio, lago ou mar"),
            ("dppo_esgoto_outra_forma", "DPPO com esgotamento sanitário por outra forma"),
            ("dppo_esgoto_sem_ban_nem_sanit", "DPPO com esgotamento sanitário por sem banheiro nem sanitário"),
            ("perc_esgoto_tipo_adequado", "Percentual com tipo adequado de esgotamento sanitário"),
            ("perc_esgoto_tipo_nao_adequado", "Percentual com tipo não adequado de esgotamento sanitário"),
        ],
        "IBGE — Resíduos sólidos": [
            ("dppo_lixo_coletado_domicilio", "DPPO com lixo coletado no domicílio"),
            ("dppo_lixo_depositado_cacamba", "DPPO com lixo depositado em caçamba"),
            ("dppo_lixo_queimado", "DPPO com lixo queimado"),
            ("dppo_lixo_enterrado", "DPPO com lixo enterrado"),
            ("dppo_lixo_jogado_terreno_encosta", "DPPO com lixo jogado em terreno ou encosta"),
            ("dppo_lixo_outro_destino", "DPPO com outro destino do lixo"),
            ("perc_lixo_destino_adequado", "Percentual com destino adequado do lixo"),
            ("perc_lixo_destino_nao_adequado", "Percentual com destino não adequado do lixo"),
        ],
        "IBGE — Banheiro e instalações sanitárias": [
            ("dppo_ban_1_exclus", "DPPO com 1 banheiro de uso exclusivo"),
            ("dppo_ban_2_exclus", "DPPO com 2 banheiros de uso exclusivo"),
            ("dppo_ban_3_exclus", "DPPO com 3 banheiros de uso exclusivo"),
            ("dppo_ban_4_mais_exclus", "DPPO com 4 ou mais banheiros de uso exclusivo"),
            ("dppo_ban_uso_comum", "DPPO com banheiro de uso comum"),
            ("dppo_ban_sanit_buraco", "DPPO com sanitário ou buraco para dejeções"),
            ("dppo_ban_sem_ban_nem_sanit", "DPPO sem banheiro nem sanitário"),
            ("dppo_ban_com_ban_exclusivo", "DPPO com banheiro de uso exclusivo"),
            ("dppo_ban_sem_ban_exclusivo", "DPPO sem banheiro de uso exclusivo"),
            ("perc_ban_com_ban_exclusivo", "Percentual com banheiro de uso exclusivo"),
            ("perc_ban_sem_ban_exclusivo", "Percentual sem banheiro de uso exclusivo"),
        ],
        "IBGE — Demografia": [
            ("demografia_qtde_moradores", "Quantidade de moradores"),
            ("demografia_masculino", "População masculina"),
            ("demografia_femenino", "População feminina"),
            ("demografia_0_4_anos", "População de 0 a 4 anos"),
            ("demografia_5_9_anos", "População de 5 a 9 anos"),
            ("demografia_10_14_anos", "População de 10 a 14 anos"),
            ("demografia_15_19_anos", "População de 15 a 19 anos"),
            ("demografia_20_24_anos", "População de 20 a 24 anos"),
            ("demografia_25_29_anos", "População de 25 a 29 anos"),
            ("demografia_30_39_anos", "População de 30 a 39 anos"),
            ("demografia_40_49_anos", "População de 40 a 49 anos"),
            ("demografia_50_59_anos", "População de 50 a 59 anos"),
            ("demografia_60_69_anos", "População de 60 a 69 anos"),
            ("demografia_70_mais_anos", "População de 70 anos ou mais"),
        ],
        "Coordenadas": [
            ("longitude", "Longitude"),
            ("latitude", "Latitude"),
        ],
    },
    "instrumento": {
        "Identificação do instrumento": [
            ("nr_instrumento", "Número do instrumento"),
            ("nr_proposta", "Número da proposta"),
            ("operacao", "Operação"),
            ("nr_proposta_selecao_pac", "Número da proposta na seleção PAC"),
            ("nr_reservado", "Número reservado"),
            ("ano_proposta", "Ano da proposta"),
            ("tipo_instrumento", "Tipo de instrumento"),
            ("objeto", "Objeto"),
            ("categoria", "Categoria"),
        ],
        "Proponente": [
            ("nome_proponente", "Nome do proponente"),
        ],
        "Território": [
            ("uf", "UF"),
            ("qtde_municipios", "Quantidade de municípios"),
            ("municipios_beneficiados", "Municípios beneficiados"),
            ("qtde_comunidades_rurais_beneficiadas", "Quantidade de comunidades rurais beneficiadas"),
            ("comunidades_rurais_beneficiadas", "Comunidades rurais beneficiadas"),
            ("qtde_familias_beneficiadas", "Quantidade de famílias beneficiadas"),
        ],
        "SINISA — Prestadores de serviço": [
            ("prestador_agua_sinisa", "Prestador de água — SINISA"),
            ("prestador_esgoto_sinisa", "Prestador de esgoto — SINISA"),
        ],
        "Carteira DSR": [
            ("novo_pac", "Novo PAC"),
            ("acao_orcamentaria", "Ação orçamentária"),
            ("componente", "Componente"),
            ("acao_padronizada", "Ação padronizada"),
            ("carteira_ativa", "Carteira ativa"),
            ("coordenacao", "Coordenação"),
        ],
        "Valores financeiros": [
            ("valor_global", "Valor global"),
            ("valor_repasse", "Valor de repasse"),
            ("valor_contrapartida", "Valor de contrapartida"),
            ("valor_empenhado", "Valor empenhado"),
            ("valor_a_empenhar", "Valor a empenhar"),
            ("valor_desembolsado", "Valor desembolsado"),
            ("valor_empenhado_a_desembolsar", "Valor empenhado a desembolsar"),
            ("valor_a_desembolsar", "Valor a desembolsar"),
            ("qtde_parcelas", "Quantidade de parcelas"),
            ("parcela_1", "Parcela 1"),
            ("parcela_2", "Parcela 2"),
            ("parcela_3", "Parcela 3"),
            ("parcela_4", "Parcela 4"),
            ("parcela_5", "Parcela 5"),
            ("parcela_6", "Parcela 6"),
            ("parcela_7", "Parcela 7"),
            ("ultima_parcela_paga", "Última parcela paga"),
            ("proxima_parcela_a_pagar", "Próxima parcela a pagar"),
            ("valor_a_pagar_proxima_parcela", "Valor a pagar na próxima parcela"),
            ("saldo_empenho", "Saldo de empenho"),
            ("necessidade_empenho_proxima_parcela", "Necessidade de empenho da próxima parcela"),
        ],
        "Datas e prazos": [
            ("dia_assin_conv", "Data de assinatura do convênio"),
            ("dia_inic_vigenc_conv", "Data de início da vigência do convênio"),
            ("dia_fim_vigenc_conv", "Data de fim da vigência do convênio"),
            ("dias_termino_vigencia", "Dias para término da vigência"),
            ("termino_vigencia", "Término da vigência"),
        ],
        "Situação e fase": [
            ("status", "Status"),
            ("nivel", "Nível"),
            ("situacao_contratacao", "Situação da contratação"),
            ("liminar_judicial", "Liminar judicial"),
            ("situacao_atual", "Situação atual"),
            ("fase_instrumento", "Fase do instrumento"),
        ],
        "Suspensivas e paralisação": [
            ("motivo_suspensao", "Motivo da suspensão"),
            ("data_suspensiva", "Data da suspensiva"),
            ("dias_prazo_suspensiva", "Dias de prazo da suspensiva"),
            ("prazo_suspensiva", "Prazo da suspensiva"),
            ("suspensiva_projeto", "Suspensiva de projeto"),
            ("suspensiva_licenca_ambiental", "Suspensiva de licença ambiental"),
            ("suspensiva_sustentabilidade", "Suspensiva de sustentabilidade"),
            ("suspensiva_trabalho_social", "Suspensiva de trabalho social"),
            ("suspensiva_titularidade_area", "Suspensiva de titularidade da área"),
            ("suspensiva_termo_referencia", "Suspensiva de termo de referência"),
            ("suspensiva_artigo_50", "Suspensiva do artigo 50"),
            ("suspensiva_outra", "Outra suspensiva"),
            ("data_retirada_suspensiva", "Data de retirada da suspensiva"),
            ("data_condicao_suspensiva", "Data da condição suspensiva"),
            ("paralisada", "Paralisada"),
            ("principal_motivo_paralisacao", "Principal motivo da paralisação"),
            ("detalhamento_motivo_paralisacao", "Detalhamento do motivo da paralisação"),
            ("descricao_motivo_paralisacao", "Descrição do motivo da paralisação"),
            ("data_paralisacao", "Data da paralisação"),
            ("dias_sem_evolucao", "Dias sem evolução"),
            ("classificacao_tempo", "Classificação de tempo"),
        ],
        "Projeto e licitação": [
            ("situacao_projeto", "Situação do projeto"),
            ("data_primeiro_envio_projeto", "Data do primeiro envio do projeto"),
            ("data_ultima_versao_lae", "Data da última versão LAE"),
            ("situacao_ultima_versao_lae", "Situação da última versão LAE"),
            ("data_aceite_projeto", "Data de aceite do projeto"),
            ("qtde_licitacoes_maior_10_porc", "Quantidade de licitações maiores que 10%"),
            ("qtde_licitacoes_maior_10_porc_enviada", "Quantidade de licitações maiores que 10% enviadas"),
            ("data_primeira_publicacao_licitacao", "Data da primeira publicação da licitação"),
            ("qtde_licitacoes_sem_aceite_15", "Quantidade de licitações sem aceite há 15 dias"),
            ("qtde_licitacoes_sem_aceite_30", "Quantidade de licitações sem aceite há 30 dias"),
            ("data_primeiro_aceite_vrpl", "Data do primeiro aceite VRPL"),
            ("qtde_licitacoes_sem_contrato_15", "Quantidade de licitações sem contrato há 15 dias"),
            ("qtde_licitacoes_sem_contrato_30", "Quantidade de licitações sem contrato há 30 dias"),
        ],
        "Obra e execução": [
            ("data_solicitacao_aio", "Data de solicitação da AIO"),
            ("data_atendimento_equipe_aio", "Data de atendimento da equipe AIO"),
            ("data_atendimento_executiva_aio", "Data de atendimento da executiva AIO"),
            ("data_saida_processo_aio", "Data de saída do processo AIO"),
            ("possui_aio", "Possui AIO"),
            ("primeira_data_emissao_aio", "Primeira data de emissão da AIO"),
            ("data_inicio_obra", "Data de início da obra"),
            ("previsao_duracao_obra", "Previsão de duração da obra"),
            ("data_fim_periodo_ultima_medicao", "Data de fim do período da última medição"),
            ("qtde_dias_sem_medicao", "Quantidade de dias sem medição"),
            ("situacao_contrato", "Situação do contrato"),
            ("situacao_obra", "Situação da obra"),
            ("percentual_fisico_informado", "Percentual físico informado"),
            ("percentual_fisico_aferido", "Percentual físico aferido"),
            ("data_termino_obra", "Data de término da obra"),
        ],
        "Pagamentos e desbloqueios": [
            ("data_primeiro_pagamento", "Data do primeiro pagamento"),
            ("data_ultimo_pagamento", "Data do último pagamento"),
            ("valor_pago", "Valor pago"),
            ("percentual_financeiro_desbloqueado", "Percentual financeiro desbloqueado"),
            ("valor_desbloqueado", "Valor desbloqueado"),
            ("data_ultimo_bm", "Data do último BM"),
            ("data_ultima_vistoria", "Data da última vistoria"),
            ("data_ultimo_desbloqueio", "Data do último desbloqueio"),
            ("data_ultima_obtv", "Data da última OBTV"),
        ],
        "Links e atualização": [
            ("link_transferegov", "Link do Transferegov"),
        ],
        "Dados de atualização": [
            ("data_dados_transferegov", "Data dos dados do Transferegov"),
            ("data_dados_caixa", "Data dos dados da Caixa"),
        ],
    },
}


CAMPOS_REAIS = {
    tipo_tabela: [
        coluna
        for campos_grupo in grupos.values()
        for coluna, _ in campos_grupo
    ] + sorted(CAMPOS_IGNORADOS[tipo_tabela])
    for tipo_tabela, grupos in CAMPOS_CATALOGADOS.items()
}


def _tipo_dado(column: str) -> tuple[str, str]:
    if column.startswith("data_") or column.startswith("dia_") or column in {
        "termino_vigencia",
        "referencia",
    }:
        return "date", "date"

    if column.startswith("valor_") or column in {
        "saldo_empenho",
        "necessidade_empenho_proxima_parcela",
    }:
        return "currency", "brl"

    if column.startswith("perc_") or column.startswith("percentual_") or column.startswith("deficit_"):
        return "percent", "percent"

    if (
        column.startswith("cod_")
        or column.startswith("qtde_")
        or column.startswith("dias_")
        or column.startswith("ranking_")
        or column.startswith("total_")
        or column.startswith("domicilios")
        or column.startswith("dppo")
        or column.startswith("dpio")
        or column.startswith("dccm")
        or column.startswith("moradores")
        or column.startswith("demografia")
        or column.startswith("populacao")
        or column.startswith("snis_populacao")
        or column.startswith("sinisa_populacao")
        or column.startswith("sinisa_domicilios")
    ):
        return "integer", "integer"

    if column.startswith("latitude") or column.startswith("longitude") or column == "area_km2":
        return "decimal", "decimal"

    if column in {
        "semiarido_2022",
        "amazonia_legal",
        "vale_jequetinhonha",
        "rm_prioritaria",
        "elegivel_pac_rural_2025",
        "com_pessoas",
        "todos_dados_omitidos",
        "com_dados",
        "populacao_total_censo_2022_maior_50000",
    }:
        return "boolean", "boolean"

    return "text", "text"

def _papel_semantico(column: str, tipo_dado: str) -> str:
    if column.startswith(("cod_", "nr_", "ano_")):
        return "dimensao"

    if tipo_dado in {"currency", "percent", "decimal", "integer"}:
        return "metrica"

    return "dimensao"

def montar_catalogo() -> list[dict]:
    catalogo: list[dict] = []

    for tipo_tabela, grupos in CAMPOS_CATALOGADOS.items():
        view = TIPOS_TABELA[tipo_tabela]["view"]

        for grupo, campos in grupos.items():
            for column, label in campos:
                tipo_dado, formato = _tipo_dado(column)
                papel_semantico = _papel_semantico(column, tipo_dado)

                catalogo.append(
                    {
                        "id": f"{tipo_tabela}.{column}",
                        "label": label,
                        "view": view,
                        "column": column,
                        "tipo_tabela": tipo_tabela,
                        "grupo": grupo,
                        "papel_semantico": papel_semantico,
                        "tipo_dado": tipo_dado,
                        "formato": formato,
                        "visivel": True,
                        "exportavel": True,
                        "padrao": column in CAMPOS_PADRAO[tipo_tabela],
                        "descricao": "",
                    }
                )

    return catalogo


FIELD_CATALOG = montar_catalogo()
FIELD_BY_ID = {field["id"]: field for field in FIELD_CATALOG}


def listar_campos(tipo_tabela: str) -> list[dict]:
    return [
        field
        for field in FIELD_CATALOG
        if field["tipo_tabela"] == tipo_tabela
    ]


def obter_campo(field_id: str) -> dict | None:
    return FIELD_BY_ID.get(field_id)