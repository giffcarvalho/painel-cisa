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
        <input id={id} className={styles.input} type={visible ? 'text' : 'password'}
          autoComplete="new-password" value={value} onChange={onChange}
          disabled={disabled} minLength={8} required />
        <button type="button" className={styles.passwordToggle}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible((current) => !current)} disabled={disabled}>
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

export default function PasswordResetForm({ onBack, onSuccess, onSubmittingChange }) {
  const [codigo, setCodigo] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const codigoRef = useRef(null)

  useEffect(() => { codigoRef.current?.focus() }, [])

  function setSubmitting(value) {
    setIsSubmitting(value)
    onSubmittingChange?.(value)
  }

  async function handleValidate(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      setUsuario(await authApi.validarCodigoRedefinicao(codigo))
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Não foi possível validar o código.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset(event) {
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
      const response = await authApi.definirSenhaRedefinicao({
        codigo_acesso: codigo,
        senha,
        confirmacao_senha: confirmacao,
      })
      onSuccess(response.mensagem)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Não foi possível redefinir a senha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className={styles.brand}>
        <h1 id="login-modal-title" className={styles.title}>Redefinir senha</h1>
        <p id="login-modal-description" className={styles.subtitle}>
          {usuario
            ? 'Confira seus dados e defina uma nova senha com pelo menos 8 caracteres.'
            : 'Informe o código fornecido pela equipe responsável pelo Painel DSR.'}
        </p>
      </div>
      <form className={styles.form} onSubmit={usuario ? handleReset : handleValidate}>
        {!usuario ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="codigo-redefinicao">Código de acesso</label>
            <input ref={codigoRef} id="codigo-redefinicao" className={styles.input}
              type="text" autoComplete="one-time-code" value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              disabled={isSubmitting} required />
          </div>
        ) : (
          <>
            <div className={styles.readonlyGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="redefinicao-nome">Nome</label>
                <input id="redefinicao-nome" className={styles.input} value={usuario.nome} readOnly />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="redefinicao-email">E-mail</label>
                <input id="redefinicao-email" className={styles.input} value={usuario.email} readOnly />
              </div>
              {usuario.setor && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="redefinicao-setor">Setor</label>
                  <input id="redefinicao-setor" className={styles.input} value={usuario.setor} readOnly />
                </div>
              )}
            </div>
            <PasswordInput id="redefinicao-nova-senha" label="Nova senha" value={senha}
              onChange={(event) => setSenha(event.target.value)} disabled={isSubmitting} />
            <PasswordInput id="redefinicao-confirmar-senha" label="Confirmar nova senha"
              value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)}
              disabled={isSubmitting} />
          </>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className={styles.spinner} aria-hidden="true" />}
          {isSubmitting ? 'Aguarde...' : usuario ? 'Redefinir senha' : 'Continuar'}
        </button>
      </form>
      <button type="button" className={styles.backButton} onClick={onBack} disabled={isSubmitting}>
        Voltar
      </button>
    </>
  )
}
