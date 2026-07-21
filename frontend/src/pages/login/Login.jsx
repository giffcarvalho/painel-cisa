import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth/useAuth'
import styles from './Login.module.css'

function getSafeRedirect(value) {
  if (!value || !value.startsWith('/') || value.startsWith('/login')) {
    return '/'
  }

  return value
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = useMemo(() => {
    const statePath = location.state?.from
      ? `${location.state.from.pathname}${location.state.from.search || ''}`
      : null

    return getSafeRedirect(statePath || searchParams.get('redirect'))
  }, [location.state, searchParams])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({ email, senha })
      setSenha('')
      navigate(redirectTo, { replace: true })
    } catch {
      setError('E-mail ou senha inválidos.')
      setSenha('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <div className={styles.brand}>
          <h1 id="login-title" className={styles.title}>Painel DSR</h1>
          <p className={styles.subtitle}>
            Acesse com suas credenciais para utilizar os módulos protegidos do Painel DSR.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button className={styles.button} type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className={styles.spinner} aria-hidden="true" />}
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  )
}
