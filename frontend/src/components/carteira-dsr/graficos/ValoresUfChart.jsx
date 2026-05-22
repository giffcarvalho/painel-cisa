import ReactECharts from 'echarts-for-react'
import { formatCurrency } from '@/utils/formatters'

export default function ValoresUfChart({ dados }) {
    if (!dados || dados.length === 0) {
        return (
            <div className="flex h-full min-h-[300px] w-full items-center justify-center text-gray-400 text-sm">
                Sem dados para os filtros selecionados
            </div>
        )
    }
    const parseNumber = (val) => {
        const number = Number(val)
        return Number.isFinite(number) ? number : 0
    }

    const eixosY = dados.map(item => item.uf || 'N/I') 
    const desembolsado = dados.map(item => parseNumber(item.desembolsado))
    const empenhadoADesembolsar = dados.map(item => parseNumber(item.empenhado_a_desembolsar))
    const aEmpenhar = dados.map(item => parseNumber(item.a_empenhar))
    const contrapartida = dados.map(item => parseNumber(item.contrapartida))

    const option = {
        color: ['#3b82f6', '#10b981', '#f59e0b', '#6b7280'],

        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            valueFormatter: (value) => value ? formatCurrency(value, true) : formatCurrency(0, true)
        },

        legend: {
            data:['Desembolsado', 'Empenhado a Desembolsar', 'A Empenhar', 'Contrapartida'],
            bottom: 0,
            icon: 'circle',
            textStyle: {fontSize: 12, color: '#4b5563'}
        },

        grid: {
            left: '3%',
            right: '4%',
            bottom: '5%',
            top: '5%',
            containLabel: true
        },

        xAxis: {
            type: 'value',
            axisLabel: {
                formatter: (value) => value ? formatCurrency(value, true) : '0'
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
            style={{ height: '100%', width: '100%', minHeight: '300px' }} 
            notMerge={true} 
            lazyUpdate={true} 
        />
    )
}