// Estado temporário da seleção. Este módulo nunca grava vínculos.
export const selecaoVazia = () => ({
  filtros: null,
  incluidos: [],
  excluidos: [],
})

export const estadoInicial = {
  filtros: {},
  selecao: selecaoVazia(),
  pagina: 0,
}

export const nomePosicao = posicao =>
  ({ 1: 'Principal', 2: 'Reserva 1', 3: 'Reserva 2' })[posicao] || 'Posição inválida'

export const quantidadeInstrumentos = quantidade =>
  `${quantidade} instrumento${quantidade === 1 ? '' : 's'}`

export function preparacaoReducer(estado, acao) {
  switch (acao.tipo) {
    case 'filtros':
      return { ...estado, filtros: acao.valor, pagina: 0 }
    case 'pagina':
      return { ...estado, pagina: acao.valor }
    case 'limparSelecao':
      return { ...estado, selecao: selecaoVazia() }
    case 'todos':
      return {
        ...estado,
        selecao: {
          filtros: structuredClone(estado.filtros),
          incluidos: [...estado.selecao.incluidos],
          excluidos: [],
        },
      }
    case 'itens': {
      const incluidos = new Set(estado.selecao.incluidos)
      const excluidos = new Set(estado.selecao.excluidos)
      for (const chave of acao.chaves) {
        if (acao.marcar) {
          incluidos.add(chave)
          excluidos.delete(chave)
        } else {
          incluidos.delete(chave)
          excluidos.add(chave)
        }
      }

      return {
        ...estado,
        selecao: {
          ...estado.selecao,
          incluidos: [...incluidos],
          excluidos: [...excluidos],
        },
      }
    }
    case 'nova':
      return { filtros: {}, selecao: selecaoVazia(), pagina: 0 }
    default:
      return estado
  }
}

export const tecnicoValido = monitor =>
  Number.isInteger(monitor?.id_usuario)
  && monitor.id_usuario > 0
  && monitor.cadastro_encontrado !== false
  && typeof monitor.perfil === 'string'
  && monitor.perfil.trim().toLowerCase() === 'tecnico'
  && typeof monitor.ativo === 'boolean'

// O estado administrativo do usuário não altera a integridade do vínculo.
// Problemas de identidade/duplicidade permanecem impedimentos; lacunas e perfis
// antigos podem ser corrigidos pela substituição integral, com revisão explícita.
export function diagnosticarDistribuicao(lista) {
  if (!Array.isArray(lista)) return {
    problemas: ['Vínculos atuais indisponíveis ou inválidos.'],
    inconsistencias: [],
  }

  const problemas = []
  const inconsistencias = []
  const posicoes = lista.map(m => m?.ordem_prioridade)
  const prioridadesValidas = new Set(posicoes).size === posicoes.length
    && posicoes.every(p => [1, 2, 3].includes(p))

  if (lista.length > 3) problemas.push('Mais de três monitores ativos.')
  if (lista.some(m => !Number.isInteger(m?.id_usuario) || m.id_usuario <= 0))
    problemas.push('Monitor sem identidade válida.')
  if (new Set(lista.map(m => m?.id_usuario)).size !== lista.length)
    problemas.push('Monitor com vínculos ativos duplicados.')
  if (!prioridadesValidas) problemas.push('Prioridades repetidas ou inválidas.')
  if (lista.some(m => m?.cadastro_encontrado === false))
    problemas.push('Vínculo atual aponta para cadastro inexistente.')
  if (lista.some(m =>
    typeof m?.perfil !== 'string'
    || !m.perfil.trim()
    || typeof m?.ativo !== 'boolean'
  ))
    problemas.push('Cadastro de monitor atual indisponível ou inconsistente.')

  if (prioridadesValidas && posicoes.some(p => p === 2 || p === 3) && !posicoes.includes(1))
    inconsistencias.push('Reservas atuais sem principal serão reorganizados pela distribuição final.')
  if (
    prioridadesValidas
    && [...posicoes].sort().join(',') !== Array.from({ length: lista.length }, (_, i) => i + 1).join(',')
  )
    inconsistencias.push('Lacunas nas prioridades atuais serão corrigidas pela distribuição final.')
  if (lista.some(m =>
    typeof m?.perfil === 'string' && m.perfil.trim().toLowerCase() !== 'tecnico'
  ))
    inconsistencias.push('Vínculo atual com perfil incompatível será substituído por destinos técnicos válidos.')

  return { problemas, inconsistencias }
}

export const problemasDistribuicao = lista => diagnosticarDistribuicao(lista).problemas

// Conta instrumentos distintos em toda a seleção, independentemente da página.
export function panoramaMonitores(itens, catalogo = []) {
  const porId = new Map(catalogo.map(m => [m.id_usuario, m]))
  const panorama = new Map()
  for (const item of new Map(itens.map(i => [i.chave, i])).values()) {
    for (const m of Array.isArray(item.monitores) ? item.monitores : []) {
      if (!m || !Number.isInteger(m.id_usuario)) continue
      if (!panorama.has(m.id_usuario)) panorama.set(m.id_usuario, {
        ...m,
        ...porId.get(m.id_usuario),
        instrumentos: new Set(),
        posicoes: { 1: new Set(), 2: new Set(), 3: new Set() },
      })

      const monitor = panorama.get(m.id_usuario)
      monitor.instrumentos.add(item.chave)
      monitor.posicoes[m.ordem_prioridade]?.add(item.chave)
    }
  }
  return [...panorama.values()]
    .map(m => ({
      ...m,
      total: m.instrumentos.size,
      posicoes: Object.fromEntries([1, 2, 3].map(p => [p, m.posicoes[p].size])),
    }))
    .sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR') || a.id_usuario - b.id_usuario
    )
}
