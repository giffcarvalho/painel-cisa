export const ANEXOS_CONCESSAO = [
  ['anexo_i_entregue', 'Anexo I — Declaração do recebedor com manifestação quanto à continuidade da intervenção'],
  ['anexo_ii_entregue', 'Anexo II — Declaração do agente regulador concordando com o procedimento de avaliação do impacto econômico-financeiro'],
  ['anexo_iii_entregue', 'Anexo III — Declaração do concessionário com manifestação quanto à aprovação do projeto, acompanhamento e auxílio técnico'],
  ['anexo_iv_entregue', 'Anexo IV — Declaração de provocação à agência reguladora para início dos procedimentos visando o reequilíbrio econômico-financeiro'],
]

export function dadosConcessaoPersistencia(item = {}) {
  const aplicavel = item.responsabilidade_privada === 'sim'
  return {
    responsabilidade_privada: item.responsabilidade_privada ?? null,
    observacao_concessao: item.observacao_concessao?.trim() || null,
    ...Object.fromEntries(ANEXOS_CONCESSAO.map(([campo]) => [campo, aplicavel ? item[campo] ?? null : null])),
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
  return ANEXOS_CONCESSAO.filter(([campo]) => item[campo] == null)
    .map(([, titulo]) => `Informe a situação de entrega do ${titulo.split(' — ')[0]}.`)
}
