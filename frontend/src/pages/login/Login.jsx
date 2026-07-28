import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth'
import { getSafeAuthRedirect } from '@/context/auth/authRedirect'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading, openLoginModal } = useAuth()

  const redirectTo = useMemo(
    () => getSafeAuthRedirect(searchParams.get('redirect')),
    [searchParams],
  )

  useEffect(() => {
    if (isLoading) return

    if (isAuthenticated) {
      navigate(redirectTo, { replace: true })
      return
    }

    openLoginModal({
      redirectTo: searchParams.has('redirect') ? redirectTo : null,
    })
  }, [isAuthenticated, isLoading, navigate, openLoginModal, redirectTo, searchParams])

  return null
}
