import { forwardRef } from 'react'
import ReactECharts from 'echarts-for-react'

const SituacaoContratacaoChart = forwardRef(({ dados }, ref) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
        Nenhum dado disponível.
      </div>
    )
  }

  const dataSeries = dados.map((item) => ({
    name: item.situacao_contratacao || 'Não informada',
    value: item.qtde_instrumentos || 0
  }))

  const options = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', type: 'scroll' },
    series: [
      {
        name: 'Situação',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: dataSeries
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

SituacaoContratacaoChart.displayName = 'SituacaoContratacaoChart'
export default SituacaoContratacaoChart