import { useEffect, useMemo, useState } from 'react'
import ResumoConfiguracao from '@/components/extrator-dados/ResumoConfiguracao'
import ModelosCampos from '@/components/extrator-dados/ModelosCampos'
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

const TIPOS_FALLBACK = [
  {
    id: 'municipio',
    label: 'Por município',
    descricao: 'Cada linha representa um município.',
  },
  {
    id: 'setor_censitario',
    label: 'Por setor censitário',
    descricao: 'Cada linha representa um setor censitário.',
  },
  {
    id: 'instrumento',
    label: 'Por instrumento DSR',
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

const MODELOS_CAMPOS = {
  resumo_territorial: {
    label: 'Resumo territorial',
    descricao: 'Município, UF, região, população, domicílios e indicadores principais.',
    termos: ['nome', 'sigla_uf', 'regiao', 'populacao', 'domicilios', 'dppo_total', 'deficit'],
  },
  carteira_dsr: {label: 'Carteira DSR',
    descricao: 'Instrumento, proposta, fase, situação, valores e datas.',
    termos: ['instrumento', 'proposta', 'fase', 'situacao', 'valor', 'data', 'carteira'],
  },
  agua_esgoto: {
    label: 'Água e esgoto',
    descricao: 'Indicadores de abastecimento, esgotamento e atendimento.',
    termos: ['agua', 'esgoto'],
  },
  completo: {label: 'Completo',
    descricao: 'Inclui campos principais e complementares da base escolhida.',
    termos: [],
  },
  personalizado: {
    label: 'Personalizado',
    descricao: 'Escolher manualmente coluna por coluna.',
    termos: [],
  },
}

const contarFiltrosAtivos = (filtros = {}) =>
  Object.values(filtros).filter((value) => Array.isArray(value) && value.length > 0).length

const selecionarCamposPorModelo = (campos, modeloId) => {
  const camposVisiveis = campos.filter((campo) => campo.visivel)

  if (modeloId === 'personalizado') return []
  if (modeloId === 'completo') return camposVisiveis.map((campo) => campo.id)

  const modelo = MODELOS_CAMPOS[modeloId]
  if (!modelo) return campos.filter((campo) => campo.padrao).map((campo) => campo.id)

  const selecionados = camposVisiveis.filter((campo) => {
    const base = `${campo.column} ${campo.label} ${campo.grupo}`.toLocaleLowerCase('pt-BR')
    return campo.padrao || modelo.termos.some((termo) => base.includes(termo))
  })

  return selecionados.map((campo) => campo.id)
}

export default function ConsultaPersonalizada() {
  const [tipoTabela, setTipoTabela] = useState('municipio')
  const [filtros, setFiltros] = useState({})
  const [fieldIds, setFieldIds] = useState([])

  const [modeloCamposSelecionado, setModeloCamposSelecionado] = useState('resumo_territorial')
  const [mostrarSelecaoManual, setMostrarSelecaoManual] = useState(false)
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

  const selecionarCamposPadrao = () => {
    setFieldIds(campos.filter((campo) => campo.padrao).map((campo) => campo.id))
  }

  const handleSelecionarModeloCampos = (modeloId) => {
    setModeloCamposSelecionado(modeloId)
    previaMutation.reset()
    exportMutation.reset()
    setPreviewGerada(false)

    if (modeloId === 'personalizado') {
      setMostrarSelecaoManual(true)
      return
    }

    setMostrarSelecaoManual(false)
    setFieldIds(selecionarCamposPorModelo(campos, modeloId))
  }

  useEffect(() => {
    if (!campos.length) return
    setFieldIds(campos.filter((campo) => campo.padrao).map((campo) => campo.id))
  }, [tipoTabela, catalogoQuery.dataUpdatedAt])

  const trocarTipoTabela = (nextTipoTabela) => {
    setTipoTabela(nextTipoTabela)
    setFiltros({})
    setFieldIds([])
    previaMutation.reset()
    exportMutation.reset()
    setModeloCamposSelecionado('resumo_territorial')
    setMostrarSelecaoManual(false)
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

  const gerarPrevia = () => {
    if (!tipoTabela || fieldIds.length === 0) return

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
    if (!tipoTabela || fieldIds.length === 0) return

    const response = await exportMutation.mutateAsync({
      ...payload,
      formato: 'xlsx',
    })

    downloadBlob(response, `extrator_dados_${tipoTabela}.xlsx`)
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Portal DSR</span>
          <h1>Extrator de Dados</h1>
          <p>
            Monte tabelas personalizadas sem precisar consultar banco de dados.
            Escolha a unidade da tabela, aplique filtros, selecione colunas e gere uma prévia antes de exportar.
          </p>
        </div>

        <ResumoConfiguracao
          base={tipoLabel}
          filtrosAtivos={contarFiltrosAtivos(filtros)}
          colunasSelecionadas={fieldIds.length}
        />
      </header>

      <TipoTabelaCards
        tipos={tipos}
        value={tipoTabela}
        onChange={trocarTipoTabela}
        isLoading={tiposQuery.isLoading}
        isError={tiposQuery.isError}
      />

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

      <ModelosCampos
        modelos={MODELOS_CAMPOS}
        value={modeloCamposSelecionado}
        onChange={handleSelecionarModeloCampos}
        selectedCount={fieldIds.length}
        onAjustar={() => setMostrarSelecaoManual(true)}
      />

      {mostrarSelecaoManual && (
        <SelecaoColunas
          campos={campos}
          selected={fieldIds}
          onChange={atualizarColunas}
          onSelectDefaults={selecionarCamposPadrao}
          onClear={() => atualizarColunas ([])}
          isLoading={catalogoQuery.isLoading}
          isError={catalogoQuery.isError}
        />
      )}

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
        previewDisabled={!tipoTabela || fieldIds.length === 0 || previaMutation.isPending || catalogoQuery.isLoading}
        exportDisabled={!previewGerada || !tipoTabela || fieldIds.length === 0 || exportMutation.isPending || catalogoQuery.isLoading}
        filtros={filtros}
        filtrosAtivosCount={contarFiltrosAtivos(filtros)}
        previewGerada={previewGerada}
      />
    </main>
  )
}