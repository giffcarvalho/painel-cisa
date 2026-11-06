// Uma chave por conjunto de critérios, independentemente da ordem de seleção.
export function chaveFiltros(filtros) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(filtros)
        .filter(([, v]) => Array.isArray(v) ? v.length : v)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([c, v]) => [
          c,
          Array.isArray(v)
            ? [...new Set(v)].sort((a, b) => String(a).localeCompare(String(b)))
            : v,
        ])
    )
  )
}

export function configurarConsultaOpcoes(chave, buscar) {
  return {
    queryKey: ['distribuicao', 'opcoes-contextuais', chave],
    queryFn: ({ signal }) => buscar(JSON.parse(chave), signal),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  }
}

export function mudarFiltro(filtros, campo, valores) {
  const proximo = { ...filtros }
  if (Array.isArray(valores) ? valores.length : valores) proximo[campo] = valores
  else delete proximo[campo]
  return proximo
}

export const alternar = (lista = [], valor) =>
  lista.includes(valor) ? lista.filter(v => v !== valor) : [...lista, valor]

export const textoBusca = valor =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')

// Até chegar a resposta nova, os critérios continuam visíveis sem inventar contagens.
export function opcoesComSelecionados(opcoes = [], selecionados = [], rotulo = String) {
  return [
    ...opcoes,
    ...selecionados
      .filter(v => !opcoes.some(o => o.value === v))
      .map(value => ({ value, label: rotulo(value) })),
  ]
}

export function textoOpcao(opcao) {
  const label = opcao.label === 'true'
    ? 'Sim'
    : opcao.label === 'false'
      ? 'Não'
      : opcao.label
  return `${label}${opcao.total === undefined ? '' : opcao.total === 0 ? ' · 0 — sem resultados' : ` · ${opcao.total}`}`
}
