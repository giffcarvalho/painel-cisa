import { ChevronRight, Clock3 } from 'lucide-react'
import styles from '@/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.module.css'

function formatarData(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short',
  }).format(new Date(value))
}

export default function ListaRevisoesPendentes({ revisoes, selecionada, onSelecionar }) {
  if (!revisoes.length) {
    return (
      <div className={styles.emptyState} role="status">
        <strong>Não há revisões pendentes de aplicação.</strong>
        <span>As revisões enviadas aparecerão aqui para conferência administrativa.</span>
      </div>
    )
  }

  return (
    <div className={styles.pendingList}>
      {revisoes.map((item) => (
        <button
          key={item.id_revisao}
          type="button"
          className={`${styles.pendingItem} ${selecionada === item.id_revisao ? styles.pendingItemActive : ''}`}
          onClick={() => onSelecionar(item.id_revisao)}
        >
          <span className={styles.pendingMain}>
            <span className={styles.pendingTitle}>
              <strong>{item.tipo_instrumento_label} {item.identificador_principal}</strong>
              <span className={styles.statusBadge}>Aguardando aplicação</span>
            </span>
            <span className={styles.pendingMeta}>
              Revisão nº {item.id_revisao} · {item.tecnico_responsavel}
            </span>
            <span className={styles.pendingMeta}>
              <Clock3 aria-hidden="true" /> Enviada em {formatarData(item.enviado_em)}
            </span>
          </span>
          <span className={styles.counts}>
            <span>{item.alteracoes.municipios} município(s)</span>
            <span>{item.alteracoes.localidades} localidade(s)</span>
            <span>{item.alteracoes.publico_alvo} avaliação(ões) de público-alvo</span>
            <span>{item.alteracoes.obras} relação(ões) de obras</span>
          </span>
          <ChevronRight className={styles.chevron} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
