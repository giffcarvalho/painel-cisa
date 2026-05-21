import { Loader2, AlertCircle } from 'lucide-react'
import { useKpisQuery } from '@/hooks/useCarteiraDsr'
import { formatCurrency } from '@/utils/formatters'

const formatInteger = (value) => {
  const number = Number(value)
  return new Intl.NumberFormat('pt-BR').format(Number.isFinite(number) ? number : 0)
}

export default function KpisSection() {
  const { data: kpis, isLoading, isError } = useKpisQuery()

  if (isLoading) {
    return (
      <div className="flex w-full h-24 items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-3 text-sm font-medium text-gray-500">
          Processando indicadores da carteira...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex w-full h-24 items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <span className="ml-3 text-sm font-medium text-red-700">
          Falha ao carregar os indicadores.
        </span>
      </div>
    )
  }

  if (!kpis) {
    return <div>Nenhum dado encontrado.</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      <KpiCard titulo="Instrumentos" valor={formatInteger(kpis.qtde_instrumentos)} />
      <KpiCard titulo="Municípios" valor={formatInteger(kpis.qtde_municipios_beneficiados)} />
      <KpiCard titulo="Valor Global" valor={formatCurrency(kpis.valor_global, true)} />
      <KpiCard titulo="Repasse" valor={formatCurrency(kpis.valor_repasse, true)} />
      <KpiCard titulo="Contrapartida" valor={formatCurrency(kpis.valor_contrapartida, true)} />
      <KpiCard titulo="Empenhado" valor={formatCurrency(kpis.valor_empenhado, true)} />
      <KpiCard titulo="Desembolsado" valor={formatCurrency(kpis.valor_desembolsado, true)} />
      <KpiCard titulo="Desbloqueado" valor={formatCurrency(kpis.valor_desbloqueado, true)} />
    </div>
  )
}

function KpiCard({ titulo, valor }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-[11px] text-gray-500 font-bold tracking-wider uppercase text-center mb-1">
        {titulo}
      </h3>
      <span className="text-xl font-bold text-gray-800">
        {valor}
      </span>
    </div>
  )
}