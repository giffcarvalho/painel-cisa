export function getSafeAuthRedirect(value, fallback = '/') {
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

    if (url.origin !== window.location.origin || url.pathname === '/login') {
      return fallback
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
