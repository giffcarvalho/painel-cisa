



export const textosExplicativos = {
  'Vencimento Suspensivas': {
    titulo: 'Vencimento das Cláusulas Suspensivas',
    objetivo:
      'Monitorar o prazo para apresentação da documentação necessária à superação da Cláusula Suspensiva, acompanhando os instrumentos enquanto permanecerem nessa situação até a retirada da cláusula.',
    gatilhos: {
      inicia: 'data_suspensiva',
      finaliza: 'data_retirada_suspensiva',
    },
    regraGeral:
      'Para Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC, o controle monitora a proximidade do vencimento da Cláusula Suspensiva, considerando como marco a data limite definida para sua superação. O alerta é acionado quando o instrumento entra nos 60 dias anteriores ao vencimento da cláusula, não sendo contabilizado o prazo de 30 dias de análise pela Mandatária. O controle permanece ativo enquanto a situação do instrumento indicar Cláusula Suspensiva e é encerrado quando houver a retirada formal da cláusula.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou a situação da contratação não indicar Cláusula Suspensiva; ou a etapa estiver encerrada com a retirada da cláusula suspensiva registrada.',
      OK:
        'Quando o controle estiver ativo e faltarem mais de 60 dias para o vencimento da Cláusula Suspensiva.',
      Alerta:
        'Quando o controle estiver ativo e o instrumento estiver a 60 dias ou menos do vencimento da Cláusula Suspensiva, incluindo o próprio dia do vencimento.',
      Vencido:
        'Quando o controle estiver ativo e o prazo para superação da Cláusula Suspensiva tiver sido ultrapassado, sem retirada da cláusula.',
    },
  },

  'Emissão LAE': {
    titulo: 'Emissão da LAE',
    objetivo:
      'Monitorar o prazo para emissão da LAE pela mandatária, acompanhando os instrumentos enquanto o projeto permanecer em fluxo de análise, até a aprovação/homologação do projeto.',
    gatilhos: {
      inicia: 'data_primeiro_envio_projeto',
      finaliza: 'data_aceite_projeto',
    },
    regraGeral:
      '• Termo de Compromisso – Novo PAC (2024): aplica-se prazo fixo para emissão da LAE até 29/04/2026.\n• Termo de Compromisso – Novo PAC (a partir de 2025): o prazo é contado a partir da apresentação do projeto, com marcos de 30 + 30 dias (total de 60 dias).\n• Contrato de Repasse – Não PAC: o prazo é contado a partir da apresentação do projeto, com marcos de 90 + 30 dias (total de 120 dias).',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para contagem do prazo; ou o projeto não estiver em fluxo de análise; ou a etapa estiver encerrada com a aprovação/homologação do projeto ou com o aceite formal registrado.',
      OK:
        '• Termo de Compromisso – Novo PAC (2024): quando a data atual for anterior a 30/03/2026.\n• Termo de Compromisso – Novo PAC (a partir de 2025): quando o prazo transcorrido desde a apresentação do projeto for de até 30 dias.\n• Contrato de Repasse – Não PAC: quando o prazo transcorrido desde a apresentação do projeto for de até 90 dias.',
      Alerta:
        '• Termo de Compromisso – Novo PAC (2024): quando a data atual estiver entre 30/03/2026 e 29/04/2026.\n• Termo de Compromisso – Novo PAC (a partir de 2025): quando o prazo transcorrido desde a apresentação do projeto estiver entre 31 e 60 dias.\n• Contrato de Repasse – Não PAC: quando o prazo transcorrido desde a apresentação do projeto estiver entre 91 e 120 dias.',
      Vencido:
        '• Termo de Compromisso – Novo PAC (2024): quando a data atual for posterior a 29/04/2026.\n• Termo de Compromisso – Novo PAC (a partir de 2025): quando o prazo transcorrido desde a apresentação do projeto ultrapassar 60 dias.\n• Contrato de Repasse – Não PAC: quando o prazo transcorrido desde a apresentação do projeto ultrapassar 120 dias.',
    },
  },

  'Início Processo Licitatório': {
    titulo: 'Início do Processo Licitatório',
    objetivo:
      'Monitorar o prazo para o recebedor iniciar o processo de licitação após a emissão/aceite do projeto (LAE), encerrando o controle quando houver registro do início da licitação.',
    gatilhos: {
      inicia: 'data_aceite_projeto',
      finaliza: 'data_primeira_publicacao_licitacao',
    },
    regraGeral:
      'Para Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC, o prazo para início do processo licitatório é de 60 dias, contados a partir do aceite do projeto (emissão da LAE). O controle é executado somente enquanto o projeto estiver com situação compatível com início de licitação e é encerrado quando houver o registro da primeira publicação da licitação.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para contagem do prazo; ou o projeto não estiver com situação compatível com início do processo licitatório; ou a etapa estiver encerrada com o registro da primeira publicação da licitação.',
      OK:
        'Quando o controle estiver ativo e o prazo transcorrido desde o aceite do projeto for de até 30 dias.',
      Alerta:
        'Quando o controle estiver ativo e o prazo transcorrido desde o aceite do projeto estiver entre 31 e 60 dias.',
      Vencido:
        'Quando o controle estiver ativo e o prazo transcorrido desde o aceite do projeto ultrapassar 60 dias, sem registro da primeira publicação da licitação.',
    },
  },

  'Conclusão Processo Licitatório': {
    titulo: 'Conclusão do Processo Licitatório',
    objetivo:
      'Monitorar o prazo para o recebedor concluir e registrar o processo licitatório, identificando situações em que não houve registro de licitação relevante dentro do prazo previsto após a emissão/aceite do projeto (LAE).',
    gatilhos: {
      inicia: 'data_aceite_projeto',
      finaliza: 'qtde_licitacoes_maior_10_porc',
    },
    regraGeral:
      '• Termo de Compromisso – Novo PAC (assinados a partir de 2025) e Contrato de Repasse – Não PAC: o prazo padrão para conclusão do processo licitatório é de 120 dias, contados a partir do aceite do projeto (emissão da LAE).\n• Termo de Compromisso – Novo PAC (assinados até 2024): aplica-se prazo fixo para conclusão do processo licitatório até 17/07/2026.\n• O controle é executado somente quando houver aceite do projeto e permanece ativo enquanto não houver registro de licitação superior a 10% do valor previsto.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para contagem do prazo (ex.: ausência de aceite do projeto); ou a etapa estiver encerrada com registro de licitação superior a 10% do valor previsto.',
      OK:
        '• TC/PAC 2024: quando a data atual for anterior a 17/06/2026.\n• Instrumentos assinados após 2024 (TC a partir de 2025 e Contrato de Repasse): quando o prazo transcorrido desde o aceite do projeto for de até 60 dias.',
      Alerta:
        '• TC/PAC 2024: quando a data atual estiver entre 17/06/2026 e 17/07/2026.\n• Instrumentos assinados após 2024 (TC a partir de 2025 e Contrato de Repasse): quando o prazo transcorrido desde o aceite do projeto estiver entre 61 e 120 dias.',
      Vencido:
        '• TC/PAC 2024: quando a data atual for posterior a 17/07/2026.\n• Instrumentos assinados após 2024 (TC a partir de 2025 e Contrato de Repasse): quando o prazo transcorrido desde o aceite do projeto ultrapassar 120 dias, sem registro de licitação relevante.',
    },
  },

  'VRPL': {
    titulo: 'VRPL',
    objetivo:
      'Monitorar pendências de análise e aceite do resultado do processo licitatório (VRPL) pela mandatária após o envio da licitação para análise no TransfereGov, identificando atrasos relevantes com base em indicadores de tempo sem aceite.',
    gatilhos: {
      inicia:
        'tde_licitacoes_sem_aceite_15, qtde_licitacoes_sem_aceite_30',
      finaliza:
        'qtde_licitacoes_sem_aceite_15, qtde_licitacoes_sem_aceite_30',
    },

    regraGeral:
      'Para Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC, o controle é apurado com base em contadores que indicam licitações enviadas para análise e ainda sem aceite pela mandatária, sinalizando pendências acima de 15 dias e 30 dias, contados a partir do envio da licitação. O controle permanece ativo enquanto houver pendência de aceite registrada e é encerrado quando não houver mais licitações pendentes.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para avaliação (ambos os contadores qtde_licitacoes_sem_aceite_15 e qtde_licitacoes_sem_aceite_30 ausentes).',
      OK:
        'Quando o controle estiver ativo e não houver pendências de aceite do resultado do processo licitatório, indicando que todas as licitações enviadas foram analisadas dentro do prazo.',
      Alerta:
        'Quando o controle estiver ativo e houver pendência de aceite superior a 15 dias, sem caracterizar pendência acima de 30 dias.',
      Vencido:
        'Quando o controle estiver ativo e houver pendência de aceite superior a 30 dias no resultado do processo licitatório.',
    },
  },

  'Contratação': {
    titulo: 'Contratação',
    objetivo:
      'Monitorar pendências de registro de contrato da licitação no TransfereGov após a análise do aceite, com base nos contadores de licitações sem contrato.',
    gatilhos: {
      inicia:
        'qtde_licitacoes_sem_contrato_15, qtde_licitacoes_sem_contrato_30',
      finaliza:
        'qtde_licitacoes_sem_contrato_15, qtde_licitacoes_sem_contrato_30',
    },
    regraGeral:
      '• Termo de Compromisso – Novo PAC: o prazo para registro do contrato é monitorado por contadores que indicam pendências acima de 15 dias e 30 dias após a análise do aceite da licitação.\n• Contrato de Repasse – Não PAC: o prazo para registro do contrato é de 15 dias após a análise do aceite da licitação, sendo monitorado exclusivamente pelo indicador de pendência superior a 15 dias.\n• O controle permanece ativo enquanto existirem pendências de contratação e é encerrado quando não houver licitações pendentes de contrato.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para avaliação (contadores de licitações sem contrato ausentes).',
      OK:
        '• Termo de Compromisso – Novo PAC: quando o controle estiver ativo e não houver pendências de contratação registradas.\n• Contrato de Repasse – Não PAC: quando o controle estiver ativo e não houver pendência de contratação superior a 15 dias.',
      Alerta:
        '• Termo de Compromisso – Novo PAC: quando o controle estiver ativo e houver pendência de contratação superior a 15 dias, sem caracterizar pendência acima de 30 dias.\n• Contrato de Repasse – Não PAC: não aplicável.',
      Vencido:
        '• Termo de Compromisso – Novo PAC: quando o controle estiver ativo e houver pendência de contratação superior a 30 dias.\n• Contrato de Repasse – Não PAC: quando o controle estiver ativo e houver pendência de contratação superior a 15 dias.',
    },
  },

  'Solicitação AIO': {
    titulo: 'Solicitação AIO',
    objetivo:
      'Monitorar o prazo para a mandatária solicitar a AIO ao MCID, contado a partir do primeiro aceite do VRPL, encerrando quando houver emissão/registro da AIO.',
    gatilhos: {
      inicia: 'data_primeiro_aceite_vrpl',
      finaliza: 'primeira_data_emissao_aio',
    },
    regraGeral:
      'Para TC/PAC, o prazo para solicitação de AIO é de 30 dias após o primeiro aceite do VRPL (marco inicial). O controle é executado somente enquanto não houver registro de emissão da AIO e enquanto o instrumento estiver enquadrado no rito aplicável.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.\n• Contrato de Repasse – Não PAC: o controle não se aplica.\n• TC/PAC em rito simplificado: o controle não se aplica.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou se tratar de Contrato de Repasse – Não PAC; ou o instrumento estiver enquadrado em rito simplificado; ou não houver dados mínimos para contagem do prazo; ou a etapa estiver encerrada com a emissão da AIO registrada.',
      OK:
        'Quando o controle estiver ativo e o prazo transcorrido desde o aceite do VRPL for de até 15 dias.',
      Alerta:
        'Quando o controle estiver ativo e o prazo transcorrido desde o aceite do VRPL estiver entre 16 e 30 dias.',
      Vencido:
        'Quando o controle estiver ativo e o prazo transcorrido desde o aceite do VRPL ultrapassar 30 dias, sem registro da solicitação da AIO.',
    },
  },

  'Análise técnica AIO': {
    titulo: 'Análise técnica da AIO',
    objetivo:
      'Monitorar o prazo para a equipe técnica do DSR emitir/registrar a análise técnica (NT) da solicitação de AIO, contado a partir do recebimento da solicitação, encerrando quando houver atendimento registrado.',
    gatilhos: {
      inicia: 'data_solicitacao_aio',
      finaliza: 'data_atendimento_equipe_aio',
    },
    regraGeral:
      'Para TC/PAC, o prazo para análise técnica da solicitação de AIO é de 3 dias após o recebimento (marco inicial). O controle é executado enquanto não houver registro de atendimento técnico ou executivo e permanece ativo apenas para instrumentos enquadrados no rito aplicável.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.\n• Contrato de Repasse – Não PAC: o controle não se aplica.\n• TC/PAC em rito simplificado: o controle não se aplica.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou se tratar de Contrato de Repasse – Não PAC; ou o instrumento estiver enquadrado em rito simplificado; ou não houver dados mínimos para contagem do prazo; ou a etapa estiver encerrada com registro de atendimento técnico ou executivo.',
      OK:
        'Quando o controle estiver ativo e o prazo transcorrido desde o recebimento da solicitação de AIO for de até 2 dias.',
      Alerta:
        'Quando o controle estiver ativo e o prazo transcorrido desde o recebimento da solicitação de AIO estiver no 3º dia.',
      Vencido:
        'Quando o controle estiver ativo e o prazo para análise técnica da solicitação de AIO ultrapassar 3 dias sem registro de atendimento.',
    },
  },

  'Análise GAB/SE AIO': {
    titulo: 'Análise de Emissão de AIO pelo GAB/SE',
    objetivo:
      'Monitorar o prazo a emissão do ofício do GAB/SE aprovando a AIO, garantindo aderência ao rito de tramitação após a emissão da Nota Técnica (NT) pela área técnica.',
    gatilhos: {
      inicia: 'data_atendimento_equipe_aio',
      finaliza: 'data_atendimento_executiva_aio',
    },
    regraGeral:
      'Para TC/PAC, o prazo do GAB/SE para emissão do ofício de aprovação da AIO é de 30 dias corridos contados a partir da emissão da NT pela área técnica (marco inicial). O controle é executado somente após a conclusão da análise técnica e permanece ativo enquanto não houver manifestação executiva registrada.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.\n• Contrato de Repasse – Não PAC: o controle não se aplica.\n• TC/PAC em rito simplificado: o controle não se aplica.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou se tratar de Contrato de Repasse – Não PAC; ou o instrumento estiver enquadrado em rito simplificado; ou não houver dados mínimos para contagem do prazo; ou a etapa estiver encerrada com o registro de manifestação executiva.',
      OK:
        'Quando o controle estiver ativo e o prazo transcorrido desde a conclusão da análise técnica for de até 15 dias.',
      Alerta:
        'Quando o controle estiver ativo e o prazo transcorrido desde a conclusão da análise técnica estiver entre 16 e 30 dias.',
      Vencido:
        'Quando o controle estiver ativo e o prazo para a análise executiva da AIO ultrapassar 30 dias, sem registro de manifestação do GAB.',
    },
  },

  'Registro AIO': {
    titulo: 'Registro da AIO no TransfereGov',
    objetivo:
      'Monitorar o prazo para a mandatária (CAIXA) registrar a AIO no TransfereGov, garantindo aderência ao rito após a emissão do ofício do MCID/GAB/SE e após o envio da AIO para a mandatária.',
    gatilhos: {
      inicia: 'data_saida_processo_aio e data_primeiro_aceite_vrpl',
      finaliza: 'possui_aio',
    },
    regraGeral:
      '• Termo de Compromisso – Novo PAC: o prazo para registro da AIO é de 5 dias, contados a partir da data de envio da AIO para a mandatária.\n• Contrato de Repasse – Não PAC e Simplificados: o prazo para registro da AIO é de 30 dias, contados a partir do primeiro aceite do VRPL.\n• O controle permanece ativo enquanto não houver registro da AIO.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou se tratar de instrumento em rito simplificado; ou não houver dados mínimos para contagem do prazo; ou a etapa estiver encerrada com o registro da AIO.',
      OK:
        '• Termo de Compromisso – Novo PAC: quando o prazo transcorrido desde o envio da AIO para a mandatária for de até 3 dias.\n• Contrato de Repasse – Não PAC e Simplificados: quando o prazo transcorrido desde o primeiro aceite do VRPL for de até 15 dias.',
      Alerta:
        '• Termo de Compromisso – Novo PAC: quando o prazo transcorrido desde o envio da AIO para a mandatária estiver entre 4 e 5 dias.\n• Contrato de Repasse – Não PAC e Simplificados: quando o prazo transcorrido desde o primeiro aceite do VRPL estiver entre 16 e 30 dias.',
      Vencido:
        '• Termo de Compromisso – Novo PAC: quando o prazo para registro da AIO ultrapassar 5 dias sem que a AIO tenha sido registrada.\n• Contrato de Repasse – Não PAC e Simplificados: quando o prazo para registro da AIO ultrapassar 30 dias sem que a AIO tenha sido registrada.',
    },
  },

  'Emissão OS': {
    titulo: 'Emissão de Ordem de Serviço',
    objetivo:
      'Monitorar o prazo para o recebedor emitir e registrar a Ordem de Serviço (OS) no TransfereGov.',
    gatilhos: {
      inicia: 'não disponível automaticamente no momento',
      finaliza: 'não disponível automaticamente no momento',
    },
    regraGeral:
      'Em construção, pois não é possível extrair automaticamente os dados necessários para mensurar o prazo. Quando viabilizado, o prazo p/ o recebedor emitir e registrar a Ordem de Serviço no TransfereGov será de 10 dias úteis após o registro do AIO no TransfereGov (marco inicial).',
    excecao:
      'Não aplicável no momento, deixar para futuro.',
    criteriosStatus: {
      'Em construção':
        'Controle sendo analisado para momento futuro ou para exclusão.',
    },
  },

  'Início execução física': {
    titulo: 'Início da execução física',
    objetivo:
      'Monitorar o prazo para início da execução física da obra após o registro da AIO, identificando atrasos na efetiva mobilização da obra.',
    gatilhos: {
      inicia: 'primeira_data_emissao_aio',
      finaliza: 'data_inicio_obra',
    },
    regraGeral:
      'Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC, o prazo para início da execução física é de 60 dias, contados a partir do registro da AIO. O controle é executado enquanto não houver registro de início da obra e permanece ativo desde que a obra não esteja classificada como concluída ou cancelada.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para contagem do prazo; ou a etapa estiver encerrada com o registro do início da obra; ou a obra estiver classificada como cancelada ou concluída.',
      OK:
        'Quando o controle estiver ativo e o prazo transcorrido desde o registro da AIO for de até 30 dias, sem início da execução física.',
      Alerta:
        'Quando o controle estiver ativo e o prazo transcorrido desde o registro da AIO estiver entre 31 e 60 dias, sem início da execução física.',
      Vencido:
        'Quando o controle estiver ativo e o prazo para início da execução física ultrapassar 60 dias após o registro da AIO, sem registro de início da obra.',
      DefesoEleitoral:
        'Quando o controle estiver ativo, estiver dentro do período do Defeso Eleitoral (04/07/26 a 25/10/26) e a data de emissão da AIO for dentro do período do Defeso Eleitoral.',
    },
  },

  'Progresso físico': {
    titulo: 'Progresso Físico das Obras',
    objetivo:
      'Monitorar a compatibilidade do percentual de execução física das obras em relação ao percentual previsto para o período, identificando situações de desempenho físico abaixo do esperado.\n\nOBS: O percentual previsto usado na comparação é uma estimativa linear (proporcional aos dias decorridos vs. duração prevista, limitada a 100%), aplicada somente para referência comparativa com o percentual físico aferido e não pressupõe que a obra avance de forma uniforme ao longo do tempo.',
    gatilhos: {
      inicia: 'data_inicio_obra',
      finaliza: 'situacao_obra',
    },
    regraGeral:
      'Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC: o controle compara o percentual de execução física aferida com uma estimativa de avanço esperado em função do tempo decorrido desde o início da obra, considerando a duração prevista. Considera-se situação de não conformidade quando o percentual físico executado estiver inferior a 50% do percentual estimado para o período. O controle é executado somente após o início da obra, enquanto houver AIO registrada, e permanece ativo enquanto a obra estiver em execução regular.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      Atrasada:
        'Quando o tempo decorrido desde o início da obra for maior que a duração prevista e a obra não estiver cancelada nem concluída.',
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para avaliação; ou a obra ainda não tiver sido iniciada; ou a obra estiver classificada como concluída, cancelada ou paralisada; ou não houver boletim de medição registrado.',
      OK:
        'Quando o percentual físico executado for igual ou superior a 70% do percentual previsto para o período.',
      Alerta:
        'Quando o percentual físico executado estiver entre 50% e 70% do percentual previsto para o período.',
      Critico:
        'Quando o percentual físico executado for inferior a 50% do percentual previsto para o período.',
    },
  },

  'Indícios de paralisação': {
    titulo: 'Obras com indícios de paralisação',
    objetivo:
      'Monitorar o intervalo de tempo entre Boletins de Medição (BM), identificando indícios de paralisação quando houver ausência de BM por período prolongado.',
    gatilhos: {
      inicia: 'data_ultimo_bm',
      finaliza: 'data_ultimo_bm',
    },
    regraGeral:
      'Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC: considera-se indício de paralisação quando o intervalo desde o último Boletim de Medição ultrapassar 70 dias. O controle é executado apenas enquanto a obra estiver em execução regular e não estiver formalmente classificada como paralisada.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para contagem do prazo; ou a obra não estiver em execução; ou a obra estiver marcada como paralisada. Ou ainda quando o controle estiver ativo e o intervalo desde o último Boletim de Medição for de até 35 dias.',
      Alerta:
        'Quando o controle estiver ativo e o intervalo desde o último Boletim de Medição estiver entre 36 e 70 dias.',
      Vencido:
        'Quando o controle estiver ativo e o intervalo desde o último Boletim de Medição ultrapassar 70 dias, caracterizando indícios relevantes de paralisação da obra.',
    },
  },

  'Obras paralisadas': {
    titulo: 'Obras paralisadas',
    objetivo:
      'Monitorar a situação da obra classificada como paralisada, identificando instrumentos em que a execução física foi formalmente interrompida.',
    gatilhos: {
      inicia: 'primeira_data_emissao_aio',
      finaliza: 'paralisada',
    },
    regraGeral:
      'Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC: considera-se obra paralisada quando a situação da obra estiver classificada como paralisada, conforme registro oficial. O controle é executado somente após a emissão da AIO e permanece ativo enquanto houver indicação de paralisação.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para classificação da situação de paralisação; ou a etapa estiver encerrada. Ou ainda quando o controle estiver ativo e a obra não estiver classificada como paralisada.',
      Critico:
        'Quando o controle estiver ativo e a obra estiver classificada formalmente como paralisada.',
    },
  },

  'Vistorias parciais': {
    titulo: 'Vistorias in loco parciais',
    objetivo:
      'Monitorar os parâmetros para a mandatária (CAIXA) realizar vistoria in loco parcial.',
    gatilhos: {
      inicia:
        'Marcos de execução financeira / desbloqueios previstos para vistoria (não disponível automaticamente no momento)',
      finaliza:
        'Registro de vistoria in loco parcial (não disponível automaticamente no momento)',
    },
    regraGeral:
      'Em construção, pois não é possível fazer a verificação automática dos parâmetros estabelecidos. Quando viabilizado, os parâmetros serão:\n• Para Termo de Compromisso – Novo Pac: (i) para 5 a 30M: após os marcos de 25%, 50% e 75% da execução financeira; (ii) para 30 a 200M: a cada 10M de desbloqueio.\n• Para Contrato de Repasse – Não PAC: (i) 2 vistorias para Nível II, (ii) 4 vistorias para nível III, (iii) 7 vistorias para nível IV, (iv) 11 vistorias para Nível V.',
    excecao:
      'Não aplicável no momento, deixar para futuro.',
    criteriosStatus: {
      'Em construção':
        'Controle sendo analisado para momento futuro ou para exclusão.',
    },
  },

  'Vistoria final': {
    titulo: 'Vistoria in loco final',
    objetivo:
      'Monitorar o prazo para realização da vistoria final após a conclusão física da obra, assegurando que a verificação ocorra dentro do prazo estabelecido após a apresentação do último Boletim de Medição (BM).',
    gatilhos: {
      inicia: 'data_ultimo_bm e percentual_fisico_informado',
      finaliza:
        'data_ultima_vistoria e data_ultimo_bm e percentual_fisico_informado',
    },
    regraGeral:
      'Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC, o prazo para realização da vistoria final é de 60 dias, contados a partir da apresentação do último Boletim de Medição, desde que a obra esteja concluída (percentual físico igual ou superior a 100%). O controle é executado apenas quando a obra estiver em condição de conclusão e é encerrado quando a vistoria final for registrada.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para contagem do prazo; ou a obra ainda não estiver concluída; ou a etapa estiver encerrada com a vistoria final já registrada.',
      OK:
        'Quando o controle estiver ativo e o prazo transcorrido desde o último Boletim de Medição for de até 30 dias, sem registro da vistoria final.',
      Alerta:
        'Quando o controle estiver ativo e o prazo transcorrido desde o último Boletim de Medição estiver entre 31 e 60 dias, sem registro da vistoria final.',
      Vencido:
        'Quando o controle estiver ativo e o prazo para realização da vistoria final ultrapassar 60 dias após o último Boletim de Medição, sem registro da vistoria.',
    },
  },

  'Obras próximas conclusão': {
    titulo: 'Obras próximas da conclusão',
    objetivo:
      'Identificar obras que apresentem indícios de aproximação da conclusão, com base no percentual de execução física, de forma a subsidiar o acompanhamento preventivo das etapas finais da execução.',
    gatilhos: {
      inicia: 'percentual_fisico_aferido',
      finaliza: 'percentual_fisico_aferido',
    },
    regraGeral:
      'Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC, considera-se obra próxima da conclusão quando o percentual de execução física aferido for superior a 85% e inferior a 100%, desde que a obra esteja em andamento regular. O controle é utilizado exclusivamente como indicador de acompanhamento, não representando descumprimento de prazo nem irregularidade formal.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para avaliação; ou o percentual de execução física for igual ou inferior a 85%; ou o percentual for igual ou superior a 100%; ou a obra estiver concluída; ou a obra estiver paralisada.',
      Alerta:
        'Quando o controle estiver ativo e o percentual de execução física aferido estiver acima de 85% e abaixo de 100%, com a obra em execução regular.',
    },
  },

  'Registro conclusão': {
    titulo: 'Registro da conclusão da obra',
    objetivo:
      'Monitorar o prazo para que a conclusão da obra seja formalmente registrada após a apresentação do último Boletim de Medição, assegurando a tempestividade do encerramento administrativo da execução.',
    gatilhos: {
      inicia: 'data_ultimo_bm e percentual_fisico_aferido',
      finaliza: 'situacao_obra',
    },
    regraGeral:
      'Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC, o prazo para registro da conclusão da obra é de 60 dias, contados a partir da apresentação do último Boletim de Medição, desde que a obra tenha atingido 100% de execução física. O controle é executado apenas quando houver indicação de conclusão física e permanece ativo enquanto não houver o registro formal da conclusão da obra.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para contagem do prazo; ou a obra ainda não tiver atingido 100% de execução física; ou a obra estiver classificada como concluída ou cancelada.',
      OK:
        'Quando o controle estiver ativo e o prazo transcorrido desde a apresentação do último Boletim de Medição for de até 30 dias, sem registro formal da conclusão da obra.',
      Alerta:
        'Quando o controle estiver ativo e o prazo transcorrido desde a apresentação do último Boletim de Medição estiver entre 31 e 60 dias, sem registro formal da conclusão da obra.',
      Vencido:
        'Quando o controle estiver ativo e o prazo para registro da conclusão da obra ultrapassar 60 dias após a apresentação do último Boletim de Medição, sem atualização da situação da obra.',
    },
  },

  'Vigência': {
    titulo: 'Vigência',
    objetivo:
      'Monitorar instrumentos com vigência a expirar, identificando situações em que o término do convênio se aproxima ou já foi ultrapassado, de forma a apoiar a adoção de providências tempestivas.',
    gatilhos: {
      inicia: 'dia_fim_vigenc_conv',
      finaliza: 'dia_fim_vigenc_conv e situacao_contratacao',
    },
    regraGeral:
      'Termo de Compromisso – Novo PAC e Contrato de Repasse – Não PAC, considera-se situação de atenção quando o término da vigência do convênio estiver a 60 dias ou menos, contados a partir da data final de vigência. A situação de vencimento ocorre quando a data final de vigência já tiver sido ultrapassada. O controle é executado apenas enquanto o instrumento estiver vigente e não tiver sido formalmente encerrado.',
    excecao:
      'Não aplicável a instrumentos do tipo TED.',
    criteriosStatus: {
      '-':
        'Quando a carteira estiver inativa; ou o instrumento estiver fora do escopo do controle; ou não houver dados mínimos para avaliação; ou a situação do instrumento estiver classificada como Extinto ou Concluído.',
      OK:
        'Quando o controle estiver ativo e o término da vigência estiver a mais de 60 dias, contado a partir da data atual.',
      Alerta:
        'Quando o controle estiver ativo e o término da vigência estiver em até 60 dias, incluindo o dia do vencimento.',
      Vencido:
        'Quando o controle estiver ativo e o término da vigência já tiver ocorrido, caracterizando vigência expirada.',
    },
  },

  'Inconsistências': {
    titulo: 'Status de execução da obra',
    objetivo:
      'Monitorar a compatibilidade da classificação da situação da obra, identificando incoerências da classificação tendo como referência os boletins de medição anexados no TransfereGov.',
    gatilhos: {
      inicia: 'Em construção',
      finaliza: 'Em construção',
    },
    regraGeral:
      'Em construção.',
    excecao:
      'Não aplicável no momento, deixar para futuro.',
    criteriosStatus: {
      'Em construção':
        'Controle sendo analisado para momento futuro ou para ser trabalhado a parte.',
    },
  },
}



export const ajudaPergunta = {
  confirmacao: {
    titulo: "Confirmação do status do ponto de controle",
    explicacao: [
      'Responda "Sim" caso o status do Ponto de Controle, calculado automaticamente, esteja correto.',
      'Responda "Não" caso o status do Ponto de Controle não coincida com a situação encontrada ao analisar a condição do instrumento no Transferegov ou outras fontes.',
      'Caso responda "Não", a equipe que faz a manutenção do Painel estará visualizando esta informação e tentará aperfeiçoar o cálculo automático.',
    ]
  },
  coordenacao: {
    titulo: "Avaliação da Coordenação",
    explicacao: [
      'Responda "Sim" caso entenda que a situação deva ser analisada pela Coordenação ou Coordenação Geral.',
      'Os casos recomendados para serem submetidos à Coordenação são:',
      '• Análise técnica AIO e Análise GAB/SE AIO\n• Vencimento de Cláusula Suspensiva\n• Indícios de paralisação de obra\n• Reincidência de prazos vencidos em obras em andamento\n• Ausência reiterada de respostas\n• Necessidade de Termos Aditivos ou Apostilamentos\n• Indícios de irregularidade\n• Início de execução física, Vistoria final, Vigência do instrumento e Registro de conclusão do instrumento com status "Vencido".'
    ]
  },
  mandataria: {
    titulo: "Contato com a Mandatária",
    explicacao: [
      "Indique se houve algum tipo de interlocução (ligação, reunião, e-mail ou mensagem) com a instituição mandatária sobre a situação deste ponto de controle.",
    ]
  },
  proponente: {
    titulo: "Contato com o Ente Recebedor",
    explicacao:
      "Indique se houve algum tipo de interlocução (ligação, reunião, e-mail ou mensagem) com o órgão recebedor (proponente) para tratar da situação deste ponto de controle.",
  },
  prazoPactuado: {
    titulo: "Prazo Pactuado",
    explicacao:
      "Informe a data pactuada, se houver, com o ente recebedor ou mandatária para o envio de documentos ou qualquer outra tomada de providências em relação a este ponto de controle.",
  },
};