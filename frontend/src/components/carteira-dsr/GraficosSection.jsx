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

import { 
  useValoresUfQuery,
  useMapaCoropleticoQuery,
  useValoresAcaoQuery,
  useAcoesQtdeQuery,
  useFasesQuery,
  useSituacaoContratacaoQuery,
  useMapaPontosQuery,
  useTipoInstrumentoQuery,
  useBrasilGeoJsonQuery
} from "@/hooks/useCarteiraDsr"

export default function GraficosSection() {
  return (
    <div className={styles.dashboardGrid}>
      
      {/* --- LINHA 1: BARRAS E MAPA --- */}
      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valores Proporcionais por UF</h3>
          <div className={styles.chartPlaceholder} style={{ minHeight: '900px' }}>
            <AsyncValoresUf />
          </div>
        </div>

        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Visão Geospacial (Valores vs. Municípios Beneficiados)</h3>
          <div className={styles.chartPlaceholder} style={{ minHeight: '900px' }}>
            <AsyncMapaIntegrado />
          </div>
        </div>
      </div>

      {/* --- LINHA 2 --- */}
      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valores por Ação Padronizada</h3>
          <div className={styles.chartPlaceholder}>
            <AsyncValoresAcao />
          </div>
        </div>

        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Quantidade de Instrumentos por Ação</h3>
          <div className={styles.chartPlaceholder}>
            <AsyncAcoesQtde />
          </div>
        </div>
      </div>

      {/* --- LINHA 3 --- */}
      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Instrumentos por Fase de Execução</h3>
          <div className={styles.chartPlaceholder}>
            <AsyncFases />
          </div>
        </div>

        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Situação da Contratação</h3>
          <div className={styles.chartPlaceholder}>
            <AsyncSituacaoContratacao />
          </div>
        </div>
      </div>

      {/* --- LINHA 4 --- */}
      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valor Global por Tipo de Instrumento</h3>
          <div className={styles.chartPlaceholder}>
            <AsyncTipoInstrumento />
          </div>
        </div>
        
        {/* Espaço vazio à direita nesta linha, ou pode ser preenchido futuramente */}
        <div className="hidden md:block"></div>
      </div>

    </div>
  )
}

function ChartStateWrapper({ isLoading, isError, children }) {
  if (isLoading) {
    return <Skeleton className="w-full h-full min-h-[300px] rounded-md bg-gray-200" />
  }
  if (isError) {
    return (
      <div className="flex w-full min-h-[300px] items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <span className="ml-3 text-sm font-medium text-red-700">
          Falha pontual.
        </span>
      </div>
    )
  }
  return children;
}

function AsyncValoresUf() {
  const { data, isLoading, isError } = useValoresUfQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <ValoresUfChart dados={data} />
    </ChartStateWrapper>
  )
}

function AsyncValoresAcao() {
  const { data, isLoading, isError } = useValoresAcaoQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <ValoresAcaoChart dados={data} />
    </ChartStateWrapper>
  )
}

function AsyncAcoesQtde() {
  const { data, isLoading, isError } = useAcoesQtdeQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <AcoesQtdeChart dados={data} />
    </ChartStateWrapper>
  )
}

function AsyncFases() {
  const { data, isLoading, isError } = useFasesQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <FasesChart dados={data} />
    </ChartStateWrapper>
  )
}

function AsyncSituacaoContratacao() {
  const { data, isLoading, isError } = useSituacaoContratacaoQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <SituacaoContratacaoChart dados={data} />
    </ChartStateWrapper>
  )
}

function AsyncTipoInstrumento() {
  const { data, isLoading, isError } = useTipoInstrumentoQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <TipoInstrumentoChart dados={data} />
    </ChartStateWrapper>
  )
}

function AsyncMapaIntegrado() {
  const queryCoropletico = useMapaCoropleticoQuery()
  const queryPontos = useMapaPontosQuery()
  const queryGeoJson = useBrasilGeoJsonQuery()

  const isLoading = queryCoropletico.isLoading || queryPontos.isLoading || queryGeoJson.isLoading
  const isError = queryCoropletico.isError || queryPontos.isError || queryGeoJson.isError

  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <MapaIntegradoChart 
        dadosCoropletico={queryCoropletico.data} 
        dadosPontos={queryPontos.data} 
        geoJson={queryGeoJson.data}
      />
    </ChartStateWrapper>
  )
}