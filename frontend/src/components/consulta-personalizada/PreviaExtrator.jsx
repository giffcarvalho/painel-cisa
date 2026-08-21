import { Download, Eye, FileText, Loader2 } from 'lucide-react'
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
  if (value === null || value === undefined || value === '') return '-'
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
  onExportExcel,
  onExportCsv,
  isExportingExcel,
  isExportingCsv,
  exportExcelError,
  exportCsvError,
  previewDisabled,
  exportExcelDisabled,
  exportCsvDisabled,
  totalRegistros,
  excelMaxRows = 13000,
  setorCensitarioSemUf = false,
  ufObrigatoriaMessage,
  filtrosAtivosCount = 0,
  previewGerada = false,
  exportacaoDisponivel: exportacaoDisponivelProp,
  maxColumns = 80,
}) {
  const rows = preview?.data || []
  const columns = preview?.columns || selectedColumns
  const exportacaoDisponivel =
    exportacaoDisponivelProp ?? (previewGerada && Boolean(preview))

  const totalFormatado =
    typeof totalRegistros === 'number' ? totalRegistros.toLocaleString('pt-BR') : null

  const excelBloqueadoPorVolume =
    typeof totalRegistros === 'number' && totalRegistros > excelMaxRows

  return (
    <section className={`${styles.panel} ${styles.previewPanel}`}>
      <div className={styles.panelHeader}>
        <div>
          <h2>Prévia da consulta</h2>
          <p>A tabela é gerada somente depois que a configuração for selecionada.</p>
        </div>

        <div className={styles.buttonCluster}>
          <button type="button" className={styles.primaryButton} disabled={previewDisabled} onClick={onPreview}>
            {isLoading ? <Loader2 className={styles.spinIcon} /> : <Eye size={16} />}
            Gerar prévia
          </button>

          {exportacaoDisponivel && (
            <>
              <button
                type="button"
                className={styles.successButton}
                disabled={exportExcelDisabled}
                onClick={onExportExcel}
              >
                {isExportingExcel ? <Loader2 className={styles.spinIcon} /> : <Download size={16} />}
                Exportar Excel
              </button>

              <button
                type="button"
                className={styles.secondaryButton}
                disabled={exportCsvDisabled}
                onClick={onExportCsv}
              >
                {isExportingCsv ? <Loader2 className={styles.spinIcon} /> : <FileText size={16} />}
                Exportar CSV
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.previewSummary}>
        <span>{selectedColumns.length} coluna(s) selecionada(s)</span>
        <span>{filtrosAtivosCount} filtro(s) aplicado(s)</span>
      </div>

      {!tipoTabela ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <strong>Escolha uma base para começar.</strong>
            <span>Depois selecione as colunas e gere uma prévia.</span>
          </div>
        </div>
      ) : setorCensitarioSemUf ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <strong>UF obrigatória para setor censitário.</strong>
            <span>{ufObrigatoriaMessage}</span>
          </div>
        </div>
      ) : selectedColumns.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <strong>Selecione ao menos uma coluna para gerar a prévia.</strong>
            <span>A prévia será habilitada quando a seleção estiver válida.</span>
          </div>
        </div>
      ) : selectedColumns.length > maxColumns ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <strong>Há colunas selecionadas acima do limite.</strong>
            <span>Para visualizar a prévia, reduza a seleção para no máximo {maxColumns} colunas.</span>
          </div>
        </div>
      ) : isLoading ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <strong>Gerando prévia...</strong>
            <span>Buscando as primeiras linhas da consulta.</span>
          </div>
        </div>
      ) : error ? (
        <div className={styles.errorBox}>Erro ao carregar prévia: {getErrorMessage(error)}</div>
      ) : !previewGerada || !preview ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <strong>Configure a consulta antes de visualizar a tabela.</strong>
            <span>A exportação ficará disponível depois que a prévia for gerada.</span>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <strong>Nenhum resultado encontrado.</strong>
            <span>Revise os filtros ou a base selecionada.</span>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.previewMeta}>
            {totalFormatado && <> Total do recorte: {totalFormatado} registro(s). Exibindo até {preview.limit} linhas. </>} 
          </div>

          {excelBloqueadoPorVolume && (
            <div className={styles.warningBox}>
              <p>A exportação em Excel está disponível para recortes com até {excelMaxRows.toLocaleString('pt-BR')} registros.</p>
              <p>Nesse caso, utilize a exportação em CSV.</p>
            </div>
          )}

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

      {exportExcelError && (
        <div className={styles.errorBox}>
          Erro ao exportar Excel: {getErrorMessage(exportExcelError)}
        </div>
      )}

      {exportCsvError && (
        <div className={styles.errorBox}>
          Erro ao exportar CSV: {getErrorMessage(exportCsvError)}
        </div>
      )}
    </section>
  )
}