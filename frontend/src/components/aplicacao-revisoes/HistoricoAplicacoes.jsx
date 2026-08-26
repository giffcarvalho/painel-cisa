import { ChevronLeft, ChevronRight, Clock3, Search } from 'lucide-react'
import styles from '@/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.module.css'

function formatarData(value) {
  return value
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : '—'
}

function quantidade(valor, singular, plural) {
  const total = Number(valor || 0)
  return `${total} ${total === 1 ? singular : plural}`
}

export default function HistoricoAplicacoes({ historico, filtros, carregando, onFiltrar, onPagina, onAbrir }) {
  function enviar(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onFiltrar({ busca: String(form.get('busca') || '').trim(), status: String(form.get('status') || '') })
  }

  return (
    <section className={styles.historyPanel} aria-labelledby="historico-title">
      <div className={styles.panelHeading}>
        <h2 id="historico-title">Histórico de aplicações</h2>
        <span>{historico.total || 0}</span>
      </div>
      <form className={styles.historyFilters} onSubmit={enviar}>
        <label>
          <span>Instrumento</span>
          <div className={styles.searchField}>
            <Search aria-hidden="true" />
            <input name="busca" defaultValue={filtros.busca} placeholder="Número do instrumento, proposta ou TED" />
          </div>
        </label>
        <label>
          <span>Status</span>
          <select name="status" defaultValue={filtros.status}>
            <option value="">Todos</option>
            <option value="sucesso">Sucesso</option>
            <option value="cancelado">Cancelado</option>
            <option value="falha">Falha</option>
            <option value="em_processamento">Em processamento</option>
          </select>
        </label>
        <button type="submit" className={styles.secondaryButton}>Filtrar</button>
      </form>

      {carregando ? <div className={styles.loading}>Carregando histórico...</div> : (
        <>
          <div className={styles.historyList}>
            {!historico.data?.length && <div className={styles.emptyState}>Nenhuma execução encontrada.</div>}
            {historico.data?.map((item) => (
              <button type="button" className={styles.historyItem} key={item.id_execucao} onClick={() => onAbrir(item.id_execucao)}>
                <div className={styles.historyTitle}>
                  <strong>Execução #{item.id_execucao}</strong>
                  <span className={`${styles.executionBadge} ${styles[`status_${item.status}`]}`}>{item.status_label}</span>
                </div>
                <p>{item.tipo_instrumento_label} {item.identificador_instrumento} · Revisão nº {item.id_revisao}</p>
                <div className={styles.historyMeta}><Clock3 aria-hidden="true" /> {formatarData(item.concluido_em || item.iniciado_em)} · {item.administrador}</div>
                <div className={styles.historyCounts}>
                  <span>{quantidade(item.qtd_municipios, 'município', 'municípios')}</span>
                  <span>{quantidade(item.qtd_localidades, 'localidade', 'localidades')}</span>
                  <span>{quantidade(item.qtd_publico_alvo, 'avaliação de público-alvo', 'avaliações de público-alvo')}</span>
                  <span>{quantidade(item.qtd_obras, 'obra', 'obras')}</span>
                </div>
              </button>
            ))}
          </div>
          {historico.total_pages > 1 && (
            <nav className={styles.pagination} aria-label="Paginação do histórico">
              <button type="button" className={styles.secondaryButton} disabled={historico.page <= 1} onClick={() => onPagina(historico.page - 1)}><ChevronLeft /> Anterior</button>
              <span>Página {historico.page} de {historico.total_pages}</span>
              <button type="button" className={styles.secondaryButton} disabled={historico.page >= historico.total_pages} onClick={() => onPagina(historico.page + 1)}>Próxima <ChevronRight /></button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
