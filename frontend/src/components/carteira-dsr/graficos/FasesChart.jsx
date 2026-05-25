import ReactECharts from 'echarts-for-react'

export default function FasesChart({ dados }) {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
        Nenhum dado disponível.
      </div>
    )
  }

  const categorias = dados.map((item) => item.fase_instrumento || 'Não informada').reverse()
  const valores = dados.map((item) => item.qtde_instrumentos || 0).reverse()

  const options = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { type: 'category', data: categorias, axisLabel: { width: 140, overflow: 'truncate' } },
    series: [
      {
        name: 'Quantidade',
        type: 'bar',
        data: valores,
        itemStyle: { color: '#6366f1' },
        label: { show: true, position: 'right' }
      }
    ]
  }

  return <ReactECharts option={options} style={{ height: '100%', width: '100%', minHeight: '300px' }} notMerge={true} />
}