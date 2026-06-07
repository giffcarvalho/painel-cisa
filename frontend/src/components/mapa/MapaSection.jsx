import estilos from "./MapaSection.module.css";
import { useEffect, useRef, useState, useContext } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers } from "lucide-react";
import CamadasSection from "./CamadasSection";
import { FiltrosContext } from "../../context/mapa/filtrosContext";
import FiltroPainel from "./FiltroPainel";
import { 
    urlBboxUfs,
    urlDistritos2022,
    urlEnderecos2022,
    urlLocalidades2022,
    urlMunicipios2022,
    urlMunicipios2025,
    urlSetoresCensitarios2022,
    urlUfs,
    urlBboxMunicipios,
    urlGeometriasCarteiraDsr,
    urlBboxCarteiraDsr,
    urlBboxLocalidades,
    urlBboxEnderecos,
    urlBboxCategoriasMetropolitanas,
} from "@/api/mapa";



export default function MapaSection() { 
    
    //este estado controla a visibilidade e variaveis das camadas
    const [layers, setLayers] = useState([
        { id: "ufs", nome: "Limites Estaduais", visivel: true },
        { id: "municipios_2022", nome: "Limites Municipais 2022", visivel: true },
        { id: "distritos_2022", nome: "Distritos 2022", visivel: true },
        { id: "setores_censitarios_2022", nome: "Setores Censitários 2022", visivel: true },
        { id: "enderecos_2022", nome: "Endereços 2022", visivel: true },
        { id: "localidades_2022", nome: "Localidades 2022", visivel: true },
        { id: "geometrias_carteira_dsr", nome: "Carteira DSR", visivel: false },
        { id: "informacoes_municipais", 
            nome: "Informações Municipais",
            visivel: false,
            variavelSel: "",
            variaveis: [
                {value: "deficit_agua_rural_ibge", label: "Déficit água rural", tipo: "percentual_invertido"},
                {value: "deficit_esgoto_rural_ibge", label: "Déficit esgoto rural", tipo: "percentual_invertido"},
                {value: "deficit_residuo_rural_ibge", label: "Déficit resíduos rural", tipo: "percentual_invertido"},
                {value: "deficit_banheiro_rural_ibge", label: "Déficit banheiro rural", tipo: "percentual_invertido"},
                {value: "deficit_agua_urbana_ibge", label: "Déficit água urbano", tipo: "percentual_invertido"},
                {value: "deficit_esgoto_urbana_ibge", label: "Déficit esgoto urbano", tipo: "percentual_invertido"},
                {value: "deficit_residuo_urbana_ibge", label: "Déficit resíduos urbano", tipo: "percentual_invertido"},
                {value: "deficit_banheiro_urbana_ibge", label: "Déficit banheiro urbano", tipo: "percentual_invertido"},
                {value: "subgrupo", label: "Subgrupo PAC", tipo: "categorica"},
                {value: "tipo_catmetropol", label: "Categoria Metropolitana", tipo: "categorica"},
            ]
        },
        
    ]);
    
    //estes estados controlam a abertura dos paineis
    const [painelCamadas, setPainelCamadas] = useState(false);
    const [painelFiltros, setPainelFiltros] = useState(false);
    

    const {filtros} = useContext(FiltrosContext)


    const API_URL = "http://localhost:8000/api/v1/mapa";
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    
    //useEffect de criação do mapa. As camadas adicionadas devem ficar dentro dele
    useEffect(() => {
        if (mapRef.current) return;

        //criação do mapa básico com a imagem de fundo e labels básicas
        const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
            version: 8,
            sources: {
            satellite: {type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "Esri"},
            //labels: {type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"], tileSize: 256},
            },
            layers: [
            {id: "satellite", type: "raster", source: "satellite"},
            //{id: "labels", type: "raster", source: "labels"}
            ]
        },
        center: [-47.9, -15.8], //centraliza o mapa nessas coordenadas ao carregar
        zoom: 3                 //define o nível de zoom ao carregar 
        });


        //adição das camadas. O primeiro bloco são as fontes (sources). O segundo bloco são as camadas (layers) já com a simbologia desejada
        //a ordem dos addLayers no código influencia na ordem de renderização. Os últimos layers ficam por cima no mapa
        //as urls estão definidas em @/api/mapa dentro de funções, as quais são chamadas dentro de tiles: []. Essas funções pegam o conteúdo de filtros e transformam em url params
        map.on("load", () => {
            map.addSource("setores_censitarios_2022", {type: "vector", tiles: [urlSetoresCensitarios2022(filtros)], minzoom: 8, maxzoom: 20});
            map.addSource("distritos_2022", {type: "vector", tiles: [urlDistritos2022(filtros)], minzoom: 7, maxzoom: 20});
            map.addSource("municipios_2025", {type: "vector", tiles: [urlMunicipios2025(filtros)], minzoom: 5, maxzoom: 20});
            map.addSource("municipios_2022", {type: "vector", tiles: [urlMunicipios2022(filtros)], minzoom: 3, maxzoom: 20});
            map.addSource("ufs", {type: "vector", tiles: [urlUfs(filtros)], minzoom: 3, maxzoom: 20});
            map.addSource("enderecos_2022", {type: "vector", tiles: [urlEnderecos2022(filtros)], minzoom: 12, maxzoom: 20});
            map.addSource("localidades_2022", {type: "vector", tiles: [urlLocalidades2022(filtros)], minzoom: 8, maxzoom: 20});
            map.addSource("geometrias_carteira_dsr", {type: "vector", tiles: [urlGeometriasCarteiraDsr(filtros)], minzoom: 3, maxzoom: 20});


            
            map.addLayer({
                id: "setores_censitarios_2022_fill",
                type: "fill",
                source: "setores_censitarios_2022", "source-layer": "poligonos",
                paint: {
                "fill-color": "#000000",
                "fill-opacity": 0
                }
            });


            map.addLayer({
                id: "informacoes_municipais",
                type: "fill",
                source: "municipios_2022", "source-layer": "poligonos",
                layout:{visibility: layers.find(l=>l.id==="informacoes_municipais")?.visivel? "visible": "none"},
                layout: {visibility: "none"},
                paint: {
                "fill-color": "#e7e1e1",
                "fill-opacity": 0.8
                }
            });



            map.addLayer({
                id: "setores_censitarios_2022",
                type: "line",
                source: "setores_censitarios_2022", "source-layer": "poligonos",
                layout:{visibility: layers.find(l=>l.id==="setores_censitarios_2022")?.visivel? "visible": "none"},
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 9.5, 0.5, 10.0, 1.0, 11.0, 2.5, 11.5, 4.0],
                    "line-color": ["step", ["get", "cod_sit"], "#e9e9e9", 1, "#ff1e00", 2, "#f87f6f", 3, "#3b0303", 5, "#fdff74", 6, "#b8905c", 7, "#365809", 8, "#a6ca03", 9, "#3067ff"],
                    "line-dasharray": [1, 1]
                }
            });
            

            map.addLayer({
                id: "distritos_2022",
                type: "line",
                source: "distritos_2022", "source-layer": "poligonos",
                layout:{visibility: layers.find(l=>l.id==="distritos_2022")?.visivel? "visible": "none"},
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 7.5, 0.5, 8.0, 1.0, 9.0, 1.5, 10.0, 3.0],
                    "line-color": "#d51bfa"
                }
            });


            map.addLayer({
                id: "municipios_2022",
                type: "line",
                source: "municipios_2022", "source-layer": "poligonos",
                minzoom: 6,
                layout:{visibility: layers.find(l=>l.id==="municipios_2022")?.visivel? "visible": "none"},
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 6.0, 0.3, 7.0, 1.0, 8.0, 2.0, 9.0, 3.0, 10.0, 4.0, 11.0, 4.5],
                    "line-color": "#f3f3f3"
                }
            });

            
            map.addLayer({
                id: "ufs",
                type: "line",
                source: "ufs", "source-layer": "poligonos",
                layout:{visibility: layers.find(l=>l.id==="ufs")?.visivel? "visible": "none"},
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 3.0, 1.0, 5.0, 2.0, 6.0, 3.0, 7.0, 4.0, 8.0, 6.0, 9.0, 7.0, 10.0, 10.0],
                    "line-color": "#c9c9c9"
                }
            });

            
            map.addLayer({
                id: "enderecos_2022",
                type: "circle",
                source: "enderecos_2022", "source-layer": "pontos",
                layout:{visibility: layers.find(l=>l.id==="enderecos_2022")?.visivel? "visible": "none"},
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 12.0, 2.0, 12.5, 2.5, 13.0, 3.0, 14.0, 5.0],
                    "circle-color": ["step", ["get", "cod_especie"], "#e9e9e9",
                        1, "#02d3b7", //Domicilio particular
                        2, "#007566", //Domicilio coletivo
                        3, "#46ff93", //Estabelecimento agropecuario
                        5, "#fdff74", //Estabelecimento de ensino
                        6, "#b8905c", //Estabelecimento de saude
                        7, "#1034ff", //Estabelecimento de outras finalidades
                        8, "#9e9e9e", //Edificação em construção ou reforma
                        9, "#ff3164"  //Estabelecimento religioso
                    ],
                }
            });

            map.addLayer({
                id: "localidades_2022",
                type: "circle",
                source: "localidades_2022", "source-layer": "pontos",
                layout:{visibility: layers.find(l=>l.id==="localidades_2022")?.visivel? "visible": "none"},
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 8.5, 3.0, 9.0, 3.5, 9.5, 4.0, 10.0, 5.0, 11.0, 6.0, 12.0, 8.0],
                    "circle-color": ["match", ["get", "categoria_localidade"], 
                        "Vila", "#9608b3",
                        "Povoado", "#fdff74",
                        "Lugarejo", "#365809",
                        "Núcleo Rural","#b8905c",
                        "Localidade Indígena","#880925",
                        "Localidade Quilombola","#442d2f",
                        "#e9e9e9"]
                }
            });


            map.addLayer({
                id: "geometrias_carteira_dsr",
                type: "circle",
                source: "geometrias_carteira_dsr", "source-layer": "pontos",
                layout:{visibility: layers.find(l=>l.id==="geometrias_carteira_dsr")?.visivel? "visible": "none"},
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 4.0, 2.0, 5.0, 3.0, 6.0, 4.0, 7.0, 5.0, 8.0, 6.0],
                    "circle-color": "#1d2cfd",
                    "circle-stroke-width": 1.5,
                    "circle-stroke-color": "#ffffff"
                }
            });


        })

        mapRef.current = map;

    }, []);
    
    

    //useEffect que faz o mapa fazer o fly até a feição filtrada
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        
        async function aplicarZoom() {
            
            if (!filtros.cod_uf && !filtros.cod_municipio && !filtros.nr_proposta && !filtros.nr_instrumento && !filtros.cod_localidade && !filtros.cod_dsc_localidade && !filtros.cod_catmetropol) {
                map.flyTo({ center: [-47.9, -15.8], zoom: 3 });
                return;
            }

            if (filtros.nr_proposta || filtros.nr_instrumento) {
                const res = await fetch(urlBboxCarteiraDsr({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, nr_proposta: filtros.nr_proposta, nr_instrumento: filtros.nr_instrumento}));
                const { xmin, ymin, xmax, ymax } = await res.json();
                                
                if (xmin == null) 
                    return

                if (xmin === xmax && ymin === ymax) {
                    map.flyTo({center:[xmin,ymin], zoom:11})
                    return
                }

                map.fitBounds([[xmin,ymin],[xmax,ymax]], {padding:40, maxZoom:11})
                
                return
                
            }


            if (filtros.cod_dsc_localidade) {
                const res = await fetch(urlBboxEnderecos({cod_uf:filtros.cod_uf, cod_municipio:filtros.cod_municipio, cod_dsc_localidade:filtros.cod_dsc_localidade}));
                const { xmin, ymin, xmax, ymax } = await res.json();
                                
                if (xmin == null) 
                    return

                if (xmin === xmax && ymin === ymax) {
                    map.flyTo({center:[xmin,ymin], zoom:14})
                    return
                }

                map.fitBounds([[xmin,ymin],[xmax,ymax]], {padding:40, maxZoom:14})
                
                return
                
            }


            if (filtros.cod_localidade) {
                const res = await fetch(urlBboxLocalidades({cod_uf:filtros.cod_uf, cod_municipio:filtros.cod_municipio, cod_localidade:filtros.cod_localidade}));
                const { xmin, ymin, xmax, ymax } = await res.json();
                                
                if (xmin == null) 
                    return

                if (xmin === xmax && ymin === ymax) {
                    map.flyTo({center:[xmin,ymin], zoom:14})
                    return
                }

                map.fitBounds([[xmin,ymin],[xmax,ymax]], {padding:40, maxZoom:14})
                
                return
                
            }


            if (filtros.cod_catmetropol) {
                const res = await fetch(urlBboxCategoriasMetropolitanas({cod_catmetropol: filtros.cod_catmetropol}));
                const { xmin, ymin, xmax, ymax } = await res.json();
                map.fitBounds([[xmin, ymin], [xmax, ymax]], { padding: 40 });
            }

        
            if (filtros.cod_municipio) {
                const res = await fetch(urlBboxMunicipios({cod_municipio: filtros.cod_municipio}));
                const { xmin, ymin, xmax, ymax } = await res.json();
                map.fitBounds([[xmin, ymin], [xmax, ymax]], { padding: 40 });
                return;
            }

            if (filtros.cod_uf) {
                const res = await fetch(urlBboxUfs({cod_uf: filtros.cod_uf}));
                const { xmin, ymin, xmax, ymax } = await res.json();
                map.fitBounds([[xmin, ymin], [xmax, ymax]], { padding: 40 });
            }
        }

        if (map.isStyleLoaded()) {
            aplicarZoom();
        } else {
            map.once("load", aplicarZoom)
        };

    }, [filtros.cod_uf, filtros.cod_municipio, filtros.nr_proposta, filtros.nr_instrumento, filtros.cod_localidade, filtros.cod_dsc_localidade, filtros.cod_catmetropol]);
  



    //useEffects que atualizas as sources das camadas toda vez que houver alterações nos filtros
    const atualizarSource = (sourceId, url) => {
        const map = mapRef.current;
        if (!map) return;
        const source = map.getSource(sourceId);
        if (!source) return;
        source.setTiles([url]);
    };

    useEffect(()=>{
        atualizarSource("ufs", urlUfs({cod_uf: filtros.cod_uf}))
    }, [filtros.cod_uf]);

    useEffect(()=>{
        atualizarSource("municipios_2025", urlMunicipios2025({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol}))
        atualizarSource("municipios_2022", urlMunicipios2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol, subgrupo: filtros.subgrupo, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
        atualizarSource("distritos_2022", urlDistritos2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol}))
        atualizarSource("setores_censitarios_2022", urlSetoresCensitarios2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.cod_catmetropol, filtros.subgrupo, filtros.semiarido_2022, filtros.amazonia_legal, filtros.vale_jequetinhonha]);
    
    useEffect(()=>{
        atualizarSource("localidades_2022", urlLocalidades2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_localidade: filtros.cod_localidade, cod_catmetropol: filtros.cod_catmetropol}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.cod_localidade, filtros.cod_catmetropol]);

    useEffect(()=>{
        atualizarSource("enderecos_2022", urlEnderecos2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_dsc_localidade: filtros.cod_dsc_localidade, cod_catmetropol: filtros.cod_catmetropol}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.cod_dsc_localidade, filtros.cod_catmetropol]);

    useEffect(()=>{
        atualizarSource("geometrias_carteira_dsr", urlGeometriasCarteiraDsr({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, nr_proposta: filtros.nr_proposta, nr_instrumento: filtros.nr_instrumento, cod_catmetropol: filtros.cod_catmetropol}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.nr_proposta, filtros.nr_instrumento, filtros.cod_catmetropol]);
    




    //useEffect que gera o popup ao clicar na feicao
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const camadas = [ "localidades_2022", "enderecos_2022", "setores_censitarios_2022_fill", "geometrias_carteira_dsr"];
        
        function handleClick(e) {
            const features = map.queryRenderedFeatures(e.point, { layers: camadas });

            if (!features.length) return;

            const f = features[0];
            const props = f.properties;
            //const layerConfig = layers.find(l => l.id === f.layer.id);
            //const variavel = layerConfig?.variavelSel;

            let html = `<strong>Camada:</strong> ${camadas[f.layer.id] || f.layer.id}<br/>`;
            
            if (f.layer.id === "localidades_2022") {
                html += `
                Nome: ${props.nome_localidade}<br/>
                Categoria: ${props.categoria_localidade}
                `;
            }

                       
            if (f.layer.id === "enderecos_2022") {
                html += `
                Localidade: ${props.dsc_localidade}<br>
                Espécie: ${props.especie}
                `;
            }

            if (f.layer.id === "setores_censitarios_2022_fill") {
                html += `
                <strong> Município: </strong> ${props.nome_municipio} <br>
                <br/>
                <strong> ${props.situacao} </strong> <br>
                ${props.situacao_detalhada}
                `;
            }

            if (f.layer.id === "geometrias_carteira_dsr") {
                html += `
                <strong> Proposta: </strong> ${props.nr_proposta} <br>
                <br/>
                <strong> Ação </strong> <br>
                ${props.acao_padronizada} 
                `;
            }

            
            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);
        }

        map.on("click", handleClick);

        return () => {map.off("click", handleClick);};

    }, [layers]);
  

    //função que liga e desliga a visibilidade das camadas
    function toggleLayer(id) {
        const map = mapRef.current;
        if (!map || !map.getLayer(id)) return;

        setLayers(prev => prev.map(layer => {
        if (layer.id === id) {
            const novaVis = !layer.visivel;

            map.setLayoutProperty(id, "visibility", novaVis ? "visible" : "none");
            return { ...layer, visivel: novaVis };
        }
        return layer;
        }));
    }
    
    
    //Função que troca a variável usada para fazer a simbologia da camada
    function alterarVariavel(id, valor) {
        setLayers(prev => prev.map(layer => layer.id === id ? { ...layer, variavelSel: valor } : layer));
    }
    

    //useEffect que troca a simbologia do mapa de acordo com a variável escolhida
    useEffect(() => {

        const map = mapRef.current;
        if (!map) return;

        
        async function atualizarClassificacoes() {

            for (const layer of layers) {

            if (!layer.variaveis) continue;
            if (!map.getLayer(layer.id)) continue;
            if (!layer.variavelSel) continue;

            try {

                // procura configuração da variável selecionada
                const variavelConfig = layer.variaveis.find(v => v.value === layer.variavelSel);
                if (!variavelConfig) continue;


                //variavel do tipo percentual - invertido pois quanto maior pior
                if (variavelConfig.tipo === "percentual_invertido") {

                    const res = await fetch(
                        `${API_URL}/classificacao/${layer.variavelSel}`
                    );

                    const data = await res.json();

                    map.setPaintProperty(layer.id,
                        "fill-color", ["step", ["coalesce", ["to-number", ["get", layer.variavelSel]],
                                    0], "#2d6a4f",
                        data.breaks[1], "#95d5b2",
                        data.breaks[2], "#ffe066",
                        data.breaks[3], "#f77f00",
                        data.breaks[4], "#d62828"
                        ]
                    );
                }
                

                //variavel do tipo percentual - normal pois quanto maior melhor
                if (variavelConfig.tipo === "percentual_normal") {

                    const res = await fetch(
                        `${API_URL}/classificacao/${layer.variavelSel}`
                    );

                    const data = await res.json();

                    map.setPaintProperty(layer.id,
                        "fill-color", ["step", ["coalesce", ["to-number", ["get", layer.variavelSel]],
                                    0], "#d62828",
                        data.breaks[1], "#f77f00",
                        data.breaks[2], "#ffe066",
                        data.breaks[3], "#95d5b2",
                        data.breaks[4], "#2d6a4f"
                        ]
                    );
                }


                //variavel do tipo categorica
                if (variavelConfig.tipo === "categorica") {


                    if (layer.variavelSel === "subgrupo") {
                        map.setPaintProperty(layer.id,
                        "fill-color", ["match", ["get", "subgrupo"],
                            "G1", "#d73027",
                            "G2", "#fc8d59",
                            "G3", "#049e91",
                            "#cccccc"
                        ]
                        );
                    }

                    
                    if (layer.variavelSel === "tipo_catmetropol") {
                        map.setPaintProperty(layer.id,
                        "fill-color", ["match", ["get", "tipo_catmetropol"],
                            "Não Possui", "#ffffff",
                            "RM", "#46f3df",
                            "RIDE, RM", "#00515c",
                            "RIDE", "#0034df",
                            "RAIDE", "#867d00",
                            "Entorno Metropolitano", "#f5b352",
                            "Colar Metropolitano", "#fc2f8f",
                            "Área de Expansão Metropolitana", "#d62828",
                            "#ffffff"
                        ]
                        );
                    }
                }

                //variavel do tipo booleana
                if (variavelConfig.tipo === "booleana") {
                    map.setPaintProperty(layer.id,
                        "fill-color", ["match", ["to-number", ["get", layer.variavelSel]],
                        1, "#d62828",
                        0, "#2a9d8f",
                        "#750a3c"
                        ]
                    );
                }

            } catch (err) {console.error(`Erro na camada ${layer.id}:`, err);}
            }
        }

        atualizarClassificacoes();

    }, [layers]);
    //--------------------------------------------------------------------------------------------

    
    return ( 
        <div className={estilos.mapa_box}>
            <button className={estilos.botaoFiltros} onClick={() => setPainelFiltros(!painelFiltros)}>Filtrar</button>
            {painelFiltros && 
                <FiltroPainel
                    setPainelFiltros={setPainelFiltros}
                    layers={layers}
                />
            }
            <button className={estilos.botaoCamadas} onClick={() => setPainelCamadas(!painelCamadas)}> <Layers className={estilos.LayersIcon}/> </button> 
            {painelCamadas && (<CamadasSection layers={layers} toggleLayer={toggleLayer} alterarVariavel={alterarVariavel}/>)}
            <div ref={mapContainer} className={estilos.mapContainer}/>
        </div>
    );
}