export const manualIntro = {
  apresentacao:
    'O Painel DSR é uma ferramenta interna do Departamento de Saneamento Rural e de Pequenos Municípios, pensada para atender exclusivamente às demandas dos técnicos lotados no Departamento, especialmente no tocante às particularidades e especificadades das atividades do DSR. O painel reúne dados informações estratégicas para o DSR em um ambiente único de consulta. Este manual agrupa orientações sobre as ferramentas disponíveis no painel. Utilize os guias específicos de cada módulo para compreender indicadores, filtros, gráficos e demais funcionalidades',
  navegacao:
    'O acesso às funcionalidades do Painel DSR é realizado pelo menu lateral esquerdo. O menu permanece recolhido para ampliar a área útil de visualização e é expandido automaticamente quando o cursor do mouse é posicionado sobre ele. Para navegar entre os módulos, basta posicionar o cursor sobre o menu e selecionar a opção desejada.'
}

export const manualCards = [
  {
    title: 'Carteira DSR',
    description: 'Indicadores, filtros, gráficos e tabela detalhada.',
    to: '/manual/carteira-dsr',
  },
  {
    title: 'Mapa Interativo',
    description: 'Mapa, camadas, filtros, legenda e leitura territorial dos dados.',
    to: '/manual/mapa-interativo',
  },
  {
    title: 'Informações Gerais',
    description: 'Dúvidas frequentes, glossário básico e orientações gerais de uso.',
    to: '/manual/informacoes-gerais',
  },
]

export const carteiraTopics = [
  'Objetivo da ferramenta',
  'Filtros',
  'Indicadores',
  'Gráficos',
  'Tabela detalhada',
  'Exportação',
]

export const mapaTopics = [
  'Objetivo da ferramenta',
  'Navegação no mapa',
  'Filtros',
  'Camadas',
  'Legenda',
]

export const perguntasFrequentes = [
  {
    question: 'Por que alguns filtros não retornam resultados?',
    answer:
      'Os resultados dependem dos dados disponíveis na base e da combinação de filtros aplicada.',
  },
  {
    question: 'É possível exportar os dados?',
    answer:
      'Sim. As ferramentas do painel podem oferecer opções de exportação conforme a funcionalidade disponível.',
  },
]

export const glossario = [
  {
    term: 'Instrumento',
    description:
      'Registro ou contrato utilizado para organizar informações de repasse, execução ou acompanhamento.',
  },
  {
    term: 'Valor global',
    description:
      'Valor total associado ao instrumento, considerando os parâmetros registrados na base.',
  },
  {
    term: 'Carteira ativa',
    description:
      'Conjunto de instrumentos considerados ativos para acompanhamento no painel.',
  },
]