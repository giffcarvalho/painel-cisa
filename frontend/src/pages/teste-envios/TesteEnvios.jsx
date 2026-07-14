import { useEffect, useState } from 'react'
import { testeEnviosApi } from '@/api/testeEnvios'
import styles from './TesteEnvios.module.css'
import { authApi } from '@/api/auth'

const FORM_INICIAL = {
  uf: '',
  cod_teste: '',
  nome_municipio_teste: '',
  descricao: '',
}

const PRIMEIRO_ACESSO_INICIAL = {
  nome: '',
  codigo_verificacao: '',
  email: '',
  senha: '',
}

function formatarData(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('pt-BR')
}

function montarPayload(form) {
  const codTeste = String(form.cod_teste).trim()

  return {
    uf: form.uf.trim().toUpperCase(),
    cod_teste: codTeste ? Number(codTeste) : null,
    nome_municipio_teste: form.nome_municipio_teste.trim() || null,
    descricao: form.descricao.trim() || null,
  }
}

export default function TesteEnvios() {
  const [form, setForm] = useState(FORM_INICIAL)
  const [envios, setEnvios] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loginForm, setLoginForm] = useState({
    email: '',
    senha: '',
  })
  const [usuario, setUsuario] = useState(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [authStatus, setAuthStatus] = useState('')

  const [primeiroAcessoForm, setPrimeiroAcessoForm] = useState(PRIMEIRO_ACESSO_INICIAL)
  const [isCreatingPassword, setIsCreatingPassword] = useState(false)
  const [primeiroAcessoMessage, setPrimeiroAcessoMessage] = useState('')
  const [primeiroAcessoStatus, setPrimeiroAcessoStatus] = useState('')

  const atualizarLogin = (event) => {
    const { name, value } = event.target
    setLoginForm((current) => ({ ...current, [name]: value }))
    setAuthMessage('')
    setAuthStatus('')
  }

  const fazerLogin = async (event) => {
    event.preventDefault()
    setIsLoggingIn(true)
    setError('')
    setSuccess('')
    setAuthMessage('')
    setAuthStatus('')

    try {
      const data = await authApi.login({
        email: loginForm.email.trim(),
        senha: loginForm.senha,
      })

      sessionStorage.setItem('dsr_teste_access_token', data.access_token)

      const usuarioLogado = await authApi.me()
      setUsuario(usuarioLogado)
      setAuthMessage('Autenticação funcionou')
      setAuthStatus('success')
      setLoginForm((current) => ({ ...current, senha: '' }))
    } catch {
      setUsuario(null)
      sessionStorage.removeItem('dsr_teste_access_token')
      setAuthMessage('Autenticação falhou')
      setAuthStatus('error')
      setLoginForm((current) => ({ ...current, senha: '' }))
    } finally {
      setIsLoggingIn(false)
    }
  }

  const atualizarPrimeiroAcesso = (event) => {
    const { name, value } = event.target
    setPrimeiroAcessoForm((current) => ({ ...current, [name]: value }))
    setPrimeiroAcessoMessage('')
    setPrimeiroAcessoStatus('')
  }

  const criarPrimeiroAcesso = async (event) => {
    event.preventDefault()
    setIsCreatingPassword(true)
    setPrimeiroAcessoMessage('')
    setPrimeiroAcessoStatus('')

    try {
      const data = await authApi.primeiroAcesso({
        nome: primeiroAcessoForm.nome.trim(),
        codigo_verificacao: primeiroAcessoForm.codigo_verificacao.trim(),
        email: primeiroAcessoForm.email.trim(),
        senha: primeiroAcessoForm.senha,
      })

      setPrimeiroAcessoMessage(data.mensagem || 'Senha criada com sucesso.')
      setPrimeiroAcessoStatus('success')
      setPrimeiroAcessoForm(PRIMEIRO_ACESSO_INICIAL)
    } catch (err) {
      const detail = err?.response?.data?.detail

      setPrimeiroAcessoMessage(
        typeof detail === 'string'
          ? detail
          : 'Não foi possível criar a senha.'
      )
      setPrimeiroAcessoStatus('error')
    } finally {
      setIsCreatingPassword(false)
    }
  }

  const sair = () => {
    sessionStorage.removeItem('dsr_teste_access_token')
    setUsuario(null)
    setAuthMessage('')
    setAuthStatus('')
    setSuccess('Token removido.')
  }

  const carregarEnvios = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await testeEnviosApi.listarEnvios()
      setEnvios(data)
    } catch {
      setError('Não foi possível carregar os envios de teste.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const carregarUsuario = async () => {
      const token = sessionStorage.getItem('dsr_teste_access_token')

      if (!token) return

      try {
        const data = await authApi.me()
        setUsuario(data)
      } catch {
        sessionStorage.removeItem('dsr_teste_access_token')
        setUsuario(null)
      }
    }

    carregarUsuario()
    carregarEnvios()
  }, [])

  const atualizarCampo = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const enviarFormulario = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await testeEnviosApi.criarEnvio(montarPayload(form))
      setSuccess('Envio de teste cadastrado com sucesso.')
      setForm(FORM_INICIAL)
      await carregarEnvios()
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        'Não foi possível cadastrar o envio de teste.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
      </header>

      {(error || success) && (
        <div
          className={error ? styles.errorBox : styles.successBox}
          role={error ? 'alert' : 'status'}
        >
          {error || success}
        </div>
      )}

      <form className={styles.panel} onSubmit={fazerLogin}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Login</h2>
          </div>
          {usuario && (
            <button type="button" onClick={sair}>
              Sair
            </button>
          )}
        </div>

        <div className={styles.formGrid}>
          <label className={styles.fullField}>
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              value={loginForm.email}
              onChange={atualizarLogin}
              required
            />
          </label>

          <label className={styles.fullField}>
            <span>Senha</span>
            <input
              name="senha"
              type="password"
              value={loginForm.senha}
              onChange={atualizarLogin}
              required
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={isLoggingIn}>
            {isLoggingIn ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        {authMessage && (
          <p
            className={authStatus === 'success' ? styles.successBox : styles.errorBox}
            role={authStatus === 'success' ? 'status' : 'alert'}
          >
            {authMessage}
          </p>
        )}

        {usuario && (
          <p className={styles.userInfo}>
            Usuário autenticado: {usuario.nome}
          </p>
        )}
      </form>

      <form className={styles.panel} onSubmit={criarPrimeiroAcesso}>
        <div className={styles.panelHeader}>
          <h2>Primeiro acesso</h2>
        </div>

        <div className={styles.formGrid}>
          <label>
            <span>Nome</span>
            <input
              name="nome"
              value={primeiroAcessoForm.nome}
              onChange={atualizarPrimeiroAcesso}
              required
            />
          </label>

          <label>
            <span>Código de verificação</span>
            <input
              name="codigo_verificacao"
              type="number"
              value={primeiroAcessoForm.codigo_verificacao}
              onChange={atualizarPrimeiroAcesso}
              required
            />
          </label>

          <label>
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              value={primeiroAcessoForm.email}
              onChange={atualizarPrimeiroAcesso}
              required
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              name="senha"
              type="password"
              value={primeiroAcessoForm.senha}
              onChange={atualizarPrimeiroAcesso}
              minLength={8}
              required
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={isCreatingPassword}>
            {isCreatingPassword ? 'Criando...' : 'Criar senha'}
          </button>
        </div>

        {primeiroAcessoMessage && (
          <p
            className={
              primeiroAcessoStatus === 'success' ? styles.successBox : styles.errorBox
            }
            role={primeiroAcessoStatus === 'success' ? 'status' : 'alert'}
          >
            {primeiroAcessoMessage}
          </p>
        )}
      </form>

      <section className={styles.contentGrid}>
        <form className={styles.panel} onSubmit={enviarFormulario}>
          <div className={styles.panelHeader}>
            <h2>envio</h2>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>UF</span>
              <input
                name="uf"
                value={form.uf}
                onChange={atualizarCampo}
                maxLength={2}
                required
              />
            </label>

            <label>
              <span>Código</span>
              <input
                name="cod_teste"
                type="number"
                value={form.cod_teste}
                onChange={atualizarCampo}
              />
            </label>

            <label className={styles.fullField}>
              <span>Município</span>
              <input
                name="nome_municipio_teste"
                value={form.nome_municipio_teste}
                onChange={atualizarCampo}
                maxLength={150}
              />
            </label>

            <label className={styles.fullField}>
              <span>Descrição</span>
              <textarea
                name="descricao"
                value={form.descricao}
                onChange={atualizarCampo}
                rows={4}
              />
            </label>
          </div>

          <div className={styles.actions}>
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Enviando...' : 'Enviar teste'}
            </button>
          </div>
        </form>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Registros recebidos</h2>
            <button type="button" onClick={carregarEnvios} disabled={isLoading}>
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          <div className={styles.tableScroller}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>UF</th>
                  <th>Código</th>
                  <th>Município</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Data envio</th>
                  <th>Data criação</th>
                </tr>
              </thead>

              <tbody>
                {envios.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyCell}>
                      Nenhum envio cadastrado.
                    </td>
                  </tr>
                ) : (
                  envios.map((envio) => (
                    <tr key={envio.id_envio}>
                      <td>{envio.id_envio}</td>
                      <td>{envio.uf}</td>
                      <td>{envio.cod_teste ?? '-'}</td>
                      <td>{envio.nome_municipio_teste || '-'}</td>
                      <td>{envio.descricao || '-'}</td>
                      <td>{envio.status}</td>
                      <td>{formatarData(envio.data_envio)}</td>
                      <td>{formatarData(envio.data_criacao)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}