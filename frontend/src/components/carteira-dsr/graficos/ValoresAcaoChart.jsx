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

  const categorias = dados.map((item) => item.acao_padronizada || 'Não informada')
  
  const seriesDesembolsado = dados.map((item) => Number(item.desembolsado) || 0)
  const seriesEmpenhado = dados.map((item) => Number(item.empenhado_a_desembolsar) || 0)
  const seriesAEmpenhar = dados.map((item) => Number(item.a_empenhar) || 0)
  const seriesContrapartida = dados.map((item) => Number(item.contrapartida) || 0)

  const options = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value) => formatCurrency(value, true)
    },
    legend: { bottom: '0%', type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '25%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categorias,
      axisLabel: { rotate: 0, width: 100, overflow: 'break', interval: 0 }
    },
    yAxis: { type: 'value' },
    series: [
      { name: 'Desembolsado', type: 'bar', stack: 'total', data: seriesDesembolsado, itemStyle: { color: '#10b981' } },
      { name: 'Empenhado a Desemb.', type: 'bar', stack: 'total', data: seriesEmpenhado, itemStyle: { color: '#3b82f6' } },
      { name: 'A Empenhar', type: 'bar', stack: 'total', data: seriesAEmpenhar, itemStyle: { color: '#f59e0b' } },
      { name: 'Contrapartida', type: 'bar', stack: 'total', data: seriesContrapartida, itemStyle: { color: '#6b7280' } }
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