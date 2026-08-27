import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth/useAuth'

export default function ProtectedRoute({ children, requiredProfile = null }) {
  const location = useLocation()
  const { isAuthenticated, isLoading, openLoginModal, usuario } = useAuth()
  const redirect = `${location.pathname}${location.search}${location.hash}`

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal({ redirectTo: redirect })
    }
  }, [isAuthenticated, isLoading, openLoginModal, redirect])

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3 text-sm font-medium text-cisa-text-secondary">
        <Loader2 className="h-5 w-5 animate-spin text-cisa-primary" />
        Carregando sessão...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (
    requiredProfile
    && String(usuario?.perfil || '').trim().toLocaleLowerCase('pt-BR')
      !== String(requiredProfile).trim().toLocaleLowerCase('pt-BR')
  ) {
    return <Navigate to="/" replace />
  }

  return children
}
