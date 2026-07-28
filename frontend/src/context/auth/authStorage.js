export const AUTH_TOKEN_KEY = 'dsr_access_token'
export const AUTH_USER_KEY = 'dsr_usuario'
export const AUTH_LOGOUT_EVENT = 'dsr-auth:logout'
export const AUTH_LOGIN_REQUIRED_EVENT = 'dsr-auth:login-required'

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(AUTH_USER_KEY)

  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

export function setAuthSession(token, usuario) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(usuario))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export function notifyAuthLogout() {
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
}

export function requestAuthLogin(redirectTo) {
  window.dispatchEvent(new CustomEvent(AUTH_LOGIN_REQUIRED_EVENT, {
    detail: { redirectTo },
  }))
}
