import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '@/api/auth'
import { AuthContext } from './AuthContextValue'
import { getSafeAuthRedirect } from './authRedirect'
import {
  AUTH_LOGIN_REQUIRED_EVENT,
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginRedirectTo, setLoginRedirectTo] = useState(null)
  const loginModalOpenerRef = useRef(null)

  const openLoginModal = useCallback((options = {}) => {
    const requestedRedirect = options.redirectTo
      ? getSafeAuthRedirect(options.redirectTo, null)
      : null

    if (!loginModalOpenerRef.current) {
      loginModalOpenerRef.current = document.activeElement
    }

    setLoginRedirectTo(requestedRedirect)
    setIsLoginModalOpen(true)
  }, [])

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false)
    setLoginRedirectTo(null)

    const opener = loginModalOpenerRef.current
    loginModalOpenerRef.current = null
    window.setTimeout(() => opener?.isConnected && opener.focus(), 0)
  }, [])

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
    function handleLoginRequired(event) {
      openLoginModal({ redirectTo: event.detail?.redirectTo })
    }

    window.addEventListener(AUTH_LOGIN_REQUIRED_EVENT, handleLoginRequired)
    return () => window.removeEventListener(AUTH_LOGIN_REQUIRED_EVENT, handleLoginRequired)
  }, [openLoginModal])

  useEffect(() => {
    let cancelled = false
    const currentToken = getAuthToken()

    if (!currentToken) {
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
      isLoginModalOpen,
      loginRedirectTo,
      login,
      logout,
      openLoginModal,
      closeLoginModal,
    }),
    [
      closeLoginModal,
      isLoading,
      isLoginModalOpen,
      login,
      loginRedirectTo,
      logout,
      openLoginModal,
      token,
      usuario,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
