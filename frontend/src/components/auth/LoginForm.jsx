import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth/useAuth'
import styles from '@/pages/login/Login.module.css'

export default function LoginForm({
  onSuccess,
  onSubmittingChange,
  onFirstAccess,
  onForgotPassword,
  successMessage,
}) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const emailRef = useRef(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (submittingRef.current) return

    submittingRef.current = true
    setError('')
    setIsSubmitting(true)
    onSubmittingChange?.(true)

    try {
      await login({ email, senha })
      setSenha('')
      setError('')
      onSuccess?.()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'E-mail ou senha inválidos.')
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
      onSubmittingChange?.(false)
    }
  }

  return (
    <>
      <div className={styles.brand}>
        <h1 id="login-modal-title" className={styles.title}>Acessar o Painel DSR</h1>
        <p id="login-modal-description" className={styles.subtitle}>
          Acesse com suas credenciais para utilizar os módulos protegidos do Painel DSR.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {successMessage && (
          <p className={styles.success} role="status">{successMessage}</p>
        )}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">E-mail</label>
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            className={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-senha">Senha</label>
          <div className={styles.passwordField}>
            <input
              id="login-senha"
              name="senha"
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              className={styles.passwordToggle}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={isSubmitting}
            >
              {showPassword
                ? <EyeOff aria-hidden="true" />
                : <Eye aria-hidden="true" />}
            </button>
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className={styles.spinner} aria-hidden="true" />}
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <nav className={styles.authOptions} aria-label="Outras opções de acesso">
        <button type="button" className={styles.textButton} onClick={onFirstAccess}>
          Primeiro acesso
        </button>
        <button type="button" className={styles.textButton} onClick={onForgotPassword}>
          Esqueci minha senha
        </button>
      </nav>
    </>
  )
}
