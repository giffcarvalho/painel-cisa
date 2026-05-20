import estilos from "./MapaSection.module.css";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapaSection() { 
    
    //Esse estado controla a visibilidade e variaveis das camadas
    const [layers, setLayers] = useState([
        { id: "ufs", nome: "Limites Estaduais", visivel: true },
        { id: "municipios_2025", nome: "Limites Municipais 2025", visivel: true },
        { id: "distritos_2022", nome: "Distritos 2022", visivel: true },
        { id: "setores_censitarios_2022", nome: "Setores Censitários 2022", visivel: true },
        { id: "enderecos_2022", nome: "Endereços 2022", visivel: true },
        { id: "localidades_2022", nome: "Localidades 2022", visivel: true },
    ]);
  

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
            labels: {type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"], tileSize: 256},
            },
            layers: [
            {id: "satellite", type: "raster", source: "satellite"},
            {id: "labels", type: "raster", source: "labels"}
            ]
        },
        center: [-47.9, -15.8], //centraliza o mapa nessas coordenadas ao carregar
        zoom: 3                 //define o nível de zoom ao carregar 
        });


        //adição das camadas. O primeiro bloco são as fontes (sources). O segundo bloco são as camadas (layers) já com a simbologia desejada
        //a ordem dos addLayers no código influencia na ordem de renderização. Os últimos ficam por cima no mapa
        map.on("load", () => {
            map.addSource("setores_censitarios_2022", {type: "vector", tiles: [`${API_URL}/setores_censitarios_2022/{z}/{x}/{y}.pbf`], minzoom: 8, maxzoom: 20});
            map.addSource("distritos_2022", {type: "vector", tiles: [`${API_URL}/distritos_2022/{z}/{x}/{y}.pbf`], minzoom: 6, maxzoom: 20});
            map.addSource("municipios_2025", {type: "vector", tiles: [`${API_URL}/municipios_2025/{z}/{x}/{y}.pbf`], minzoom: 5, maxzoom: 20});
            map.addSource("ufs", {type: "vector", tiles: [`${API_URL}/ufs/{z}/{x}/{y}.pbf`], minzoom: 3, maxzoom: 20});
            map.addSource("enderecos_2022", {type: "vector", tiles: [`${API_URL}/enderecos_2022/{z}/{x}/{y}.pbf`], minzoom: 12, maxzoom: 20});
            map.addSource("localidades_2022", {type: "vector", tiles: [`${API_URL}/localidades_2022/{z}/{x}/{y}.pbf`], minzoom: 8, maxzoom: 20});
            
            
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
                id: "setores_censitarios_2022",
                type: "line",
                source: "setores_censitarios_2022", "source-layer": "poligonos",
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
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 7.5, 0.5, 8.0, 1.0, 9.0, 1.5, 10.0, 3.0],
                    "line-color": "#d51bfa"
                }
            });


            map.addLayer({
                id: "municipios_2025",
                type: "line",
                source: "municipios_2025", "source-layer": "poligonos",
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 6.0, 0.3, 7.0, 1.0, 8.0, 2.0, 9.0, 3.0, 10.0, 4.0, 11.0, 4.5],
                    "line-color": "#f3f3f3"
                }
            });

            
            map.addLayer({
                id: "ufs",
                type: "line",
                source: "ufs", "source-layer": "poligonos",
                paint: {
                    "line-width": ["interpolate", ["linear"], ["zoom"], 3.0, 1.0, 5.0, 2.0, 6.0, 3.0, 7.0, 4.0, 8.0, 6.0, 9.0, 7.0, 10.0, 10.0],
                    "line-color": "#c9c9c9"
                }
            });

            
            map.addLayer({
                id: "enderecos_2022",
                type: "circle",
                source: "enderecos_2022", "source-layer": "pontos",
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


        })




        mapRef.current = map;

    }, []);
    
    

    //useEffect que gera o popup ao clicar na feicao
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const camadas = [ "localidades_2022", "enderecos_2022", "setores_censitarios_2022_fill"];
        
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

            
            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);
        }

        map.on("click", handleClick);

        return () => {map.off("click", handleClick);};

    }, [layers]);
  




    
    return ( 
        <div className={estilos.mapa_box}>
            <button className={estilos.botaoMenu}> ☰ </button>
            <button className={estilos.botaoFiltros}> ☰ </button>
            <button className={estilos.botaoCamadas}> ☰ </button>
            <div ref={mapContainer} className={estilos.mapContainer}/>
        </div>
    );
}