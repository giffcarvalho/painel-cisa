import { useMemo, useState } from 'react'
import ResumoConfiguracao from '@/components/extrator-dados/ResumoConfiguracao'
import {
  useCatalogoExtrator,
  useExportarExcelExtrator,
  useFiltrosExtrator,
  usePreviaExtrator,
  useTipoTabelaExtrator,
} from '@/hooks/useExtratorDados'
import TipoTabelaCards from '@/components/extrator-dados/TipoTabelaCards'
import FiltrosExtrator from '@/components/extrator-dados/FiltrosExtrator'
import SelecaoColunas from '@/components/extrator-dados/SelecaoColunas'
import PreviaExtrator from '@/components/extrator-dados/PreviaExtrator'
import styles from './ConsultaPersonalizada.module.css'

const MAX_COLUNAS_EXPORTACAO = 80

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

const downloadBlob = (response, fallbackName) => {
  const url = window.URL.createObjectURL(new Blob([response.data]))
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

  const tiposQuery = useTipoTabelaExtrator()
  const catalogoQuery = useCatalogoExtrator(tipoTabela)
  const filtrosQuery = useFiltrosExtrator(tipoTabela)
  const previaMutation = usePreviaExtrator()
  const exportMutation = useExportarExcelExtrator()

  const tipos = tiposQuery.data?.data?.length ? tiposQuery.data.data : TIPOS_FALLBACK
  const campos = catalogoQuery.data?.data || []
  const filtrosDisponiveis = filtrosQuery.data?.data || []

  const tipoSelecionado = tipos.find((tipo) => tipo.id === tipoTabela)
  const tipoLabel = tipoSelecionado?.label || 'Tipo de tabela'

  const selectedColumns = useMemo(
    () => fieldIds.map((id) => campos.find((campo) => campo.id === id)).filter(Boolean),
    [campos, fieldIds]
  )

  const payload = useMemo(
    () => ({
      tipo_tabela: tipoTabela,
      field_ids: fieldIds,
      filtros: limparObjeto(filtros),
    }),
    [fieldIds, filtros, tipoTabela]
  )

  const trocarTipoTabela = (nextTipoTabela) => {
    setTipoTabela(nextTipoTabela)
    setFiltros({})
    setFieldIds([])
    previaMutation.reset()
    exportMutation.reset()
    setFiltrosAvancadosAbertos(false)
    setPreviewGerada(false)
  }

  const atualizarFiltros = (nextFiltros) => {
    setFiltros(nextFiltros)
    previaMutation.reset()
    exportMutation.reset()
    setPreviewGerada(false)
  }

  const atualizarColunas = (nextFieldIds) => {
    setFieldIds(nextFieldIds)
    previaMutation.reset()
    exportMutation.reset()
    setPreviewGerada(false)
  }

  const selecionarCamposPadrao = () => {
    atualizarColunas(campos.filter((campo) => campo.padrao).map((campo) => campo.id))
  }

  const gerarPrevia = () => {
    if (!tipoTabela || fieldIds.length === 0 || fieldIds.length > MAX_COLUNAS_EXPORTACAO) return

    previaMutation.mutate(
      {
        ...payload,
        limit: 50,
      },
      {
        onSuccess: () => setPreviewGerada(true),
      }
    )
  }

  const exportarExcel = async () => {
    if (!tipoTabela || fieldIds.length === 0 || fieldIds.length > MAX_COLUNAS_EXPORTACAO) return

    const response = await exportMutation.mutateAsync({
      ...payload,
      formato: 'xlsx',
    })

    downloadBlob(response, `extrator_dados_${tipoTabela}.xlsx`)
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
          colunasSelecionadas={fieldIds.length}
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
            selected={fieldIds}
            onChange={atualizarColunas}
            onSelectDefaults={selecionarCamposPadrao}
            onClear={() => atualizarColunas([])}
            isLoading={catalogoQuery.isLoading}
            isError={catalogoQuery.isError}
            maxColumns={MAX_COLUNAS_EXPORTACAO}
          />

          <PreviaExtrator
            tipoTabela={tipoTabela}
            selectedColumns={selectedColumns}
            preview={previaMutation.data}
            isLoading={previaMutation.isPending}
            error={previaMutation.error}
            onPreview={gerarPrevia}
            onExport={exportarExcel}
            isExporting={exportMutation.isPending}
            exportError={exportMutation.error}
            previewDisabled={
              !tipoTabela ||
              fieldIds.length === 0 ||
              fieldIds.length > MAX_COLUNAS_EXPORTACAO ||
              previaMutation.isPending ||
              catalogoQuery.isLoading
            }
            exportDisabled={
              !previewGerada ||
              !tipoTabela ||
              fieldIds.length === 0 ||
              fieldIds.length > MAX_COLUNAS_EXPORTACAO ||
              exportMutation.isPending ||
              catalogoQuery.isLoading
            }
            filtrosAtivosCount={contarFiltrosAtivos(filtros)}
            previewGerada={previewGerada}
            maxColumns={MAX_COLUNAS_EXPORTACAO}
          />
        </div>
      </section>
    </main>
  )
}