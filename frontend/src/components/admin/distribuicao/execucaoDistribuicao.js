export const LIMITE_INSTRUMENTOS = 1000

export function prepararPedido(instrumentos, distribuicao) {
  const chaves = instrumentos.map(item => item.chave)
  if (!chaves.length || chaves.length > LIMITE_INSTRUMENTOS) {
    throw new Error(`Selecione de 1 a ${LIMITE_INSTRUMENTOS} instrumentos por execução.`)
  }
  if (chaves.some(chave => typeof chave !== 'string' || !chave)
    || new Set(chaves).size !== chaves.length) {
    throw new Error('A seleção contém identificadores inválidos ou repetidos. Atualize os dados.')
  }
  const valores = [distribuicao[1], distribuicao[2], distribuicao[3]]
  if (!Number.isInteger(valores[0]) || valores[0] <= 0
    || valores.slice(1).some(v => v !== null && (!Number.isInteger(v) || v <= 0))
    || (valores[2] !== null && valores[1] === null)
    || new Set(valores.filter(v => v !== null)).size !== valores.filter(v => v !== null).length) {
    throw new Error('Defina o principal e as reservas; escolha explicitamente Sem monitor nas reservas vazias.')
  }
  return {
    instrumentos: chaves,
    distribuicao: { principal: valores[0], reserva_1: valores[1], reserva_2: valores[2] },
  }
}

export function validarConjuntoConferido(previa, pedido) {
  const chaves = previa?.linhas?.map(linha => linha.chave)
  if (!Array.isArray(chaves) || previa.total !== pedido.instrumentos.length
    || chaves.length !== pedido.instrumentos.length || new Set(chaves).size !== chaves.length
    || chaves.some(chave => !pedido.instrumentos.includes(chave))) {
    throw new Error('A conferência não corresponde à seleção. Atualize a conferência antes de aplicar.')
  }
  return previa
}

export function previaAplicavel(previa, agora = Date.now()) {
  return !!previa && typeof previa.versao === 'string' && !!previa.versao
    && previa.impedidos === 0 && !(previa.erros || []).length
    && Number.isFinite(Date.parse(previa.expira_em)) && Date.parse(previa.expira_em) > agora
}

// Uma trava síncrona impede dois eventos de dispararem antes do próximo render.
export function criarTravaExecucao() {
  let emCurso = false
  return {
    iniciar() {
      if (emCurso) return false
      emCurso = true
      return true
    },
    liberar() { emCurso = false },
  }
}
