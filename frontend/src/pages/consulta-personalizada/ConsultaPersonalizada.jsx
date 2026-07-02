import { useMemo, useState } from 'react'
import ResumoConfiguracao from '@/components/extrator-dados/ResumoConfiguracao'
import {
  useCatalogoExtrator,
  useExportarExcelExtrator,
  useFiltrosExtrator,
  usePreviaExtrator,
  useTipoTabelaExtrator,
  useContarRegistrosExtrator,
  useExportarCsvExtrator,
} from '@/hooks/useExtratorDados'
import TipoTabelaCards from '@/components/extrator-dados/TipoTabelaCards'
import FiltrosExtrator from '@/components/extrator-dados/FiltrosExtrator'
import SelecaoColunas from '@/components/extrator-dados/SelecaoColunas'
import PreviaExtrator from '@/components/extrator-dados/PreviaExtrator'
import styles from './ConsultaPersonalizada.module.css'

const LIMITE_COLUNAS_PREVIA = 80
const LIMITE_LINHAS_EXCEL = 13000
const LIMITE_COLUNAS_EXCEL = 80

const SETOR_CENSITARIO_UF_MESSAGE =
  'Para consultar setores censitários, selecione ao menos uma UF. Essa regra evita consultas muito grandes e melhora a estabilidade da exportação.'

const TIPOS_FALLBACK = [
  {
    id: 'municipio',
    label: 'Por Município',
    descricao: 'Cada linha representa um município.',
  },
  {
    id: 'setor_censitario',
    label: 'Por Setor Censitário',
    descricao: 'Cada linha representa um setor censitário.',
  },
  {
    id: 'instrumento',
    label: 'Por Instrumento DSR',
    descricao: 'Cada linha representa um instrumento, proposta ou registro da Carteira DSR.',
  },
]

const limparObjeto = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined && String(value).trim() !== ''
    })
  )

const getFileName = (response, fallback) => {
  const disposition = response.headers?.['content-disposition']
  const match = disposition?.match(/filename="?([^"]+)"?/i)
  return match?.[1] || fallback
}

const COLUNAS_OBRIGATORIAS_POR_TIPO = {
  municipio: ['municipio.cod_municipio', 'municipio.nome_municipio'],
  setor_censitario: ['setor_censitario.cod_setor'],
  instrumento: ['instrumento.nr_instrumento'],
}

const getRequiredFieldIds = (tipoTabela) => COLUNAS_OBRIGATORIAS_POR_TIPO[tipoTabela] || []

const normalizarFieldIdsConsulta = (tipoTabela, fieldIds = []) =>
  Array.from(new Set([...getRequiredFieldIds(tipoTabela), ...fieldIds]))

const downloadBlob = (response, fallbackName) => {
  const contentType =
    response.headers?.['content-type'] ||
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  const blob = new Blob([response.data], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = getFileName(response, fallbackName)

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
}

const contarFiltrosAtivos = (filtros = {}) =>
  Object.values(filtros).filter((value) => Array.isArray(value) && value.length > 0).length

export default function ConsultaPersonalizada() {
  const [tipoTabela, setTipoTabela] = useState('')
  const [filtros, setFiltros] = useState({})
  const [fieldIds, setFieldIds] = useState([])
  const [filtrosAvancadosAbertos, setFiltrosAvancadosAbertos] = useState(false)
  const [previewGerada, setPreviewGerada] = useState(false)
  const [exportNotice, setExportNotice] = useState(null)

  const tiposQuery = useTipoTabelaExtrator()
  const catalogoQuery = useCatalogoExtrator(tipoTabela)
  const filtrosQuery = useFiltrosExtrator(tipoTabela)
  const contagemMutation = useContarRegistrosExtrator()
  const previaMutation = usePreviaExtrator()
  const exportExcelMutation = useExportarExcelExtrator()
  const exportCsvMutation = useExportarCsvExtrator()

  const tipos = tiposQuery.data?.data?.length ? tiposQuery.data.data : TIPOS_FALLBACK
  const campos = catalogoQuery.data?.data || []
  const filtrosDisponiveis = filtrosQuery.data?.data || []

  const tipoSelecionado = tipos.find((tipo) => tipo.id === tipoTabela)
  const tipoLabel = tipoSelecionado?.label || 'Tipo de tabela'

  const requiredFieldIds = useMemo(() => getRequiredFieldIds(tipoTabela), [tipoTabela])

  const fieldIdsConsulta = useMemo(
    () => normalizarFieldIdsConsulta(tipoTabela, fieldIds),
    [fieldIds, tipoTabela]
  )

  const selectedColumns = useMemo(
    () => fieldIdsConsulta.map((id) => campos.find((campo) => campo.id === id)).filter(Boolean),
    [campos, fieldIdsConsulta]
  )

  const payload = useMemo(
    () => ({
      tipo_tabela: tipoTabela,
      field_ids: fieldIdsConsulta,
      filtros: limparObjeto(filtros),
    }),
    [fieldIdsConsulta, filtros, tipoTabela]
  )

  const setorCensitarioSemUf =
    tipoTabela === 'setor_censitario' &&
    (!Array.isArray(filtros.sigla_uf) || filtros.sigla_uf.length === 0)

  const totalRegistros = contagemMutation.data?.total_registros ?? null
  const excelBloqueadoPorLinhas =
    typeof totalRegistros === 'number' && totalRegistros > LIMITE_LINHAS_EXCEL

  const excelBloqueadoPorColunas =
    fieldIdsConsulta.length > LIMITE_COLUNAS_EXCEL

  const excelBloqueado =
    excelBloqueadoPorLinhas || excelBloqueadoPorColunas

  const csvDisponivel =
    previewGerada || fieldIdsConsulta.length > LIMITE_COLUNAS_PREVIA

  const trocarTipoTabela = (nextTipoTabela) => {
    setTipoTabela(nextTipoTabela)
    setFiltros({})
    setFieldIds(normalizarFieldIdsConsulta(nextTipoTabela, []))
    previaMutation.reset()
    contagemMutation.reset()
    exportExcelMutation.reset()
    exportCsvMutation.reset()
    setFiltrosAvancadosAbertos(false)
    setPreviewGerada(false)
  }

  const atualizarFiltros = (nextFiltros) => {
    setFiltros(nextFiltros)
    previaMutation.reset()
    contagemMutation.reset()
    exportExcelMutation.reset()
    exportCsvMutation.reset()
    setPreviewGerada(false)
  }

  const atualizarColunas = (nextFieldIds) => {
    setFieldIds(normalizarFieldIdsConsulta(tipoTabela, nextFieldIds))
    previaMutation.reset()
    contagemMutation.reset()
    exportExcelMutation.reset()
    exportCsvMutation.reset()
    setPreviewGerada(false)
  }

  const selecionarCamposPadrao = () => {
    atualizarColunas(campos.filter((campo) => campo.padrao).map((campo) => campo.id))
  }

  const selecionarTodosCampos = () => {
    atualizarColunas(
      campos
        .filter((campo) => campo.visivel && campo.exportavel)
        .map((campo) => campo.id)
    )
  }

  const gerarPrevia = async () => {
    if (
      !tipoTabela ||
      setorCensitarioSemUf ||
      fieldIdsConsulta.length === 0 ||
      fieldIdsConsulta.length > LIMITE_COLUNAS_PREVIA
    ) return

    setPreviewGerada(false)

    try {
      await contagemMutation.mutateAsync(payload)
      await previaMutation.mutateAsync({
        ...payload,
        limit: 50,
      })
      setPreviewGerada(true)
    } catch {
      setPreviewGerada(false)
    }
  }

  const exportarExcel = async () => {
    if (
      !tipoTabela ||
      setorCensitarioSemUf ||
      excelBloqueado ||
      fieldIdsConsulta.length === 0
    ) return

    const format = 'excel'

    setExportNotice({
      type: 'loading',
      format,
      title: 'Gerando Excel',
      message:
        'O arquivo está sendo preparado. Exportações com muitos registros podem levar alguns segundos.',
    })

    try {
      const response = await exportExcelMutation.mutateAsync({
        ...payload,
        formato: 'xlsx',
      })

      downloadBlob(response, `extrator_dados_${tipoTabela}.xlsx`)
      setExportNotice(null)
    } catch {
      setExportNotice({
        type: 'error',
        format,
        title: 'Não foi possível gerar o arquivo',
        message:
          'Tente reduzir o recorte, selecionar menos colunas ou usar CSV para volumes maiores.',
      })
    }
  }

  const exportarCsv = async () => {
    if (
      !tipoTabela ||
      setorCensitarioSemUf ||
      fieldIdsConsulta.length === 0
    ) return

    const format = 'csv'

    setExportNotice({
      type: 'loading',
      format,
      title: 'Gerando CSV',
      message:
        'O arquivo está sendo preparado no servidor. Exportações com muitos registros podem levar alguns segundos.',
    })

    try {
      const response = await exportCsvMutation.mutateAsync({
        ...payload,
        formato: 'csv',
      })

      downloadBlob(response, `extrator_dados_${tipoTabela}.csv`)
      setExportNotice(null)
    } catch {
      setExportNotice({
        type: 'error',
        format,
        title: 'Não foi possível gerar o arquivo',
        message:
          'Tente reduzir o recorte, selecionar menos colunas ou usar CSV para volumes maiores.',
      })
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Consulta Personalizada</h1>
          <p>
            Monte uma tabela a partir das bases do Painel DSR, selecione colunas por tema,
            aplique filtros e gere uma prévia antes da exportação.
          </p>
        </div>

        <ResumoConfiguracao
          base={tipoLabel}
          filtrosAtivos={contarFiltrosAtivos(filtros)}
          colunasSelecionadas={fieldIdsConsulta.length}
        />
      </header>

      <div className={styles.queryBar}>
        <TipoTabelaCards
          tipos={tipos}
          value={tipoTabela}
          onChange={trocarTipoTabela}
          isLoading={tiposQuery.isLoading}
          isError={tiposQuery.isError}
        />
      </div>

      <section className={styles.workbench}>
        <aside className={styles.configRail} aria-label="Filtros da consulta">
          <FiltrosExtrator
            tipoTabela={tipoTabela}
            filtrosDisponiveis={filtrosDisponiveis}
            value={filtros}
            onChange={atualizarFiltros}
            onClear={() => atualizarFiltros({})}
            isLoading={filtrosQuery.isLoading}
            isError={filtrosQuery.isError}
            avancadosAbertos={filtrosAvancadosAbertos}
            onToggleAvancados={() => setFiltrosAvancadosAbertos((current) => !current)}
          />
        </aside>

        <div className={styles.mainColumn}>
          <SelecaoColunas
            tipoTabela={tipoTabela}
            campos={campos}
            selected={fieldIdsConsulta}
            requiredFieldIds={requiredFieldIds}
            onChange={atualizarColunas}
            onSelectDefaults={selecionarCamposPadrao}
            onSelectAll={selecionarTodosCampos}
            onClear={() => atualizarColunas([])}
            isLoading={catalogoQuery.isLoading}
            isError={catalogoQuery.isError}
            maxColumns={LIMITE_COLUNAS_PREVIA}
          />

          <PreviaExtrator
            tipoTabela={tipoTabela}
            selectedColumns={selectedColumns}
            preview={previaMutation.data}
            isLoading={previaMutation.isPending || contagemMutation.isPending}
            error={previaMutation.error || contagemMutation.error}
            onPreview={gerarPrevia}
            onExportExcel={exportarExcel}
            onExportCsv={exportarCsv}
            isExportingExcel={exportExcelMutation.isPending}
            isExportingCsv={exportCsvMutation.isPending}
            exportExcelError={exportExcelMutation.error}
            exportCsvError={exportCsvMutation.error}
            previewDisabled={
              !tipoTabela ||
              setorCensitarioSemUf ||
              fieldIdsConsulta.length === 0 ||
              fieldIdsConsulta.length > LIMITE_COLUNAS_PREVIA ||
              previaMutation.isPending ||
              contagemMutation.isPending ||
              catalogoQuery.isLoading
            }
            exportExcelDisabled={
              !previewGerada ||
              !tipoTabela ||
              setorCensitarioSemUf ||
              excelBloqueado ||
              fieldIdsConsulta.length === 0 ||
              exportExcelMutation.isPending ||
              exportCsvMutation.isPending ||
              catalogoQuery.isLoading
            }
            exportCsvDisabled={
              !csvDisponivel ||
              !tipoTabela ||
              setorCensitarioSemUf ||
              fieldIdsConsulta.length === 0 ||
              exportExcelMutation.isPending ||
              exportCsvMutation.isPending ||
              catalogoQuery.isLoading
            }
            totalRegistros={totalRegistros}
            excelMaxRows={LIMITE_LINHAS_EXCEL}
            setorCensitarioSemUf={setorCensitarioSemUf}
            ufObrigatoriaMessage={SETOR_CENSITARIO_UF_MESSAGE}
            filtrosAtivosCount={contarFiltrosAtivos(filtros)}
            previewGerada={previewGerada}
            exportacaoDisponivel={
              Boolean(tipoTabela) &&
              !setorCensitarioSemUf &&
              fieldIdsConsulta.length > 0 &&
              csvDisponivel
            }
            maxColumns={LIMITE_COLUNAS_PREVIA}
          />
        </div>
      </section>

      {exportNotice && (
        <div className={styles.exportModalOverlay} role="presentation">
          <div
            className={`${styles.exportModal} ${
              exportNotice.type === 'error' ? styles.exportModalError : ''
            }`}
            role={exportNotice.type === 'error' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="export-modal-title"
            aria-describedby="export-modal-description"
          >
            {exportNotice.type === 'loading' && (
              <span className={styles.exportModalSpinner} aria-hidden="true" />
            )}

            <h2 id="export-modal-title">{exportNotice.title}</h2>
            <p id="export-modal-description">{exportNotice.message}</p>

            {exportNotice.type === 'error' && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setExportNotice(null)}
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      )}

    </main>
  )
}