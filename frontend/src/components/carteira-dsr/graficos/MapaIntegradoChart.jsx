import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { formatCurrency } from '@/utils/formatters'
import brasilUf from '@/assets/geo/brasilUf.json'

echarts.registerMap('BR', brasilUf)

export default function MapaIntegradoChart({ dadosCoropletico, dadosPontos }) {
    if (!dadosCoropletico?.length && !dadosPontos?.length) {
        return (
            <div className="flex h-full min-h-[400px] w-full items-center justify-center text-gray-400 text-sm">
                Sem dados espaciais para os filtros selecionados
            </div>
        )
    }

    const chartDataCoropletico = (dadosCoropletico || []).map((item) => ({
        name: item.uf,
        value: Number(item.valor_global_proporcional) || 0,
        qtde: item.qtde_instrumentos || 0
    }))

    const maxValue = Math.max(...chartDataCoropletico.map(d => d.value), 1)

    const chartDataPontos = (dadosPontos || []).map((item) => ({
        name: item.nome_municipio,
        value: [
            item.longitude, 
            item.latitude, 
            item.acao_padronizada || 'Ação não informada'
        ]
    }))

    const option = {
        // O Legend cria automaticamente os "Filtros de Camada" para o usuário clicar e ligar/desligar
        legend: {
            show: true,
            orient: 'vertical',
            left: 'right',
            top: 'top',
            data: ['Valores por UF (Coroplético)', 'Municípios Beneficiados (Pontos)'],
            selectedMode: 'multiple',
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: 4,
            padding: 10
        },

        geo: {
            map: 'BR',
            roam: true, // Permite zoom e arrastar.
            zoom: 1.2, // Define o zoom ao iniciar a página
            nameProperty: 'SIGLA', // Conecta com a propriedade SIGLA do GeoJSON
            itemStyle: {
                areaColor: '#f3f4f6',
                borderColor: '#ffffff',
                borderWidth: 1
            },
            emphasis: {
                itemStyle: { areaColor: '#fcd34d' },
                label: { show: false }
            }
        },

        visualMap: {
            left: 'right',
            bottom: '5%',
            min: 0,
            max: maxValue,
            seriesIndex: 0, 
            inRange: {
                color: ['#e0f2fe', '#3b82f6', '#1e3a8a'] 
            },
            text: ['Maior Valor', 'Menor Valor'],
            calculable: true,
            formatter: (value) => formatCurrency(value, true)
        },

        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                if (params.seriesType === 'map') {
                    const { name, value, qtde } = params.data || {}
                    if (!value) return `${name}: Sem dados`
                    return `
                        <div style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 4px;">UF: ${name}</div>
                        <div>Valor: <strong>${formatCurrency(value, true)}</strong></div>
                        <div>Instrumentos: <strong>${qtde}</strong></div>
                    `
                } else if (params.seriesType === 'scatter') {
                    const municipio = params.name
                    const acao = params.value[2]
                    return `
                        <div style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 4px;">${municipio}</div>
                        <div style="max-width: 200px; white-space: normal;">Ação: ${acao}</div>
                    `
                }
            }
        },

        series: [
            {
                name: 'Valores por UF (Coroplético)',
                type: 'map',
                geoIndex: 0,
                data: chartDataCoropletico
            },
            {
                name: 'Municípios Beneficiados (Pontos)',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: chartDataPontos,
                symbolSize: 6,
                itemStyle: {
                    color: '#f97316',
                    borderColor: '#fff',
                    borderWidth: 0.5,
                    shadowBlur: 2,
                    shadowColor: 'rgba(0,0,0,0.5)'
                },
                zlevel: 1 
            }
        ]
    }

    return (
        <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%', minHeight: '450px' }} 
            notMerge={true} 
            lazyUpdate={true} 
        />
    )
}