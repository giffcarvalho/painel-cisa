import { forwardRef } from 'react'
import ReactECharts from 'echarts-for-react'

const AcoesQtdeChart = forwardRef(({ dados }, ref) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
        Nenhum dado disponível para os filtros selecionados.
      </div>
    )
  }

  const categorias = dados.map((item) => item.acao_padronizada || 'Não informada')
  const valores = dados.map((item) => item.qtde_instrumentos || 0)

  const options = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categorias,
      axisLabel: {
        rotate: 45,
        width: 120,
        overflow: 'truncate',
        hideOverlap: false
      },
      axisLine: { show: true },
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } }
    },
    series: [
      {
        name: 'Instrumentos',
        type: 'bar',
        data: valores,
        itemStyle: { color: '#2563eb' },
        label: {
          show: true,
          position: 'top'
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

AcoesQtdeChart.displayName = 'AcoesQtdeChart'
export default AcoesQtdeChart