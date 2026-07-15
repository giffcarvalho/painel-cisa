import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '@/api/auth'
import { AuthContext } from './AuthContextValue'
import {
  AUTH_LOGOUT_EVENT,
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  notifyAuthLogout,
  setAuthSession,
} from './authStorage'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken())
  const [usuario, setUsuario] = useState(() => getStoredUser())
  const [isLoading, setIsLoading] = useState(Boolean(getAuthToken()))

  const clearSessionState = useCallback(() => {
    clearAuthSession()
    setToken(null)
    setUsuario(null)
  }, [])

  useEffect(() => {
    function handleExternalLogout() {
      setToken(null)
      setUsuario(null)
    }

    window.addEventListener(AUTH_LOGOUT_EVENT, handleExternalLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleExternalLogout)
  }, [])

  useEffect(() => {
    let cancelled = false
    const currentToken = getAuthToken()

    if (!currentToken) {
      setIsLoading(false)
      return undefined
    }

    async function carregarUsuario() {
      try {
        const usuarioAtual = await authApi.me()

        if (cancelled) return

        setToken(currentToken)
        setUsuario(usuarioAtual)
        setAuthSession(currentToken, usuarioAtual)
      } catch {
        if (!cancelled) {
          clearSessionState()
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    carregarUsuario()

    return () => {
      cancelled = true
    }
  }, [clearSessionState])

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials)

    setAuthSession(data.access_token, data.usuario)
    setToken(data.access_token)
    setUsuario(data.usuario)

    return data.usuario
  }, [])

  const logout = useCallback(() => {
    clearSessionState()
    notifyAuthLogout()
  }, [clearSessionState])

  const value = useMemo(
    () => ({
      token,
      usuario,
      isAuthenticated: Boolean(token && usuario),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, token, usuario],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
