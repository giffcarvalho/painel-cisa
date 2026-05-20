import ReactECharts from 'echarts-for-react'
import { formatCurrency } from '@/utils/formatters'

export default function ValoresUfChart({ dados }) {
    if (!dados || dados.lengh === 0) {
        return <div className="flex h-full w-full items-center justify-center text-gray-400">Sem dados para exibir</div>
    }

    const eixosY = dados.map(item => item.uf)

    const desembolsado = dados.map(item => item.desembolsado)
    const empenhadoADesembolsar = dados.map(item => item.empenhado_a_desembolsar)
    const aEmpenhar = dados.map(item => item.a_empenhar)
    const contrapartida = dados.map(item => item.contrapartida)

    const option = {
        color: ['#3b82f6', '#10b981', '#f59e0b', '#6b7280'],

        tooltip: {
            trigger: 'axis',
            axisPointer: {type: 'shadow'},
            valueFormatter: (value) => formatCurrency(value, true)
        },

        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '5%',
            containLabel: true
        },

        xAxis: {
            type: 'value',
            axisLabel: {
                formatter: (value) => formatCurrency(value, true)
            }
        },

        yAxis: {
            type: 'category',
            data: eixosY,
            inverse: true
        },

        series: [
            { name: 'Desembolsado', type: 'bar', stack: 'total', data: desembolsado },
            { name: 'Empenhado a Desembolsar', type: 'bar', stack: 'total', data: empenhadoADesembolsar },
            { name: 'A Empenhar', type: 'bar', stack: 'total', data: aEmpenhar },
            { name: 'Contrapartida', type: 'bar', stack: 'total', data: contrapartida }
        ]
    }
        return (
            <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%' }} 
            notMerge={true} 
            lazyUpdate={true} 
            />
        )
}