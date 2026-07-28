import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth/useAuth'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading, openLoginModal } = useAuth()
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

  return children
}
