import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton" 
import styles from './GraficosSection.module.css'


import { 
  useValoresUfQuery,
  useMapaCoropleticoQuery,
  useValoresAcaoQuery,
  useAcoesQtdeQuery,
  useFasesQuery,
  useSituacaoContratacaoQuery,
  useMapaPontosQuery,
  useTipoInstrumentoQuery
} from "@/hooks/useCarteiraDsr"


export default function GraficosSection() {
  return (
    <div className={styles.dashboardGrid}>
      
      {/* --- LINHA 1 --- */}
      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valores Proporcionais por UF</h3>
          <div className={styles.chartPlaceholder}>
            <AsyncValoresUf />
          </div>
        </div>

        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valores por UF</h3>
          <div className={styles.chartPlaceholder}>
            <AsyncMapaCoropletico />
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
          <h3 className={styles.cardTitle}>Localização dos Municípios Beneficiados</h3>
          <div className={styles.chartPlaceholder}>
            <AsyncMapaPontos />
          </div>
        </div>

        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valor Global por Tipo de Instrumento</h3>
          <div className={styles.chartPlaceholder}>
            <AsyncTipoInstrumento />
          </div>
        </div>
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
      {/* Quando você for plugar o ECharts, substitua a div abaixo pelo componente do gráfico passando 'data' */}
      <div className="flex items-center justify-center w-full h-full min-h-[300px] text-gray-500 text-sm">
        [Gráfico Barras Horizontais] (Itens: {data?.length || 0})
      </div>
    </ChartStateWrapper>
  )
}

function AsyncMapaCoropletico() {
  const { data, isLoading, isError } = useMapaCoropleticoQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <div className="flex items-center justify-center w-full h-full min-h-[300px] text-gray-500 text-sm">
        [Mapa Coroplético] (Itens: {data?.length || 0})
      </div>
    </ChartStateWrapper>
  )
}

function AsyncValoresAcao() {
  const { data, isLoading, isError } = useValoresAcaoQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <div className="flex items-center justify-center w-full h-full min-h-[300px] text-gray-500 text-sm">
        [Gráfico Barras Verticais] (Itens: {data?.length || 0})
      </div>
    </ChartStateWrapper>
  )
}

function AsyncAcoesQtde() {
  const { data, isLoading, isError } = useAcoesQtdeQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <div className="flex items-center justify-center w-full h-full min-h-[300px] text-gray-500 text-sm">
        [Gráfico Barras Simples] (Itens: {data?.length || 0})
      </div>
    </ChartStateWrapper>
  )
}

function AsyncFases() {
  const { data, isLoading, isError } = useFasesQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <div className="flex items-center justify-center w-full h-full min-h-[300px] text-gray-500 text-sm">
        [Gráfico Fases Execução] (Itens: {data?.length || 0})
      </div>
    </ChartStateWrapper>
  )
}

function AsyncSituacaoContratacao() {
  const { data, isLoading, isError } = useSituacaoContratacaoQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <div className="flex items-center justify-center w-full h-full min-h-[300px] text-gray-500 text-sm">
        [Gráfico Rosca Contratação] (Itens: {data?.length || 0})
      </div>
    </ChartStateWrapper>
  )
}

function AsyncMapaPontos() {
  const { data, isLoading, isError } = useMapaPontosQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <div className="flex items-center justify-center w-full h-full min-h-[300px] text-gray-500 text-sm">
        [Mapa Dispersão] (Itens: {data?.length || 0})
      </div>
    </ChartStateWrapper>
  )
}

function AsyncTipoInstrumento() {
  const { data, isLoading, isError } = useTipoInstrumentoQuery()
  return (
    <ChartStateWrapper isLoading={isLoading} isError={isError}>
      <div className="flex items-center justify-center w-full h-full min-h-[300px] text-gray-500 text-sm">
        [Gráfico Rosca Tipo] (Itens: {data?.length || 0})
      </div>
    </ChartStateWrapper>
  )
}