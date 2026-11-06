export function dadosConcessaoPersistencia(item = {}) {
  const aplicavel = item.responsabilidade_privada === 'sim'
  return {
    responsabilidade_privada: item.responsabilidade_privada ?? null,
    observacao_concessao: item.observacao_concessao?.trim() || null,
    anexos_entregues: aplicavel ? item.anexos_entregues ?? null : null,
    observacao_anexos: aplicavel ? item.observacao_anexos?.trim() || null : null,
  }
}

export function copiarConcessao(item) {
  const dados = dadosConcessaoPersistencia(item ?? {})
  return { ...item, ...dados, _original: dados }
}

export function pendenciasConcessao(item) {
  if (!item.responsabilidade_privada) return ['Responda se o escopo do instrumento é de responsabilidade privada.']
  if (item.responsabilidade_privada !== 'sim') return []
  return item.anexos_entregues == null
    ? ['Informe se os anexos referentes à concessão foram entregues.']
    : []
}
