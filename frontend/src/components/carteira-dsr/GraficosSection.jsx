import { AlertCircle, Loader2 } from "lucide-react"
import { 
  useValoresPorAcao, 
  useFasesESituacao, 
  useGeografia, 
  useAcoesETipos 
} from "@/hooks/useCarteiraDsr"
import styles from './GraficosSection.module.css'

export default function GraficosSection() {
  const {
    data: dadosAcoes,
    isLoading: loadingAcoes,
    isError: errorAcoes
  } = useValoresPorAcao()

  const {
    data: dadosExecucao,
    isLoading: loadingExecucao,
    isError: errorExecucao
  } = useFasesESituacao()

  const {
    data: dadosGeo,
    isLoading: loadingGeo,
    isError: errorGeo
  } = useGeografia()

  const {
    data: dadosAcoesETipos,
    isLoading: loadingAcoesETipos,
    isError: errorAcoesETipos
  } = useAcoesETipos()

  if (loadingAcoes || loadingExecucao || loadingGeo || loadingAcoesETipos) {
    return (
      <div className="flex w-full h-48 items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-base font-medium text-gray-500">
          A processar dados dos gráficos...
        </span>
      </div>
    )
  }

  if (errorAcoes || errorExecucao || errorGeo || errorAcoesETipos) {
    return (
      <div className="flex w-full h-32 items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <span className="ml-3 text-sm font-medium text-red-700">
          Erro ao carregar os dados de visualização. Verifique a ligação com a base de dados.
        </span>
      </div>
    )
  }

  return (
    <div className={styles.dashboardGrid}>

      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valores Proporcionais por UF</h3>
          <div className={styles.chartPlaceholder}>
            [Gráfico de Barras Empilhadas Horizontais - ECharts]
          </div>
        </div>

        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valores por UF</h3>
          <div className={styles.chartPlaceholder}>
            [Mapa Coroplético do Brasil - ECharts]
          </div>
        </div>
      </div>

      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valores por Ação Padronizada</h3>
          <div className={styles.chartPlaceholder}>
            [Gráfico de Barras Empilhadas Verticais - ECharts]
          </div>
        </div>

        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Quantidade de Instrumentos por Ação</h3>
          <div className={styles.chartPlaceholder}>
            [Gráfico de Barras Verticais Simples - ECharts]
          </div>
        </div>
      </div>

      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Instrumentos por Fase de Execução</h3>
          <div className={styles.chartPlaceholder}>
            [Gráfico de Barras Verticais - ECharts]
          </div>
        </div>

        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Situação da Contratação</h3>
          <div className={styles.chartPlaceholder}>
            [Gráfico de Rosca - ECharts]
          </div>
        </div>
      </div>

      <div className={styles.graficosRow}>
        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Localização dos Municípios Beneficiados</h3>
          <div className={styles.chartPlaceholder}>
            [Mapa de Pontos / Dispersão - ECharts]
          </div>
        </div>

        <div className={styles.graficoCard}>
          <h3 className={styles.cardTitle}>Valor Global por Tipo de Instrumento</h3>
          <div className={styles.chartPlaceholder}>
            [Gráfico de Rosca - ECharts]
          </div>
        </div>
      </div>

    </div>
  )
}