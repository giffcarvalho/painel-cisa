import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth'
import styles from '@/pages/login/Login.module.css'

function PasswordInput({ id, label, value, onChange, disabled }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={styles.passwordField}>
        <input
          id={id}
          className={styles.input}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={onChange}
          disabled={disabled}
          minLength={8}
          required
        />
        <button
          type="button"
          className={styles.passwordToggle}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

export default function FirstAccessForm({ onBack, onSuccess, onSubmittingChange }) {
  const [codigo, setCodigo] = useState('')
  const [tecnico, setTecnico] = useState(null)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const codigoRef = useRef(null)

  useEffect(() => {
    codigoRef.current?.focus()
  }, [])

  function setSubmitting(value) {
    setIsSubmitting(value)
    onSubmittingChange?.(value)
  }

  async function handleValidate(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      setTecnico(await authApi.validarPrimeiroAcesso(codigo))
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Não foi possível validar o código.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreatePassword(event) {
    event.preventDefault()
    setError('')
    if (senha !== confirmacao) {
      setError('A senha e a confirmação devem ser iguais.')
      return
    }
    if (senha.length < 8 || !senha.trim()) {
      setError('A senha deve possuir pelo menos 8 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      const response = await authApi.definirSenhaPrimeiroAcesso({
        codigo_primeiro_acesso: codigo,
        senha,
        confirmacao_senha: confirmacao,
      })
      onSuccess(response.mensagem)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Não foi possível criar a senha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className={styles.brand}>
        <h1 id="login-modal-title" className={styles.title}>Primeiro acesso</h1>
        <p id="login-modal-description" className={styles.subtitle}>
          {tecnico
            ? 'Confira seus dados e crie uma senha com pelo menos 8 caracteres.'
            : 'Informe o código fornecido pela equipe responsável pelo Painel DSR.'}
        </p>
      </div>

      <form className={styles.form} onSubmit={tecnico ? handleCreatePassword : handleValidate}>
        {!tecnico ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="codigo-primeiro-acesso">Código de primeiro acesso</label>
            <input
              ref={codigoRef}
              id="codigo-primeiro-acesso"
              className={styles.input}
              type="text"
              autoComplete="one-time-code"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
        ) : (
          <>
            <div className={styles.readonlyGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="primeiro-acesso-nome">Nome</label>
                <input id="primeiro-acesso-nome" className={styles.input} value={tecnico.nome} readOnly />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="primeiro-acesso-email">E-mail</label>
                <input id="primeiro-acesso-email" className={styles.input} value={tecnico.email} readOnly />
              </div>
              {tecnico.setor && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="primeiro-acesso-setor">Setor</label>
                  <input id="primeiro-acesso-setor" className={styles.input} value={tecnico.setor} readOnly />
                </div>
              )}
            </div>
            <PasswordInput
              id="nova-senha"
              label="Nova senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              disabled={isSubmitting}
            />
            <PasswordInput
              id="confirmar-nova-senha"
              label="Confirmar nova senha"
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              disabled={isSubmitting}
            />
          </>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className={styles.spinner} aria-hidden="true" />}
          {isSubmitting ? 'Aguarde...' : tecnico ? 'Criar senha' : 'Continuar'}
        </button>
      </form>
      <button type="button" className={styles.backButton} onClick={onBack} disabled={isSubmitting}>
        Voltar ao login
      </button>
    </>
  )
}
