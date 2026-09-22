import { Fragment, useEffect, useState, useRef } from 'react';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../pages/pontos-controle/PontosControle.module.css';
import FiltroColuna from './FiltrosPontosControle';
import { useFiltrosPontosControle } from '../../context/pontos-controle/useFiltrosPontosControle';


const emptyValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return value;
};

const getItens = (data) => {
  if (Array.isArray(data)) return data;
  return data?.data ?? data?.items ?? data?.resultados ?? data?.instrumentos ?? data?.dados ?? [];
};

const PreviewField = ({ label, value, wide = false }) => (
  <div className={`${styles.previewItem} ${wide ? styles.previewItemWide : ''}`}>
    <dt>{label}</dt>
    <dd>{emptyValue(value)}</dd>
  </div>
);

const classeStatusPontoControle = (valor) => {
  switch (valor) {
    case 'Atenção':
      return styles.statusAtencao;
    case 'Alerta':
      return styles.statusAlerta;
    case 'Crítico':
      return styles.statusCritico;
    case 'Vencido':
      return styles.statusVencido;
    case 'Atrasada':
      return styles.statusAlerta;
    default:
      return '';
  }
};

const CelulaStatusPontoControle = ({ valor }) => (
  <td className={`${styles.compactCell} ${classeStatusPontoControle(valor)}`}>
    {emptyValue(valor)}
  </td>
);


const formatarFonte = (fonte) => {
  switch (fonte?.toLowerCase()) {
    case 'transferegov':
      return 'Transferegov';
    case 'caixa':
      return 'BDGestores Caixa';
    default:
      return fonte || '—';
  }
};

const formatarData = (dataStr) => {
  if (!dataStr) return '—';
  
  const [ano, mes, dia] = String(dataStr).split('T')[0].split('-');
  if (!ano || !mes || !dia) return dataStr;
  return `${dia}/${mes}/${ano}`;
};


const textosExplicativos = {
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
    titulo: 'Emissão da OS',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
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
      'Defeso Eleitoral':
        'Quando o controle estiver ativo, estiver dentro do período do Defeso Eleitoral (04/07/26 a 25/10/26) e a data de emissão da AIO for dentro do período do Defeso Eleitoral.',
    },
  },

  'Progresso físico': {
    titulo: 'Progresso Físico',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
    },
  },

  'Indícios de paralisação': {
    titulo: 'Indícios de Paralisação',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
    },
  },

  'Obras paralisadas': {
    titulo: 'Obras Paralisadas',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
    },
  },

  'Vistorias parciais': {
    titulo: 'Vistorias Parciais',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
    },
  },

  'Vistoria final': {
    titulo: 'Vistoria Final',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
    },
  },

  'Obras próximas conclusão': {
    titulo: 'Obras Próximas da Conclusão',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
    },
  },

  'Registro conclusão': {
    titulo: 'Registro da Conclusão',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
    },
  },

  'Vigência': {
    titulo: 'Vigência',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
    },
  },

  'Inconsistências': {
    titulo: 'Inconsistências',

    objetivo: '',
    gatilhos: {
      inicia: '',
      finaliza: '',
    },
    regraGeral: '',
    excecao: '',
    criteriosStatus: {
      '-': '',
      OK: '',
      Alerta: '',
      Vencido: '',
    },
  },
};

const InformacaoColuna = ({ label, onClick }) => (
  <div className={styles.headerTitleWithInfo}>
    <span>{label}</span>
    <button
      type="button"
      className={styles.headerInfoButton}
      onClick={(event) => {
        event.stopPropagation();
        onClick(label);
      }}
      aria-label={`Informações sobre ${label}`}
      title={`Informações sobre ${label}`}
    >
      ?
    </button>
  </div>
);




export default function TabelaPontosControle({
  data,
  dataDados,
  isLoading,
  isError,
  pagina,
  tamanhoPagina,
  onPageChange,
  onPageSizeChange,
  nrInstrumentoSelecionado,
  onSelectInstrumento,
}) {
  
  const [resumoAberto, setResumoAberto] = useState(null);
  const [informacaoColunaAberta, setInformacaoColunaAberta] = useState(null);
  const { limparTodosFiltros, totalFiltrosAtivos } = useFiltrosPontosControle();
  const tableWrapperRef = useRef(null);
  const instrumentos = getItens(data);
  const total = data?.total ?? instrumentos.length;
  const paginaAtual = data?.pagina ?? pagina;
  const tamanhoAtual = data?.tamanho_pagina ?? tamanhoPagina;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanhoAtual));

  useEffect(() => {
    setResumoAberto(null);
  }, [paginaAtual, tamanhoAtual, total]);

  const toggleResumo = (event, rowKey) => {
    event.stopPropagation();
    setResumoAberto((atual) => (atual === rowKey ? null : rowKey));
  };

  const abrirFicha = (event, nrInstrumento) => {
    event.stopPropagation();
    if (!nrInstrumento) return;
    onSelectInstrumento(nrInstrumento);
  };

  const abrirInformacaoColuna = (label) => {
    setInformacaoColunaAberta(label);
  };

  const fecharInformacaoColuna = () => {
    setInformacaoColunaAberta(null);
  };

  const handleScrollLeft = () => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollBy({ left: -500, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollBy({ left: 500, behavior: 'smooth' });
    }
  };
  
  return (
    <section className={styles.card}>
      
      <header className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h2>Pontos de Controle</h2>
          <div className={styles.cardHeaderSubInfo}>
            <p>{total ? `${total} registro(s) encontrado(s)` : 'Resultado da pesquisa'}</p>
            
            {totalFiltrosAtivos > 0 && (
              <button 
                type="button" 
                className={styles.btnClearFilters} 
                onClick={limparTodosFiltros}
                title="Limpar todos os filtros aplicados"
              >
                Limpar filtros ({totalFiltrosAtivos})
              </button>
            )}
          </div>
        </div>
        <div className={styles.scrollButtonsGroup}>
          <button 
            type="button" 
            className={styles.scrollArrowButton} 
            onClick={handleScrollLeft}
            title="Rolar para esquerda"
          >
            &#9664;
          </button>
          <button 
            type="button" 
            className={styles.scrollArrowButton} 
            onClick={handleScrollRight}
            title="Rolar para direita"
          >
            &#9654;
          </button>
        </div>
        <div className={styles.cardHeaderDataDados}>
          {dataDados && getItens(dataDados).map((item, idx) => (
            <span key={idx} style={{ fontSize: '0.85rem', marginLeft: '10px' }}>
              <strong>{formatarFonte(item.fonte)}:</strong> {formatarData(item.data_dados)}
            </span>
          ))}
        </div>
      </header>


      {informacaoColunaAberta && (
        <div
          className={styles.columnInfoOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="column-info-title"
          onClick={fecharInformacaoColuna}
        >
          <div
            className={styles.columnInfoWindow}
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const informacao = textosExplicativos[informacaoColunaAberta];

              return (
                <>
                  <div className={styles.columnInfoHeader}>
                    <h3 id="column-info-title">
                      {informacao?.titulo || informacaoColunaAberta}
                    </h3>

                    <button
                      type="button"
                      className={styles.columnInfoCloseButton}
                      onClick={fecharInformacaoColuna}
                      aria-label="Fechar explicação"
                      title="Fechar"
                    >
                      ×
                    </button>
                  </div>

                  {informacao ? (
                    <div className={styles.columnInfoContent}>
                      <div className={styles.columnInfoSection}>
                        <strong>Objetivo do controle:</strong>
                        <p>{informacao.objetivo}</p>
                      </div>

                      <div className={styles.columnInfoSection}>
                        <strong>Gatilhos operacionais:</strong>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Inicia controle:</strong>
                          <p>{informacao.gatilhos.inicia}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Finaliza controle:</strong>
                          <p>{informacao.gatilhos.finaliza}</p>
                        </div>
                      </div>

                      <div className={styles.columnInfoSection}>
                        <strong>Regra geral (aplicável):</strong>
                        <p>{informacao.regraGeral}</p>
                      </div>

                      <div className={styles.columnInfoSection}>
                        <strong>Exceção (não aplicável):</strong>
                        <p>{informacao.excecao}</p>
                      </div>

                      <div className={styles.columnInfoSection}>
                        <strong>Critérios de status e prazos:</strong>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status '-':</strong>
                          <p>{informacao.criteriosStatus['-']}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status 'OK':</strong>
                          <p>{informacao.criteriosStatus.OK}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status de 'Alerta':</strong>
                          <p>{informacao.criteriosStatus.Alerta}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status 'Vencido':</strong>
                          <p>{informacao.criteriosStatus.Vencido}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.columnInfoContent}>
                      <p>Informações desta coluna ainda não cadastradas.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}



      {isLoading && <div className={styles.state}>Carregando instrumentos...</div>}

      {isError && (
        <div className={`${styles.state} ${styles.error}`}>
          Não foi possível carregar os instrumentos.
        </div>
      )}

      {!isLoading && !isError && instrumentos.length === 0 && (
        <div className={styles.state}>Nenhum instrumento encontrado.</div>
      )}

      {!isLoading && !isError && instrumentos.length > 0 && (
        <>
          <div className={styles.tableWrapper} ref={tableWrapperRef}>
            <table className={styles.table}>
              <thead>

                <tr className={styles.headerRow}>
                  <th className={styles.colInstrumento}>Nº Instrumento</th>
                  <th className={styles.colAcoes}>Ações</th>
                  <th className={styles.colProponente}>Proponente</th>
                  <th className={styles.colMunicipios}>Municípios beneficiados</th>
                  <th className={styles.colUf}>UF</th>
                  <th className={styles.colCarteiraAtiva}>Carteira ativa</th>
                  <th className={styles.colProjetoAprovado}>Projeto aprovado</th>
                  <th className={styles.colPossuiAio}>Possui AIO</th>
                  <th className={styles.colCoordenacao}>Coordenação</th>
                  <th className={styles.colAcao}>Ação</th>
                  <th className={styles.colMonitores}>Monitores</th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Vencimento Suspensivas" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Emissão LAE" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Início Processo Licitatório" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Conclusão Processo Licitatório" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="VRPL" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Contratação" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Solicitação AIO" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Análise técnica AIO" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Análise GAB/SE AIO" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Registro AIO" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Emissão OS" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Início execução física" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Progresso físico" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Indícios de paralisação" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Obras paralisadas" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Vistorias parciais" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Vistoria final" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Obras próximas conclusão" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Registro conclusão" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Vigência" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colPontosControle}><InformacaoColuna label="Inconsistências" onClick={abrirInformacaoColuna} /></th>
                </tr>

                <tr className={styles.filterRow}>
                  <th><FiltroColuna campo="nr_instrumento" label="Nº Instrumento" /></th>
                  <th></th>
                  <th><FiltroColuna campo="proponente" label="proponente" /></th>
                  <th><FiltroColuna campo="municipios_beneficiados" label="Municípios beneficiados" /></th>
                  <th><FiltroColuna campo="uf" label="UF" /></th>
                  <th><FiltroColuna campo="carteira_ativa" label="Carteira ativa" /></th>
                  <th><FiltroColuna campo="projeto_aprovado" label="Projeto aprovado" /></th>
                  <th><FiltroColuna campo="possui_aio" label="Possui AIO" /></th>
                  <th><FiltroColuna campo="coordenacao" label="Coordenação" /></th>
                  <th><FiltroColuna campo="acao" label="Ação" /></th>
                  <th><FiltroColuna campo="monitor" label="Monitores" /></th>
                  <th><FiltroColuna campo="prazo_clausulas_suspensivas" label="Cláusulas Suspensivas" /></th>
                  <th><FiltroColuna campo="prazo_emissao_lae" label="Emissão LAE" /></th>
                  <th><FiltroColuna campo="prazo_inicio_licitacao" label="Início Processo Licitatório" /></th>
                  <th><FiltroColuna campo="prazo_conclusao_licitacao" label="Conclusão Processo Licitatório" /></th>
                  <th><FiltroColuna campo="prazo_vrpl" label="VRPL" /></th>
                  <th><FiltroColuna campo="prazo_contratacao" label="Contratação" /></th>
                  <th><FiltroColuna campo="prazo_solicitacao_aio" label="Solicitação AIO" /></th>
                  <th><FiltroColuna campo="prazo_analise_tecnica_aio" label="Análise técnica AIO" /></th>
                  <th><FiltroColuna campo="prazo_analise_executiva_aio" label="Análise GAB/SE AIO" /></th>
                  <th><FiltroColuna campo="prazo_registro_aio" label="Registro AIO" /></th>
                  <th><FiltroColuna campo="prazo_emissao_os" label="Emissão OS" /></th>
                  <th><FiltroColuna campo="prazo_inicio_execucao_fisica" label="Início execução física" /></th>
                  <th><FiltroColuna campo="prazo_progresso_fisico" label="Progresso físico" /></th>
                  <th><FiltroColuna campo="prazo_indicio_paralisacao" label="Indício de paralisação" /></th>
                  <th><FiltroColuna campo="status_paralisacao_obra" label="Obras paralisadas" /></th>
                  <th><FiltroColuna campo="vistoria_in_loco_parciais" label="Vistorias parciais" /></th>
                  <th><FiltroColuna campo="prazo_vistoria_final" label="Vistoria final" /></th>
                  <th><FiltroColuna campo="obras_proximas_conclusao" label="Obras próximas conclusão" /></th>
                  <th><FiltroColuna campo="registro_conclusao" label="Registro conclusão" /></th>
                  <th><FiltroColuna campo="vigencia" label="Vigência" /></th>
                  <th><FiltroColuna campo="status_de_execucao_da_obra" label="Inconsistências" /></th>
                </tr>

              </thead>
              
              <tbody>
                {instrumentos.map((instrumento, index) => {
                  const nrInstrumento = instrumento.nr_instrumento;
                  const rowKey = String(nrInstrumento ?? `${instrumento.nr_proposta ?? 'sem-id'}-${index}`);
                  const isSelected = String(nrInstrumentoSelecionado) === String(nrInstrumento);
                  const isResumoAberto = resumoAberto === rowKey;

                  return (
                    <Fragment key={rowKey}>
                      <tr className={`${styles.tableRow} ${isSelected ? styles.tableRowSelected : ''}`}>
                        <td className={styles.compactCell}>
                          {instrumento.nr_instrumento ? (instrumento.link_transferegov ? (
                              <a
                                href={instrumento.link_transferegov}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.detailLink}
                              >
                                {instrumento.nr_instrumento}
                              </a>
                            ) : (instrumento.nr_instrumento)) : ('—')
                          }
                        </td>
                        <td className={styles.actionCell}>
                          <div className={styles.actionGroup}>
                            <button
                              type="button"
                              className={styles.actionItem}
                              aria-expanded={isResumoAberto}
                              aria-label={isResumoAberto ? 'Recolher resumo' : 'Ver resumo'}
                              title="Pré-visualizar informações principais"
                              onClick={(event) => toggleResumo(event, rowKey)}
                            >
                              Resumo {isResumoAberto ? '−' : '+'}
                            </button>

                            <span className={styles.actionDivider} aria-hidden="true" />

                            <button
                              type="button"
                              className={styles.actionItem}
                              title="Abrir ficha detalhada"
                              disabled={!nrInstrumento}
                              onClick={(event) => abrirFicha(event, nrInstrumento)}
                            >
                              Ficha
                            </button>
                          </div>
                        </td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.proponente)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.municipios_beneficiados)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.uf)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.carteira_ativa)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.projeto_aprovado)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.possui_aio)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.coordenacao)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.acao)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.monitor)}</td>
                        <CelulaStatusPontoControle valor={instrumento.prazo_clausulas_suspensivas} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_emissao_lae} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_inicio_licitacao} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_conclusao_licitacao} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_vrpl} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_contratacao} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_solicitacao_aio} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_analise_tecnica_aio} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_analise_executiva_aio} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_registro_aio} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_emissao_os} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_inicio_execucao_fisica} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_progresso_fisico} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_indicio_paralisacao} />
                        <CelulaStatusPontoControle valor={instrumento.status_paralisacao_obra} />
                        <CelulaStatusPontoControle valor={instrumento.vistoria_in_loco_parciais} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_vistoria_final} />
                        <CelulaStatusPontoControle valor={instrumento.obras_proximas_conclusao} />
                        <CelulaStatusPontoControle valor={instrumento.registro_conclusao} />
                        <CelulaStatusPontoControle valor={instrumento.vigencia} />
                        <CelulaStatusPontoControle valor={instrumento.status_de_execucao_da_obra} />
                        
                      </tr>

                      {isResumoAberto && (
                        <tr className={styles.previewRow}>
                          <td colSpan={3}>
                            <dl className={styles.previewGrid}>
                              <PreviewField label="UF" value={instrumento.uf} />
                              <PreviewField label="Ação" value={instrumento.acao} />
                              <PreviewField label="Monitor" value={instrumento.monitor} />
                              <PreviewField label="Município(s)" value={instrumento.municipios_beneficiados} />
                              <PreviewField label="Carteira ativa" value={instrumento.carteira_ativa} />
                              <PreviewField label="Projeto aprovado" value={instrumento.projeto_aprovado} />
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <footer className={styles.pagination}>
            <span>
              Página {paginaAtual} de {totalPaginas}
            </span>

            <div className={styles.paginationControls}>
              {onPageSizeChange && (
                <select
                  className={styles.pageSize}
                  value={tamanhoPagina}
                  onChange={(event) => onPageSizeChange(Number(event.target.value))}
                >
                  <option value={40}>40</option>
                  <option value={80}>80</option>
                  <option value={200}>200</option>
                </select>
              )}

              <button type="button" disabled={paginaAtual <= 1} onClick={() => onPageChange(paginaAtual - 1)}>
                Anterior
              </button>

              <button
                type="button"
                disabled={paginaAtual >= totalPaginas}
                onClick={() => onPageChange(paginaAtual + 1)}
              >
                Próxima
              </button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}