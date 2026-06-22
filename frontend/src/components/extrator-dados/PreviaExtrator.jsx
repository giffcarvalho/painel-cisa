import { Download, Eye, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, formatPercentualPontos } from '@/utils/formatters'
import styles from '../../pages/consulta-personalizada/ConsultaPersonalizada.module.css'

const getErrorMessage = (error) =>
  error?.message ||
  error?.response?.data?.detail ||
  'Não foi possível concluir a operação.'

const formatBoolean = (value) => {
  if (value === true || String(value).toLowerCase() === 'true') return 'Sim'
  if (value === false || String(value).toLowerCase() === 'false') return 'Não'
  return String(value)
}

const formatCell = (value, column) => {
  if (value === null || value === undefined || value === '') return '—'
  if (column?.formato === 'brl') return formatCurrency(Number(value))
  if (column?.formato === 'date' || column?.formato === 'datetime') return formatDate(value)
  if (column?.formato === 'percent') return formatPercentualPontos(value)
  if (column?.formato === 'boolean') return formatBoolean(value)
  return String(value)
}

export default function PreviaExtrator({
  tipoTabela,
  selectedColumns,
  preview,
  isLoading,
  error,
  onPreview,
  onExport,
  isExporting,
  exportError,
  previewDisabled,
  exportDisabled,
  filtrosAtivosCount = 0,
}) {
  const rows = preview?.data || []
  const columns = preview?.columns || selectedColumns

  return (
    <section className={`${styles.panel} ${styles.previewPanel}`}>
      <div className={styles.panelHeader}>
        <div className={styles.previewSummary}>
          <span>{selectedColumns.length} coluna(s) selecionada(s)</span>
          <span>{filtrosAtivosCount} filtro(s) aplicado(s)</span>
        </div>
        <div>
          <h2>4. Prévia e exportação</h2>
          <p>Confira as primeiras 50 linhas antes de baixar a planilha.</p>
        </div>

        <div className={styles.buttonCluster}>
          <button type="button" className={styles.primaryButton} disabled={previewDisabled} onClick={onPreview}>
            {isLoading ? <Loader2 className={styles.spinIcon} /> : <Eye size={16} />}
            Gerar prévia
          </button>

          <button type="button" className={styles.successButton} disabled={exportDisabled} onClick={onExport}>
            {isExporting ? <Loader2 className={styles.spinIcon} /> : <Download size={16} />}
            Exportar Excel
          </button>
        </div>
      </div>

      {!tipoTabela ? (
        <div className={styles.emptyState}>Escolha o tipo de tabela para começar.</div>
      ) : selectedColumns.length === 0 ? (
        <div className={styles.emptyState}>Selecione pelo menos uma coluna.</div>
      ) : isLoading ? (
        <div className={styles.emptyState}>Carregando prévia...</div>
      ) : error ? (
        <div className={styles.errorBox}>Erro ao carregar prévia: {getErrorMessage(error)}</div>
      ) : !preview ? (
        <div className={styles.emptyState}>Clique em Gerar prévia para visualizar os dados.</div>
      ) : rows.length === 0 ? (
        <div className={styles.emptyState}>Nenhum resultado encontrado para os filtros selecionados.</div>
      ) : (
        <>
          <div className={styles.previewMeta}>
            {preview.total_estimado} registro(s) encontrado(s). Exibindo até {preview.limit}.
          </div>

          <div className={styles.tableScroller}>
            <table className={styles.previewTable}>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.id}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td key={column.id}>{formatCell(row[column.id], column)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {exportError && (
        <div className={styles.errorBox}>
          Erro ao exportar Excel: {getErrorMessage(exportError)}
        </div>
      )}
    </section>
  )
}