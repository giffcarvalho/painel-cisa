import { formatCurrency } from './formatters'

// ─── Barras Empilhadas por UF (endpoint /graficos/localidade) ────────────────
export function adaptLocalidadeToECharts(data = []) {
  return {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      valueFormatter: (value) => formatCurrency(value, true)
    },
    legend: { data: ['Desembolsado', 'Empenhado a Desembolsar', 'A Empenhar', 'Contrapartida'] },
    grid: { left: 60, right: 20, bottom: 20, top: 50 },
    xAxis: { 
      type: 'value', 
      axisLabel: { formatter: (v) => formatCurrency(v, true) }
    },
    yAxis: { type: 'category', data: data.map((d) => d.uf) },
    series: [
      { name: 'Desembolsado',            type: 'bar', stack: 'total', data: data.map((d) => d.desembolsado),            itemStyle: { color: 'var(--chart-desembolsado)' } },
      { name: 'Empenhado a Desembolsar', type: 'bar', stack: 'total', data: data.map((d) => d.empenhado_a_desembolsar), itemStyle: { color: 'var(--chart-empenhado)' } },
      { name: 'A Empenhar',              type: 'bar', stack: 'total', data: data.map((d) => d.a_empenhar),              itemStyle: { color: 'var(--chart-a-empenhar)' } },
      { name: 'Contrapartida',           type: 'bar', stack: 'total', data: data.map((d) => d.contrapartida),           itemStyle: { color: 'var(--chart-contrapartida)' } },
    ],
  }
}

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