export const manualIntro = {
  apresentacao:
    'O Portal DSR é uma plataforma interna do Ministério das Cidades destinada à consulta e análise de informações relacionadas ao Departamento de Saneamento Rural e Pequenos Municípios. O sistema reúne indicadores, instrumentos de repasse, dados territoriais e outras informações estratégicas em um ambiente único de consulta. Este manual reúne orientações sobre as ferramentas disponíveis no portal. Utilize os guias específicos de cada módulo para compreender indicadores, filtros, gráficos, funcionalidades e conceitos utilizados nas análises.',
  navegacao:
    'O acesso às funcionalidades do Portal DSR é realizado pelo menu lateral esquerdo. O menu permanece recolhido para ampliar a área útil de visualização e é expandido automaticamente quando o cursor do mouse é posicionado sobre ele. Para navegar entre os módulos, basta posicionar o cursor sobre o menu e selecionar a opção desejada.'
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
  'Indicadores',
  'Filtros',
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
  'Interpretação dos dados',
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
      'Sim. As ferramentas do portal podem oferecer opções de exportação conforme a funcionalidade disponível.',
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
      'Conjunto de instrumentos considerados ativos para acompanhamento no portal.',
  },
]