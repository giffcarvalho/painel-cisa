export function getSafeAuthRedirect(value, fallback = '/') {
  // Aceita apenas caminhos internos bem formados, bloqueando URLs absolutas,
  // protocol-relative e caracteres de controle usados em redirecionamentos.
  if (
    typeof value !== 'string'
    || !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || [...value].some((character) => character.charCodeAt(0) < 32)
  ) {
    return fallback
  }

  try {
    const url = new URL(value, window.location.origin)

    // Não retorna ao próprio login para evitar um ciclo após autenticar.
    if (url.origin !== window.location.origin || url.pathname === '/login') {
      return fallback
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
