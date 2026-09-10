import { useEffect, useId, useRef, useState } from 'react'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { notificacoesApi } from '@/api/notificacoes'
import { useAuth } from '@/context/auth/useAuth'
import styles from './NotificationBell.module.css'

function formatarData(value) {
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

export default function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)
  const painelId = `notification-panel-${useId().replace(/:/g, '')}`
  const [aberto, setAberto] = useState(false)
  const [dados, setDados] = useState({ data: [], nao_lidas: 0 })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let ativo = true
    notificacoesApi.contarNaoLidas()
      .then((resultado) => { if (ativo) setDados((atual) => ({ ...atual, nao_lidas: resultado.nao_lidas })) })
      .catch(() => {})
    return () => { ativo = false }
  }, [isAuthenticated, location.pathname])

  useEffect(() => {
    function sincronizar(event) {
      setDados((atual) => ({ ...atual, nao_lidas: event.detail?.nao_lidas ?? atual.nao_lidas }))
    }
    window.addEventListener('notificacoes:atualizadas', sincronizar)
    return () => window.removeEventListener('notificacoes:atualizadas', sincronizar)
  }, [])

  useEffect(() => {
    if (!aberto) return undefined
    function fechar(event) {
      if (!containerRef.current?.contains(event.target)) setAberto(false)
    }
    function teclado(event) {
      if (event.key === 'Escape') setAberto(false)
    }
    document.addEventListener('pointerdown', fechar)
    document.addEventListener('keydown', teclado)
    return () => {
      document.removeEventListener('pointerdown', fechar)
      document.removeEventListener('keydown', teclado)
    }
  }, [aberto])

  async function alternar() {
    const proximo = !aberto
    setAberto(proximo)
    if (!proximo) return
    setCarregando(true)
    setErro('')
    try {
      setDados(await notificacoesApi.listar({ limit: 5 }))
    } catch {
      setErro('Não foi possível carregar as notificações.')
    } finally {
      setCarregando(false)
    }
  }

  async function abrirNotificacao(item) {
    if (!item.lido_em) {
      const resultado = await notificacoesApi.marcarLida(item.id_notificacao)
      setDados((atual) => ({
        ...atual,
        nao_lidas: resultado.nao_lidas,
        data: atual.data.map((registro) => registro.id_notificacao === item.id_notificacao
          ? { ...registro, lido_em: new Date().toISOString() }
          : registro),
      }))
      window.dispatchEvent(new CustomEvent('notificacoes:atualizadas', {
        detail: { nao_lidas: resultado.nao_lidas, id_notificacao: item.id_notificacao },
      }))
    }
    setAberto(false)
    if (item.id_revisao && item.identificador_instrumento) {
      navigate(`/revisao-instrumento/${encodeURIComponent(item.identificador_instrumento)}/revisoes/${item.id_revisao}`)
    }
  }

  async function marcarTodas() {
    await notificacoesApi.marcarTodasLidas()
    setDados((atual) => ({
      ...atual,
      nao_lidas: 0,
      data: atual.data.map((item) => ({ ...item, lido_em: item.lido_em || new Date().toISOString() })),
    }))
    window.dispatchEvent(new CustomEvent('notificacoes:atualizadas', {
      detail: { nao_lidas: 0, todas: true },
    }))
  }

  if (!isAuthenticated) return null

  return (
    <div ref={containerRef} className={styles.container}>
      <button
        type="button"
        className={styles.bell}
        aria-label={`Notificações${dados.nao_lidas ? `, ${dados.nao_lidas} não lidas` : ''}`}
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={alternar}
      >
        <Bell aria-hidden="true" />
        {dados.nao_lidas > 0 && <span>{dados.nao_lidas > 99 ? '99+' : dados.nao_lidas}</span>}
      </button>
      {aberto && (
        <section id={painelId} className={styles.popover} aria-label="Notificações recentes">
          <header>
            <strong>Notificações</strong>
            {dados.nao_lidas > 0 && (
              <button type="button" onClick={marcarTodas}><CheckCheck /> Marcar todas como lidas</button>
            )}
          </header>
          {carregando ? (
            <div className={styles.state}><Loader2 className={styles.spinner} /> Carregando...</div>
          ) : erro ? (
            <div className={styles.state} role="alert">{erro}</div>
          ) : dados.data.length === 0 ? (
            <div className={styles.state}>Você não possui novas notificações.</div>
          ) : (
            <div className={styles.items}>
              {dados.data.map((item) => (
                <button
                  type="button"
                  key={item.id_notificacao}
                  className={`${styles.item} ${!item.lido_em ? styles.unread : ''}`}
                  onClick={() => abrirNotificacao(item)}
                >
                  <span>{item.mensagem}</span>
                  <small>{formatarData(item.criado_em)}{item.id_revisao ? ' · Ver revisão' : ''}</small>
                </button>
              ))}
            </div>
          )}
          <button type="button" className={styles.viewAll} onClick={() => { setAberto(false); navigate('/meu-painel#notificacoes') }}>
            Ver todas
          </button>
        </section>
      )}
    </div>
  )
}
