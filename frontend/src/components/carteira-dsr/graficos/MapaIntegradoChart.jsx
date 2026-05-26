import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { formatCurrency } from '@/utils/formatters'
import { useRef } from 'react'

export default function MapaIntegradoChart({ dadosCoropletico, dadosPontos, geoJson }) {
    const coropleticoAtivo = useRef(true);
    const echartsRef = useRef(null); 
    const symbolSizeRef = useRef(6);

    if (geoJson && !echarts.getMap('BR')) {
        echarts.registerMap('BR', geoJson)
    }

    if (!dadosCoropletico?.length && !dadosPontos?.length) {
        return (
            <div className="flex h-full min-h-[400px] w-full items-center justify-center text-gray-400 text-sm">
                Sem dados espaciais para os filtros selecionados
            </div>
        )
    }

    const chartDataCoropletico = (geoJson?.features || []).map((feature) => {
        const props = feature.properties;
        const siglaGeo = props.SIGLA;

        const dadoApi = (dadosCoropletico || []).find(
            (item) => item.uf && String(item.uf).trim().toUpperCase() === siglaGeo
        );

        return {
            name: siglaGeo, 
            value: dadoApi ? Number(dadoApi.valor_global_proporcional) || 0 : 0,
            qtde: dadoApi ? dadoApi.qtde_instrumentos || 0 : 0,
            nomeCompleto: props.Estado || siglaGeo,
            regiao: props.Regiao || 'N/I',
            codigoUf: props.Codigo || 'N/I'
        };
    });

    const maxValue = Math.max(...chartDataCoropletico.map(d => d.value), 1);

    const chartDataPontos = (dadosPontos || []).map((item) => ({
        name: item.nome_municipio,
        value: [
            item.longitude, 
            item.latitude, 
            item.acao_padronizada || 'Ação não informada'
        ]
    }));

    const boxStyle = "background: rgba(255, 255, 255, 0.95); border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); color: #374151;";

    const option = {
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
            roam: true,
            zoom: 1.2,
            nameProperty: 'SIGLA',
            itemStyle: {
                areaColor: '#f3f4f6',   
                borderColor: '#9ca3af',
                borderWidth: 1
            },
            emphasis: {
                itemStyle: { areaColor: '#c0dda4' },
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
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            padding: 0,
            shadowColor: 'transparent',
            
            formatter: (params) => {
                if (!params.seriesType || !params.data) return '';

                if (params.seriesType === 'map') {
                    if (!coropleticoAtivo.current) return '';

                    const { name, value, qtde, nomeCompleto, regiao, codigoUf } = params.data;
                    
                    if (value === 0 && qtde === 0) {
                        return `
                            <div style="${boxStyle} min-width: 200px;">
                                <div style="font-weight: bold; font-size: 14px; border-bottom: 2px solid #9ca3af; padding-bottom: 4px; margin-bottom: 8px;">
                                    ${nomeCompleto} (${name})
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                                    <div><span style="font-weight: 600;">Cód IBGE:</span> ${codigoUf}</div>
                                    <div><span style="font-weight: 600;">Região:</span> ${regiao}</div>
                                </div>
                                <div style="color: #ef4444; font-size: 12px; text-align: center; padding: 4px 0; font-weight: 500;">
                                    Nenhum instrumento registrado
                                </div>
                            </div>
                        `;
                    }
                    
                    return `
                        <div style="${boxStyle} min-width: 200px;">
                            <div style="font-weight: bold; font-size: 14px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; margin-bottom: 8px;">
                                ${nomeCompleto} (${name})
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                                <div><span style="font-weight: 600;">Cód IBGE:</span> ${codigoUf}</div>
                                <div><span style="font-weight: 600;">Região:</span> ${regiao}</div>
                            </div>
                            <div style="margin-bottom: 4px;">
                                <span style="color: #6b7280;">Valor Global:</span> 
                                <strong style="float: right; color: #111827;">${formatCurrency(value, true)}</strong>
                            </div>
                            <div>
                                <span style="color: #6b7280;">Instrumentos:</span> 
                                <strong style="float: right; color: #111827;">${qtde}</strong>
                            </div>
                        </div>
                    `;
                } else if (params.seriesType === 'scatter') {
                    const municipio = params.name;
                    const longitude = params.value[0];
                    const latitude = params.value[1];
                    const acao = params.value[2];
                    
                    return `
                        <div style="${boxStyle}">
                            <div style="font-weight: bold; border-bottom: 1px solid #f97316; padding-bottom: 4px; margin-bottom: 8px;">
                                ${municipio}
                            </div>
                            <div style="max-width: 250px; white-space: normal; font-size: 12px; margin-bottom: 8px;">
                                <span style="color: #6b7280;">Ação:</span> ${acao}
                            </div>
                            <div style="display: flex; gap: 12px; font-size: 11px; color: #9ca3af; border-top: 1px dashed #e5e7eb; padding-top: 6px;">
                                <div><span style="font-weight: 600; color: #6b7280;">Lat:</span> ${latitude}</div>
                                <div><span style="font-weight: 600; color: #6b7280;">Lon:</span> ${longitude}</div>
                            </div>
                        </div>
                    `;
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
                symbolSize: symbolSizeRef.current,
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

    const handleEvents = {
        legendselectchanged: (params) => {
            coropleticoAtivo.current = params.selected['Valores por UF (Coroplético)'];
        },

        georoam: (params) => {
            if (params.zoom && echartsRef.current) {
                const chart = echartsRef.current.getEchartsInstance();
                let novoTamanho = symbolSizeRef.current * params.zoom;
                novoTamanho = Math.max(3, Math.min(novoTamanho, 25));
                symbolSizeRef.current = novoTamanho;
                chart.setOption({
                    series: [
                        {},
                        { symbolSize: novoTamanho }
                    ]
                });
            }
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-grow min-h-[450px]">
                <ReactECharts
                    ref={echartsRef}
                    option={option} 
                    onEvents={handleEvents} 
                    style={{ height: '100%', width: '100%' }} 
                    notMerge={true} 
                    lazyUpdate={true} 
                />
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1 px-2 text-center md:text-left">
                <p>
                    <span className="font-semibold text-gray-600">Nota 1:</span> A variação de cores do mapa acima representa a soma do valor global dos instrumentos celebrados em cada UF, variando do azul claro (menor valor) ao azul escuro (maior valor).
                </p>
                <p>
                    <span className="font-semibold text-gray-600">Nota 2:</span> Os pontos no mapa representam apenas as sedes dos municípios beneficiados. Não se trata da localização exata das intervenções/obras.
                </p>
            </div>
        </div>
    )
}