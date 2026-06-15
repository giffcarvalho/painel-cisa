import { forwardRef } from 'react'
import ReactECharts from 'echarts-for-react'
import { formatCurrency } from '@/utils/formatters'

const ValoresAcaoChart = forwardRef(({ dados }, ref) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
        Nenhum dado disponível.
      </div>
    )
  }

  const MILHAO = 1_000_000

  const formatValor = (valueEmMilhoes) => {
  const value = Number(valueEmMilhoes || 0)

  if (value >= 1000) {
    return `${(value / 1000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} bi`
  }

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })} mi`
}

  const categorias = dados.map((item) => item.acao_padronizada || 'Não informada')

  const seriesDesembolsadoOriginal = dados.map((item) => Number(item.desembolsado) || 0)
  const seriesEmpenhadoOriginal = dados.map((item) => Number(item.empenhado_a_desembolsar) || 0)
  const seriesAEmpenharOriginal = dados.map((item) => Number(item.a_empenhar) || 0)
  const seriesContrapartidaOriginal = dados.map((item) => Number(item.contrapartida) || 0)

  const totaisOriginais = dados.map((_, index) => (
    seriesDesembolsadoOriginal[index]
    + seriesEmpenhadoOriginal[index]
    + seriesAEmpenharOriginal[index]
    + seriesContrapartidaOriginal[index]
  ))

  const seriesDesembolsado = seriesDesembolsadoOriginal.map((value) => value / MILHAO)
  const seriesEmpenhado = seriesEmpenhadoOriginal.map((value) => value / MILHAO)
  const seriesAEmpenhar = seriesAEmpenharOriginal.map((value) => value / MILHAO)
  const seriesContrapartida = seriesContrapartidaOriginal.map((value) => value / MILHAO)
  const totaisMilhoes = totaisOriginais.map((value) => value / MILHAO)

  const options = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const dataIndex = params[0]?.dataIndex
        const total = totaisOriginais[dataIndex] || 0

        const linhas = params.map((param) => {
          const valorOriginal = Number(param.value || 0) * MILHAO
          return `
            <div>
              ${param.marker} ${param.seriesName}: 
              <strong>${formatCurrency(valorOriginal, true)}</strong>
            </div>
          `
        }).join('')

        return `
          ${params[0]?.axisValue || ''}
          ${linhas}
          <div style="margin-top: 6px; border-top: 1px solid #e5e7eb; padding-top: 6px;">
            <strong>Total: ${formatCurrency(total, true)}</strong>
          </div>
        `
      }
    },
    legend: { bottom: '0%', type: 'scroll' },
    grid: { left: '3%', right: '6%', bottom: '25%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categorias,
      axisLabel: { rotate: 0, width: 100, overflow: 'break', interval: 0 }
    },
    yAxis: {
      type: 'value',
      name: 'R$',
      axisLabel: {
        formatter: (value) => formatValor(value)
      }
    },
    series: [
      {
        name: 'Desembolsado',
        type: 'bar',
        stack: 'total',
        data: seriesDesembolsado,
        itemStyle: { color: '#10b981' }
      },
      {
        name: 'Empenhado a Desemb.',
        type: 'bar',
        stack: 'total',
        data: seriesEmpenhado,
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: 'A Empenhar',
        type: 'bar',
        stack: 'total',
        data: seriesAEmpenhar,
        itemStyle: { color: '#f59e0b' }
      },
      {
        name: 'Contrapartida',
        type: 'bar',
        stack: 'total',
        data: seriesContrapartida,
        itemStyle: { color: '#6b7280' },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => formatValor(totaisMilhoes[params.dataIndex]),
          fontSize: 12,
          fontWeight: 'normal',
          color: '#4b5563',
          distance: 6
        }
      }
    ]
  }

  return (
    <ReactECharts
      ref={ref}
      option={options}
      style={{ height: '100%', width: '100%', minHeight: '300px' }}
      notMerge={true}
    />
  )
})

ValoresAcaoChart.displayName = 'ValoresAcaoChart'

export default ValoresAcaoChart