import { forwardRef } from 'react'
import ReactECharts from 'echarts-for-react'
import { formatCurrency } from '@/utils/formatters'

// Tooltips do ECharts aceitam HTML; escapa rótulos vindos da API antes de
// interpolá-los para impedir que conteúdo de dados vire marcação executável.
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
})[character])

const TipoInstrumentoChart = forwardRef(({ dados }, ref) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
        Nenhum dado disponível.
      </div>
    )
  }

  const dataSeries = dados.map((item) => ({
    name: item.tipo_instrumento || 'Não informado',
    value: Number(item.valor_global) || 0,
    quantidadeInstrumentos: Number(item.quantidade_instrumentos) || 0
  }))

  const options = {
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value, data, marker }) => [
        `${marker}${escapeHtml(name)}`,
        `Valor Global: ${formatCurrency(value, true)}`,
        `Quantidade de instrumentos: ${data.quantidadeInstrumentos.toLocaleString('pt-BR')}`
      ].join('<br/>')
    },
    legend: {
      bottom: '0%',
      left: 'center',
      icon: 'circle'
    },
    series: [
      {
        name: 'Valor Global',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
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

TipoInstrumentoChart.displayName = 'TipoInstrumentoChart'
export default TipoInstrumentoChart
