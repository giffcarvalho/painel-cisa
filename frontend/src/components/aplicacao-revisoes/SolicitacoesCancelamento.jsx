import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import styles from '@/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.module.css'

const LABELS = { pendente: 'Pendente', aprovada: 'Aprovada', rejeitada: 'Rejeitada' }

function formatarData(value) {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
}

export default function SolicitacoesCancelamento({ resultado, carregando, onAtualizar, onResponder }) {
  const [status, setStatus] = useState('pendente')
  const [modal, setModal] = useState(null)
  const [observacao, setObservacao] = useState('')
  const [processando, setProcessando] = useState(false)

  async function responder() {
    if (!modal || processando || (modal.acao === 'rejeitar' && !observacao.trim())) return
    setProcessando(true)
    try {
      await onResponder(modal.item, modal.acao, observacao.trim())
      setModal(null)
      setObservacao('')
    } finally {
      setProcessando(false)
    }
  }

  function filtrar(event) {
    const value = event.target.value
    setStatus(value)
    onAtualizar(1, value)
  }

  return <section className={styles.historyPanel} aria-labelledby="solicitacoes-title">
    <div className={styles.requestHeader}>
      <div><h2 id="solicitacoes-title">Solicitações de cancelamento</h2><p>Pedidos enviados pelos técnicos e respostas administrativas.</p></div>
      <label>Status<select value={status} onChange={filtrar}><option value="pendente">Pendentes</option><option value="">Todas</option><option value="aprovada">Aprovadas</option><option value="rejeitada">Rejeitadas</option></select></label>
    </div>
    {carregando ? <div className={styles.loading}><Loader2 className={styles.spinner} /> Carregando solicitações...</div>
      : !resultado.data?.length ? <div className={styles.emptyState}><strong>Nenhuma solicitação encontrada.</strong></div>
        : <div className={styles.requestList}>{resultado.data.map((item) => <article className={styles.requestItem} key={item.id_solicitacao}>
          <div className={styles.historyTitle}><strong>{item.tipo_instrumento_label} {item.identificador_instrumento}</strong><span className={`${styles.executionBadge} ${styles[`request_${item.status}`]}`}>{LABELS[item.status]}</span></div>
          <p>Revisão nº {item.id_revisao} · Execução #{item.id_execucao} · Técnico: {item.usuario_solicitante}</p>
          <p><strong>Solicitada em:</strong> {formatarData(item.solicitado_em)}</p>
          <p><strong>Motivo:</strong> {item.motivo_solicitacao}</p>
          {item.respondido_em && <p><strong>Respondida em:</strong> {formatarData(item.respondido_em)} por {item.usuario_resposta || '—'}</p>}
          {item.observacao_resposta && <p><strong>Observação administrativa:</strong> {item.observacao_resposta}</p>}
          {item.status === 'pendente' && <div className={styles.requestActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setModal({ item, acao: 'rejeitar' })}>Rejeitar solicitação</button>
            <button type="button" className={styles.dangerButton} disabled={!item.cancelamento_permitido} title={item.motivo_bloqueio_cancelamento || undefined} onClick={() => setModal({ item, acao: 'aprovar' })}>Aprovar e cancelar aplicação</button>
          </div>}
        </article>)}</div>}
    {modal && <div className={styles.modalBackdrop} role="presentation"><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="resposta-solicitacao-title">
      <button type="button" className={styles.closeButton} onClick={() => setModal(null)} disabled={processando} aria-label="Fechar"><X /></button>
      <h2 id="resposta-solicitacao-title">{modal.acao === 'aprovar' ? 'Aprovar e cancelar aplicação' : 'Rejeitar solicitação'}</h2>
      <p>{modal.acao === 'aprovar' ? 'A aplicação será cancelada pela rotina administrativa existente. A aprovação só será registrada se a reversão for concluída.' : 'A aplicação continuará válida e a resposta ficará registrada para auditoria.'}</p>
      <label className={styles.reasonField}><span>Observação da resposta {modal.acao === 'rejeitar' ? '(obrigatória)' : '(opcional)'}</span><textarea rows={4} maxLength={2000} value={observacao} onChange={(event) => setObservacao(event.target.value)} /></label>
      <div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={() => setModal(null)} disabled={processando}>Voltar</button><button type="button" className={modal.acao === 'aprovar' ? styles.dangerButton : styles.primaryButton} disabled={processando || (modal.acao === 'rejeitar' && !observacao.trim())} onClick={responder}>{processando && <Loader2 className={styles.spinner} />}{modal.acao === 'aprovar' ? 'Aprovar e cancelar aplicação' : 'Rejeitar solicitação'}</button></div>
    </div></div>}
  </section>
}
