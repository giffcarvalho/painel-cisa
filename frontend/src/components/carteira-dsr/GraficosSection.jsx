import { useRef } from "react"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton" 
import styles from './GraficosSection.module.css'
import ValoresUfChart from './graficos/ValoresUfChart'
import MapaIntegradoChart from "./graficos/MapaIntegradoChart"
import AcoesQtdeChart from "./graficos/AcoesQtdeChart"
import TipoInstrumentoChart from "./graficos/TipoInstrumentoChart"
import ValoresAcaoChart from "./graficos/ValoresAcaoChart"
import FasesChart from "./graficos/FasesChart"
import SituacaoContratacaoChart from "./graficos/SituacaoContratacaoChart"
import ExportMenu from "./ExportMenu"

import { 
  useValoresUfQuery, useMapaCoropleticoQuery, useValoresAcaoQuery,
  useAcoesQtdeQuery, useFasesQuery, useSituacaoContratacaoQuery,
  useMapaPontosQuery, useTipoInstrumentoQuery, useBrasilGeoJsonQuery
} from "@/hooks/useCarteiraDsr"

import { exportToExcel } from "@/utils/exportToExcel"

// --- COMPONENTE RAIZ ---
export default function GraficosSection() {
  return (
    <div className={styles.dashboardGrid}>
      
      {/* --- CARD 1: VISÃO GEOSPACIAL --- */}
      <div className={styles.megaCard}>
        <h2 className={styles.sectionTitle}>Distribuição Geográfica e Financeira por UF</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-gray-100 mt-2">
          
          <div className="py-4 xl:py-6 xl:pr-8">
            <AsyncValoresUf />
          </div>
          
          <div className="py-4 xl:py-6 xl:pl-8">
            <AsyncMapaIntegrado />
          </div>
          
        </div>
      </div>

      {/* --- CARD 2: ANÁLISE EXECUTIVA --- */}
      <div className={styles.megaCard}>
        <h2 className={styles.sectionTitle}>Panorama de Instrumentos e Contratações</h2>
        
        <div className="flex flex-col mt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 border-b border-gray-100">
            <div className="py-6 lg:py-8 lg:pr-8">
              <AsyncValoresAcao />
            </div>
            
            <div className="py-6 lg:py-8 lg:px-8">
              <AsyncAcoesQtde />
            </div>
            
            <div className="py-6 lg:py-8 lg:pl-8">
              <AsyncTipoInstrumento />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            <div className="py-6 lg:py-8 lg:pr-8">
              <AsyncFases />
            </div>
            
            <div className="py-6 lg:py-8 lg:pl-8">
              <AsyncSituacaoContratacao />
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

function ChartStateWrapper({ isLoading, isError, children }) {
  if (isLoading) return <Skeleton className="w-full h-full min-h-[300px] rounded-md bg-gray-200" />
  if (isError) {
    return (
      <div className="flex w-full min-h-[300px] items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <span className="ml-3 text-sm font-medium text-red-700">Falha pontual.</span>
      </div>
    )
  }
  return children;
}

const handlePngExport = (chartRef, fileName) => {
  if (chartRef.current) {
    const instance = chartRef.current.getEchartsInstance()
    const url = instance.getDataURL({ type: 'png', backgroundColor: '#ffffff', pixelRatio: 2 })
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.png`
    a.click()
  }
}

function AsyncValoresUf() {
  const { data, isLoading, isError } = useValoresUfQuery()
  const chartRef = useRef(null)

  const handleExportExcel = () => {
    exportToExcel({
      data: data || [],
      columns: [
        { header: 'UF', key: 'uf', width: 10 },
        { header: 'Desembolsado (R$)', key: 'desembolsado', width: 25 },
        { header: 'Empenhado a Desemb. (R$)', key: 'empenhado_a_desembolsar', width: 25 },
        { header: 'A Empenhar (R$)', key: 'a_empenhar', width: 20 },
        { header: 'Contrapartida (R$)', key: 'contrapartida', width: 20 }
      ],
      fileName: 'valores_uf'
    })
  }

  return (
    <div className={styles.chartWrapper}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className={styles.chartTitle}>Valores Proporcionais por UF</h3>
        {data && !isLoading && !isError && (
          <ExportMenu onExportPng={() => handlePngExport(chartRef, 'valores_uf')} onExportExcel={handleExportExcel} />
        )}
      </div>
      <div className={styles.chartContainer} style={{ minHeight: '600px' }}>
        <ChartStateWrapper isLoading={isLoading} isError={isError}>
          <ValoresUfChart dados={data} ref={chartRef} />
        </ChartStateWrapper>
      </div>
    </div>
  )
}

function AsyncMapaIntegrado() {
  const queryCoropletico = useMapaCoropleticoQuery()
  const queryPontos = useMapaPontosQuery()
  const queryGeoJson = useBrasilGeoJsonQuery()
  const chartRef = useRef(null)

  const isLoading = queryCoropletico.isLoading || queryPontos.isLoading || queryGeoJson.isLoading
  const isError = queryCoropletico.isError || queryPontos.isError || queryGeoJson.isError

  const handleExportExcel = () => {
    exportToExcel({
      data: queryCoropletico.data || [],
      columns: [
        { header: 'UF', key: 'uf', width: 10 },
        { header: 'Valor Global Proporcional (R$)', key: 'valor_global_proporcional', width: 35 },
        { header: 'Qtde Instrumentos', key: 'qtde_instrumentos', width: 20 }
      ],
      fileName: 'mapa_valores_por_uf'
    })
  }

  return (
    <div className={styles.chartWrapper}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className={styles.chartTitle}>Visão Geospacial (Valores vs. Municípios)</h3>
        {queryCoropletico.data && !isLoading && !isError && (
          <ExportMenu onExportPng={() => handlePngExport(chartRef, 'mapa_geoespacial')} onExportExcel={handleExportExcel} />
        )}
      </div>
      <div className={styles.chartContainer} style={{ minHeight: '600px' }}>
        <ChartStateWrapper isLoading={isLoading} isError={isError}>
          <MapaIntegradoChart dadosCoropletico={queryCoropletico.data} dadosPontos={queryPontos.data} geoJson={queryGeoJson.data} ref={chartRef} />
        </ChartStateWrapper>
      </div>
    </div>
  )
}

function AsyncValoresAcao() {
  const { data, isLoading, isError } = useValoresAcaoQuery()
  const chartRef = useRef(null)

  const handleExportExcel = () => {
    exportToExcel({
      data: data || [],
      columns: [
        { header: 'Ação Padronizada', key: 'acao_padronizada', width: 40 },
        { header: 'Desembolsado (R$)', key: 'desembolsado', width: 25 },
        { header: 'Empenhado a Desemb. (R$)', key: 'empenhado_a_desembolsar', width: 25 },
        { header: 'A Empenhar (R$)', key: 'a_empenhar', width: 20 },
        { header: 'Contrapartida (R$)', key: 'contrapartida', width: 20 }
      ],
      fileName: 'valores_por_acao'
    })
  }

  return (
    <div className={styles.chartWrapper}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className={styles.chartTitle}>Valores por Ação Padronizada</h3>
        {data && !isLoading && !isError && (
          <ExportMenu onExportPng={() => handlePngExport(chartRef, 'valores_por_acao')} onExportExcel={handleExportExcel} />
        )}
      </div>
      <div className={styles.chartContainer}>
        <ChartStateWrapper isLoading={isLoading} isError={isError}>
          <ValoresAcaoChart dados={data} ref={chartRef} />
        </ChartStateWrapper>
      </div>
    </div>
  )
}

function AsyncAcoesQtde() {
  const { data, isLoading, isError } = useAcoesQtdeQuery()
  const chartRef = useRef(null)

  const handleExportExcel = () => {
    exportToExcel({
      data: data || [],
      columns: [
        { header: 'Ação Padronizada', key: 'acao_padronizada', width: 40 },
        { header: 'Qtde Instrumentos', key: 'qtde_instrumentos', width: 20 }
      ],
      fileName: 'quantidade_por_acao'
    })
  }

  return (
    <div className={styles.chartWrapper}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className={styles.chartTitle}>Quantidade de Instrumentos por Ação</h3>
        {data && !isLoading && !isError && (
          <ExportMenu onExportPng={() => handlePngExport(chartRef, 'qtde_por_acao')} onExportExcel={handleExportExcel} />
        )}
      </div>
      <div className={styles.chartContainer}>
        <ChartStateWrapper isLoading={isLoading} isError={isError}>
          <AcoesQtdeChart dados={data} ref={chartRef} />
        </ChartStateWrapper>
      </div>
    </div>
  )
}

function AsyncFases() {
  const { data, isLoading, isError } = useFasesQuery()
  const chartRef = useRef(null)

  const handleExportExcel = () => {
    exportToExcel({
      data: data || [],
      columns: [
        { header: 'Fase de Execução', key: 'fase_instrumento', width: 35 },
        { header: 'Qtde Instrumentos', key: 'qtde_instrumentos', width: 20 }
      ],
      fileName: 'fases_execucao'
    })
  }

  return (
    <div className={styles.chartWrapper}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className={styles.chartTitle}>Instrumentos por Fase de Execução</h3>
        {data && !isLoading && !isError && (
          <ExportMenu onExportPng={() => handlePngExport(chartRef, 'fases_execucao')} onExportExcel={handleExportExcel} />
        )}
      </div>
      <div className={styles.chartContainer}>
        <ChartStateWrapper isLoading={isLoading} isError={isError}>
          <FasesChart dados={data} ref={chartRef} />
        </ChartStateWrapper>
      </div>
    </div>
  )
}

function AsyncSituacaoContratacao() {
  const { data, isLoading, isError } = useSituacaoContratacaoQuery()
  const chartRef = useRef(null)

  const handleExportExcel = () => {
    exportToExcel({
      data: data || [],
      columns: [
        { header: 'Situação de Contratação', key: 'situacao_contratacao', width: 35 },
        { header: 'Qtde Instrumentos', key: 'qtde_instrumentos', width: 20 }
      ],
      fileName: 'situacao_contratacao'
    })
  }

  return (
    <div className={styles.chartWrapper}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className={styles.chartTitle}>Situação da Contratação</h3>
        {data && !isLoading && !isError && (
          <ExportMenu onExportPng={() => handlePngExport(chartRef, 'situacao_contratacao')} onExportExcel={handleExportExcel} />
        )}
      </div>
      <div className={styles.chartContainer}>
        <ChartStateWrapper isLoading={isLoading} isError={isError}>
          <SituacaoContratacaoChart dados={data} ref={chartRef} />
        </ChartStateWrapper>
      </div>
    </div>
  )
}

function AsyncTipoInstrumento() {
  const { data, isLoading, isError } = useTipoInstrumentoQuery()
  const chartRef = useRef(null)

  const handleExportExcel = () => {
    exportToExcel({
      data: data || [],
      columns: [
        { header: 'Tipo de Instrumento', key: 'tipo_instrumento', width: 35 },
        { header: 'Valor Global (R$)', key: 'valor_global', width: 25 }
      ],
      fileName: 'tipo_instrumento'
    })
  }

  return (
    <div className={styles.chartWrapper}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className={styles.chartTitle}>Valor Global por Tipo de Instrumento</h3>
        {data && !isLoading && !isError && (
          <ExportMenu onExportPng={() => handlePngExport(chartRef, 'tipo_instrumento')} onExportExcel={handleExportExcel} />
        )}
      </div>
      <div className={styles.chartContainer}>
        <ChartStateWrapper isLoading={isLoading} isError={isError}>
          <TipoInstrumentoChart dados={data} ref={chartRef} />
        </ChartStateWrapper>
      </div>
    </div>
  )
}