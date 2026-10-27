// A consulta já conhece a pertinência ao filtro e à seleção global.
// Marcações explícitas só alteram os itens presentes, sem reproduzir filtros no cliente.
export function atualizarMarcacoes(dados, acao, somenteSelecao = false) {
  if (!dados) return dados
  if (acao.tipo === 'limparSelecao') return {
    ...dados,
    selecionados: 0,
    selecionados_no_filtro: 0,
    total: somenteSelecao ? 0 : dados.total,
    items: somenteSelecao ? [] : dados.items.map(i => i.selecionado ? { ...i, selecionado: false } : i),
  }

  const chaves = new Set(acao.chaves)
  let diferenca = 0
  const items = dados.items.map(i => {
    if (!chaves.has(i.chave) || i.selecionado === acao.marcar) return i
    diferenca += acao.marcar ? 1 : -1
    return { ...i, selecionado: acao.marcar }
  })
  return {
    ...dados,
    items,
    selecionados: dados.selecionados + diferenca,
    // Na revisão completa, o servidor reconcilia a interseção e repõe a página.
    selecionados_no_filtro: somenteSelecao
      ? dados.selecionados_no_filtro
      : dados.selecionados_no_filtro + diferenca,
    total: somenteSelecao ? dados.total + diferenca : dados.total,
  }
}
