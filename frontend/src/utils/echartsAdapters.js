import { formatCurrency } from './formatters'



// ─── Rosca por Tipo de Instrumento (endpoint /graficos/tipo-instrumento) ──────
export function adaptTipoToECharts(data = []) {
  return {
    tooltip: { 
      trigger: 'item', 
      formatter: (params) => {
        return `${params.name}<br/>${params.marker} ${formatCurrency(params.value, true)} (${params.percent}%)`
      }
    },
    legend: { orient: 'vertical', left: 'right' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      data: data.map((d) => ({ name: d.tipo_instrumento, value: d.valor_global })),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  }
}