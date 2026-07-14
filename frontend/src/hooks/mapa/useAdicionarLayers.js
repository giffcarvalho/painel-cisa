import { useEffect } from "react";
import { 
    urlDistritos2022,
    urlEnderecos2022,
    urlCidades,
    urlLocalidades2022,
    urlMunicipios2022,
    urlSetoresCensitarios2022,
    urlUfs,
    urlGeometriasCarteiraDsr,
    urlGeometriasCarteiraDrf,
} from "@/api/mapa";
import { gerarMatch } from "../../utils/mapaUtils";



//esse hook faz a adição inicial das sources e layers ao mapa básico
//ele não altera as sources e layer depois. Faz apenas a criação inicial

export function useAdicionarLayers(mapRef, layers, filtros) {
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        //adição das camadas. O primeiro bloco são as fontes (sources). O segundo bloco são as camadas (layers) já com a simbologia desejada
        //a ordem dos addLayers no código influencia na ordem de renderização. Os últimos layers ficam por cima no mapa
        //as urls estão definidas em @/api/mapa dentro de funções, as quais são chamadas dentro de tiles: []. Essas funções pegam o conteúdo de filtros e transformam em url params
        map.on("load", () => {
            map.addSource("setores_censitarios_2022", {type: "vector", tiles: [urlSetoresCensitarios2022(filtros)], minzoom: 8, maxzoom: 20});
            map.addSource("distritos_2022", {type: "vector", tiles: [urlDistritos2022(filtros)], minzoom: 7, maxzoom: 20});
            map.addSource("municipios_2022", {type: "vector", tiles: [urlMunicipios2022(filtros)], minzoom: 3, maxzoom: 20});
            map.addSource("cidades", {type: "vector", tiles: [urlCidades(filtros)], minzoom: 8, maxzoom: 20});
            map.addSource("ufs", {type: "vector", tiles: [urlUfs(filtros)], minzoom: 3, maxzoom: 20});
            map.addSource("enderecos_2022", {type: "vector", tiles: [urlEnderecos2022(filtros)], minzoom: 13, maxzoom: 20});
            map.addSource("localidades_2022", {type: "vector", tiles: [urlLocalidades2022(filtros)], minzoom: 9, maxzoom: 20});
            map.addSource("geometrias_carteira_dsr", {type: "vector", tiles: [urlGeometriasCarteiraDsr(filtros)], minzoom: 3, maxzoom: 20});
            map.addSource("geometrias_carteira_drf", {type: "vector", tiles: [urlGeometriasCarteiraDrf(filtros)], minzoom: 3, maxzoom: 20});


            
            map.addLayer({
                id: "setores_censitarios_2022_fill",
                type: "fill",
                source: "setores_censitarios_2022", "source-layer": "poligonos",
                paint: {
                "fill-color": "#000000",
                "fill-opacity": 0
                }
            });


                        
            const informacoes_municipais = layers.find(l => l.id === "informacoes_municipais");
            map.addLayer({
                id: "informacoes_municipais",
                type: "fill",
                source: "municipios_2022", "source-layer": "poligonos",
                layout:{visibility: informacoes_municipais?.visivel? "visible": "none"},
                minzoom: informacoes_municipais?.minzoom,
                paint: {
                "fill-color": "#e7e1e1",
                "fill-opacity": 0.8
                }
            });
            
            
            const informacoes_setores_censitarios = layers.find(l => l.id === "informacoes_setores_censitarios");
            map.addLayer({
                id: "informacoes_setores_censitarios",
                type: "fill",
                source: "setores_censitarios_2022", "source-layer": "poligonos",
                layout:{visibility: informacoes_setores_censitarios?.visivel? "visible": "none"},
                minzoom: informacoes_setores_censitarios?.minzoom,
                paint: {
                "fill-color": "#e7e1e1",
                "fill-opacity": 0.8
                }
            });


            const setores = layers.find(l => l.id === "setores_censitarios_2022");
            map.addLayer({
                id: "setores_censitarios_2022",
                type: "line",
                source: "setores_censitarios_2022", "source-layer": "poligonos",
                layout:{visibility: setores?.visivel? "visible": "none"},
                minzoom: setores?.minzoom,
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 9.5, 0.5, 10.0, 1.0, 11.0, 2.5, 11.5, 4.0],
                    "line-color": gerarMatch(setores?.simbologia, "cor", "#e9e9e9"),
                    "line-dasharray": [1, 1]
                }
            });

            
            const distritos = layers.find(l => l.id === "distritos_2022");
            map.addLayer({
                id: "distritos_2022",
                type: "line",
                source: "distritos_2022", "source-layer": "poligonos",
                layout:{visibility: distritos?.visivel? "visible": "none"},
                minzoom: distritos?.minzoom,
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 7.5, 0.5, 8.0, 1.0, 9.0, 1.5, 10.0, 3.0],
                    "line-color": distritos.simbologia?.cor
                }
            });

            const municipios = layers.find(l => l.id === "municipios_2022");
            map.addLayer({
                id: "municipios_2022",
                type: "line",
                source: "municipios_2022", "source-layer": "poligonos",
                minzoom: municipios?.minzoom,
                layout:{visibility: municipios?.visivel? "visible": "none"},
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 6.0, 0.3, 7.0, 1.0, 8.0, 2.0, 9.0, 3.0, 10.0, 4.0, 11.0, 4.5],
                    "line-color": municipios.simbologia?.cor
                }
            });

            const ufs = layers.find(l => l.id === "ufs");
            map.addLayer({
                id: "ufs",
                type: "line",
                source: "ufs", "source-layer": "poligonos",
                layout:{visibility: ufs?.visivel? "visible": "none"},
                minzoom:ufs?.minzoom,
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 3.0, 1.0, 5.0, 2.0, 6.0, 3.0, 7.0, 4.0, 8.0, 6.0, 9.0, 7.0, 10.0, 10.0],
                    "line-color": ufs.simbologia?.cor
                }
            });

            const enderecos = layers.find(l => l.id === "enderecos_2022");
            map.addLayer({
                id: "enderecos_2022",
                type: "circle",
                source: "enderecos_2022", "source-layer": "pontos",
                layout:{visibility: enderecos?.visivel? "visible": "none"},
                minzoom:enderecos?.minzoom,
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 13.0, 2.0, 13.5, 3.5, 14.0, 4.0, 15.0, 5.0],
                    "circle-color": gerarMatch(enderecos?.simbologia, "cor", "#000000")
                }
            });

            const localidades = layers.find(l => l.id === "localidades_2022");
            map.addLayer({
                id: "localidades_2022",
                type: "circle",
                source: "localidades_2022", "source-layer": "pontos",
                layout:{visibility: localidades?.visivel? "visible": "none"},
                minzoom:localidades?.minzoom,
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 9, 4, 10, 5, 11, 6, 12, 7],
                    "circle-color": gerarMatch(localidades?.simbologia, "cor", "#000000"),
                    "circle-stroke-color": gerarMatch(localidades?.simbologia, "strokeColor", "#000000"),
                    "circle-stroke-width": gerarMatch(localidades?.simbologia, "strokeWidth", 0),
                }
            });


            map.addLayer({
                id: "localidades_2022_labels",
                type: "symbol",
                source: "localidades_2022", "source-layer": "pontos",
                minzoom: 10,
                layout: {visibility: layers.find(l=>l.id==="localidades_2022")?.visivel? "visible": "none",
                    "text-field": ["get", "nome_localidade"],
                    "text-size": ["interpolate", ["linear"], ["zoom"], 9, 9, 10, 10, 11, 11, 12, 12 ],
                    "text-offset": [0, 1.2],
                    "text-anchor": "top",
                    "text-allow-overlap": false,
                    "text-font": ["Open Sans Regular"]
                },
                paint: {
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 1.5
                }
            });

            const cidades = layers.find(l => l.id === "cidades");
            map.addLayer({
                id: "cidades",
                type: "circle",
                source: "cidades", "source-layer": "pontos",
                layout:{visibility: cidades?.visivel? "visible": "none"},
                minzoom: cidades?.minzoom,
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 8.0, 3.0, 9.0, 4.0, 10.0, 5.0, 11.0, 6.0],
                    "circle-color": cidades?.simbologia?.cor,
                    "circle-stroke-width": cidades?.simbologia?.strokeWidth,
                    "circle-stroke-color": cidades?.simbologia?.strokeColor,
                }
            });


            map.addLayer({
                id: "cidades_labels",
                type: "symbol",
                source: "cidades", "source-layer": "pontos",
                minzoom: 8,
                layout: {visibility: layers.find(l=>l.id==="cidades")?.visivel? "visible": "none",
                    "text-field": ["get", "nome"],
                    "text-size": ["interpolate", ["linear"], ["zoom"], 7, 10, 8, 11, 9, 12],
                    "text-offset": [0, 1.2],
                    "text-anchor": "top",
                    "text-allow-overlap": false,
                    "text-font": ["Open Sans Regular"]
                },
                paint: {
                    "text-color": "#ffffff",
                    "text-halo-color": "#000000",
                    "text-halo-width": 1.5
                }
            });

            const carteira = layers.find(l => l.id === "geometrias_carteira_dsr");
            map.addLayer({
                id: "geometrias_carteira_dsr",
                type: "circle",
                source: "geometrias_carteira_dsr", "source-layer": "pontos",
                layout:{visibility: carteira?.visivel? "visible": "none"},
                minzoom: carteira?.minzoom,
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 4.0, 2.0, 5.0, 3.0, 6.0, 4.0, 7.0, 5.0, 8.0, 6.0],
                    "circle-color": gerarMatch(carteira?.simbologia, "cor", "#000000"),
                    "circle-stroke-color": [
                        "case",
                        ["boolean", ["feature-state", "selected"], false],
                        "#ffff00",
                        gerarMatch(carteira?.simbologia, "strokeColor", "#000000")
                    ],
                    "circle-stroke-width": [
                        "case", 
                        ["boolean", ["feature-state", "selected"], false],
                        ["+", gerarMatch(carteira?.simbologia, "strokeWidth", 0), 3],
                        gerarMatch(carteira?.simbologia, "strokeWidth", 0)
                    ]
                }
            });

            const carteira_drf = layers.find(l => l.id === "geometrias_carteira_drf");
            map.addLayer({
                id: "geometrias_carteira_drf",
                type: "circle",
                source: "geometrias_carteira_drf", "source-layer": "pontos",
                layout:{visibility: carteira_drf?.visivel? "visible": "none"},
                minzoom: carteira_drf?.minzoom,
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 4.0, 2.0, 5.0, 3.0, 6.0, 4.0, 7.0, 5.0, 8.0, 6.0],
                    "circle-color": gerarMatch(carteira_drf?.simbologia, "cor", "#000000"),
                    "circle-stroke-color": gerarMatch(carteira_drf?.simbologia, "strokeColor", "#000000"),
                    "circle-stroke-width": gerarMatch(carteira_drf?.simbologia, "strokeWidth", 0),
                }
            });
        })
    }, [])
}