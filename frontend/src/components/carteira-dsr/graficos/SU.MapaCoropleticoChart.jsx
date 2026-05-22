/*import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { formatCurrency } from '@/utils/formatters'
import brasilUf from '@/assets/geo/brasilUf.json'

echarts.registerMap('BR', brasilUf)

const NOME_ESTADOS = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
}

export default function MapaCoropleticoChart({ dados }) {
    if (!dados || dados.length === 0) {
        return (
            <div className="flex h-full min-h-[300px] w-full items-center justify-center text-gray-400 text-sm">
                Sem dados para os filtros selecionados
            </div>
        )
    }

    const chartData = dados.map((item) => ({
        name: item.uf,
        value: Number(item.valor_global_proporcional) || 0,
        qtde: item.qtde_instrumentos || 0
    }))

    const maxValue = Math.max(...chartData.map(d => d.value), 1)

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                if (!params.data) return `${params.name}: Sem dados`
                
                const { name, value, sigla, qtde } = params.data
                const valorFormatado = value ? formatCurrency(value, true) : formatCurrency(0, true)
                
                return `
                    <div style="font-weight: bold; margin-bottom: 4px;">${name} (${sigla})</div>
                    <div>Valor Proporcional: <strong>${valorFormatado}</strong></div>
                    <div>Instrumentos: <strong>${qtde}</strong></div>
                `
            }
        },
        visualMap: {
            left: 'right',
            top: 'bottom',
            min: 0,
            max: maxValue,
            inRange: {
                color: ['#e0f2fe', '#3b82f6', '#1e3a8a'] 
            },
            text: ['Maior', 'Menor'],
            calculable: true,
            formatter: (value) => formatCurrency(value, true) // Formata a legenda
        },
        series: [
            {
                name: 'Valor Proporcional por UF',
                type: 'map',
                map: 'BR',
                roam: true,
                nameProperty: 'SIGLA', 
                scaleLimit: { min: 1, max: 4 },
                itemStyle: {
                    borderColor: '#ffffff',
                    borderWidth: 1
                },
                emphasis: {
                    label: { show: true },
                    itemStyle: {
                        areaColor: '#f59e0b'
                    }
                },
                data: chartData
            }
        ]
    }
    return (
        <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%', minHeight: '350px' }} 
            notMerge={true} 
            lazyUpdate={true} 
        />
    )
}*/