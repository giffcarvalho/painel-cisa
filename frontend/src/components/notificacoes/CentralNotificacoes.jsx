import { useEffect, useState } from 'react'
import { Check, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificacoesApi } from '@/api/notificacoes'
import styles from './CentralNotificacoes.module.css'

const LIMITE = 20
const LIMITE_COMPACTO = 5

function formatarData(value) {
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

export default function CentralNotificacoes({ compact = false }) {
  const navigate = useNavigate()
  const [pagina, setPagina] = useState(1)
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [expandido, setExpandido] = useState(false)
  const limiteAtual = compact && !expandido ? LIMITE_COMPACTO : LIMITE

  useEffect(() => {
    // Alterar entre compacto e expandido muda o limite da consulta e reinicia o
    // conjunto exibido sem manter respostas de um limite anterior.
    let ativo = true
    Promise.resolve().then(() => { if (ativo) { setCarregando(true); setErro('') } })
    notificacoesApi.listar({ page: pagina, limit: limiteAtual })
      .then((resultado) => { if (ativo) setDados(resultado) })
      .catch(() => { if (ativo) setErro('Não foi possível carregar as notificações.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [limiteAtual, pagina])

  useEffect(() => {
    // Eventos emitidos pelo sino ou por outra instância atualizam leitura e
    // contador local sem uma segunda chamada à API.
    function sincronizar(event) {
      setDados((atual) => {
        if (!atual) return atual
        const lidoEm = new Date().toISOString()
        return {
          ...atual,
          nao_lidas: event.detail?.nao_lidas ?? atual.nao_lidas,
          data: atual.data.map((item) => (
            event.detail?.todas || item.id_notificacao === event.detail?.id_notificacao
              ? { ...item, lido_em: item.lido_em || lidoEm }
              : item
          )),
        }
      })
    }
    window.addEventListener('notificacoes:atualizadas', sincronizar)
    return () => window.removeEventListener('notificacoes:atualizadas', sincronizar)
  }, [])

  async function marcarLida(item) {
    if (item.lido_em) return
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

  async function verRevisao(item) {
    await marcarLida(item)
    navigate(`/revisao-instrumento/${encodeURIComponent(item.identificador_instrumento)}/revisoes/${item.id_revisao}`)
  }

  return (
    <section id="notificacoes" className={`${styles.section} ${compact ? styles.compact : ''}`} aria-labelledby="notificacoes-title">
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h2 id="notificacoes-title">Notificações</h2>
            {compact && <span className={styles.count}>{dados?.total ?? 0}</span>}
          </div>
          <p>Acompanhe os acontecimentos relacionados ao seu trabalho.</p>
        </div>
        {dados?.nao_lidas > 0 && (
          <button type="button" className={styles.secondary} onClick={marcarTodas}>
            <CheckCheck /> Marcar todas como lidas
          </button>
        )}
      </header>
      {carregando && <div className={styles.state}><Loader2 className={styles.spinner} /> Carregando notificações...</div>}
      {!carregando && erro && <div className={styles.state} role="alert">{erro}</div>}
      {!carregando && !erro && dados?.data.length === 0 && (
        <div className={styles.state}>Você não possui novas notificações.</div>
      )}
      {!carregando && !erro && dados?.data.length > 0 && (
        <div className={styles.list}>
          {dados.data.map((item) => (
            <article key={item.id_notificacao} className={`${styles.item} ${!item.lido_em ? styles.unread : ''}`}>
              <div>
                <p>{item.mensagem}</p>
                <time dateTime={item.criado_em}>{formatarData(item.criado_em)}</time>
              </div>
              <div className={styles.actions}>
                {!item.lido_em && (
                  <button type="button" className={styles.linkButton} onClick={() => marcarLida(item)}>
                    <Check /> Marcar como lida
                  </button>
                )}
                {item.id_revisao && item.identificador_instrumento && (
                  <button type="button" className={styles.primary} onClick={() => verRevisao(item)}>Ver revisão</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {!carregando && !erro && (!compact || expandido) && dados?.total_paginas > 1 && (
        <nav className={styles.pagination} aria-label="Paginação das notificações">
          <button type="button" disabled={pagina === 1} onClick={() => setPagina((valor) => valor - 1)}><ChevronLeft /> Anterior</button>
          <span>Página {pagina} de {dados.total_paginas}</span>
          <button type="button" disabled={pagina >= dados.total_paginas} onClick={() => setPagina((valor) => valor + 1)}>Próxima <ChevronRight /></button>
        </nav>
      )}
      {compact && !carregando && !erro && (dados?.total ?? 0) > LIMITE_COMPACTO && (
        <nav className={styles.pagination} aria-label="Controle da lista de notificações">
          <button type="button" onClick={() => { setExpandido((valor) => !valor); setPagina(1) }}>
            {expandido ? 'Mostrar menos' : 'Ver todas as notificações'}
          </button>
        </nav>
      )}
    </section>
  )
}
