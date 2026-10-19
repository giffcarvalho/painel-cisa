const ouvintes = new Set()
let codigos = []

export const obterCodigosErro = () => codigos
export function assinarCodigosErro(ouvinte) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export function dispensarCodigoErro(codigo) {
  codigos = codigos.filter((item) => item !== codigo)
  ouvintes.forEach((ouvinte) => ouvinte())
}

// Complementa a mensagem existente; o painel global oferece somente as ações,
// sem criar outro toast/alerta para a mesma falha.
export async function identificarErro(error) {
  let data = error.response?.data
  if (data instanceof Blob && data.type.includes('json')) {
    try {
      data = JSON.parse(await data.text())
    } catch {
      return error
    }
  }
  const codigo = data?.codigo_erro
  if (typeof codigo !== 'string' || !/^ERR-[A-F0-9]{8,32}$/.test(codigo)) return error

  const detalhe = typeof data.detail === 'string'
    ? data.detail
    : 'Não foi possível concluir a operação.'
  const mensagem = detalhe.includes(codigo)
    ? detalhe
    : `${detalhe} Informe o código ${codigo} à equipe responsável.`
  error.response.data = { ...data, detail: mensagem }
  error.message = mensagem
  if (!codigos.includes(codigo)) {
    codigos = [...codigos, codigo]
    ouvintes.forEach((ouvinte) => ouvinte())
  }
  return error
}

export async function copiarCodigoErro(codigo) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(codigo)
      return
    }
  } catch {
    // Na rede interna por HTTP, a Clipboard API pode estar indisponível.
  }
  const foco = document.activeElement
  const campo = document.createElement('textarea')
  campo.value = codigo
  campo.readOnly = true
  campo.style.cssText = 'position:fixed;left:-9999px;top:0'
  document.body.appendChild(campo)
  try {
    campo.select()
    if (!document.execCommand('copy')) throw new Error('Cópia indisponível')
  } finally {
    campo.remove()
    foco?.focus()
  }
}
