import estilos from "./MapaSection.module.css";
import { useEffect, useRef, useState, useContext } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers } from "lucide-react";
import CamadasSection from "./CamadasSection";
import { FiltrosContext } from "../../context/mapa/filtrosContext";
import FiltroPainel from "./FiltroPainel";
import LegendaSection from "./LegendaSection";
import DetalheSection from "./DetalheSection";
import { 
    urlBboxUfs,
    urlDistritos2022,
    urlEnderecos2022,
    urlCidades,
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
import InputSection from "./InputSection";


function gerarMatch(simbologia, propriedade, valorPadrao) {

    if (!simbologia?.classes) {
        return valorPadrao;
    }

    const match = ["match", ["get", simbologia.atributo]];
    simbologia.classes.forEach(classe => {
        match.push(classe.valor);
        match.push(classe[propriedade]);
    });

    match.push(valorPadrao);
    return match;
}

function gerarMatchLegenda(atributo, legenda) {

    const match = ["match", ["get", atributo]];

    legenda.forEach(item => {
        match.push(item.valor);
        match.push(item.cor);
    });

    match.push("#e7e1e1");
    return match;
}


export default function MapaSection() { 
    
    //este estado armazena a visibilidade, simbologia e as variaveis das camadas
    const [layers, setLayers] = useState([
        { id: "ufs", nome: "Limites Estaduais", visivel: true, minzoom: 3, simbologia: {tipo: "simples", simbolo: "linha", cor: "#c9c9c9"}},
        { id: "municipios_2022", nome: "Limites Municipais 2022", visivel: true, minzoom: 6, simbologia: {tipo: "simples", simbolo: "linha", cor: "#ffffff"}},
        { id: "cidades", nome: "Cidades", visivel: true, minzoom: 8, simbologia: {tipo: "simples", simbolo: "ponto", cor: "#ffffff", strokeColor: "#000000", strokeWidth: 3}},
        { id: "cidades_labels", nome: "Nome das Cidades", visivel: true, dependencias: ["cidades"], mostrarPainel: false },
        { id: "distritos_2022", nome: "Distritos 2022", visivel: true, minzoom: 7, simbologia: {tipo: "simples", simbolo: "linha", cor: "#9608b3"}},
        { id: "setores_censitarios_2022", nome: "Setores Censitários 2022", visivel: true, minzoom: 9, simbologia: {
            tipo: "categorica", simbolo: "linhaPontilhada", atributo: "cod_sit", classes: [
                {valor: 1, label: "Área urbana de alta densidade", cor: "#ff1e00"},
                {valor: 2, label: "Área urbana de baixa densidade", cor: "#f87f6f"},
                {valor: 3, label: "Núcleo urbano", cor: "#3b0303"},
                {valor: 5, label: "Aglomerado rural - Povoado", cor: "#fdff74"},
                {valor: 6, label: "Aglomerado rural - Núcleo rural", cor: "#b8905c"},
                {valor: 7, label: "Aglomerado rural - Lugarejo", cor: "#365809"},
                {valor: 8, label: "Área rural - exclusive aglomerados", cor: "#a6ca03"},
                {valor: 9, label: "Massas de água", cor: "#3067ff"},
            ]
        }},
        { id: "enderecos_2022", nome: "Endereços 2022", visivel: true, minzoom: 13, simbologia: {
            tipo: "categorica", simbolo: "ponto", atributo: "cod_especie", classes: [
                {valor: 1, label: "Dom. particular", cor: "#fcff4f"},
                {valor: 2, label: "Dom. coletivo", cor: "#999b24"},
                {valor: 3, label: "Estab. agropecuário", cor: "#007566"},
                {valor: 4, label: "Estab. ensino", cor: "#1034ff"},
                {valor: 5, label: "Estab. saúde", cor: "#ff61ff"},
                {valor: 6, label: "Estab. outras finalidades", cor: "#e9e9e9"},
                {valor: 7, label: "Edificação em construção", cor: "#9e9e9e"},
                {valor: 8, label: "Estab. religioso", cor: "#fc0543"},
                
            ] 
        }},
        { id: "localidades_2022", nome: "Localidades 2022", visivel: true, minzoom: 9, simbologia: {
            tipo: "categorica", simbolo: "ponto", atributo: "categoria_localidade", classes: [
                {valor: "Vila", label: "Vila", cor: "#9608b3", strokeColor: "#000000", strokeWidth: 1},
                {valor: "Povoado", label: "Povoado", cor: "#fdff74", strokeColor: "#000000", strokeWidth: 1},
                {valor: "Lugarejo", label: "Lugarejo", cor: "#365809", strokeColor: "#000000", strokeWidth: 1},
                {valor: "Núcleo Rural", label: "Núcleo Rural", cor: "#b8905c", strokeColor: "#000000", strokeWidth: 1},
                {valor: "Localidade Indígena", label: "Localidade Indígena", cor: "#880925", strokeColor: "#000000", strokeWidth: 1},
                {valor: "Localidade Quilombola", label: "Localidade Quilombola", cor: "#442d2f", strokeColor: "#000000", strokeWidth: 1},
                {valor: "Outras Localidades", label: "Outras Localidades", cor: "#ffffff", strokeColor: "#000000", strokeWidth: 1},
            ] 
        }},
        { id: "localidades_2022_labels", nome: "Nome das Localidades", visivel: true, dependencias: ["localidades_2022"], mostrarPainel: false },
        { id: "geometrias_carteira_dsr", nome: "Carteira DSR", visivel: false, minzoom: 4, simbologia: {
            tipo: "categorica", simbolo: "ponto", atributo: "acao_padronizada", classes: [
                {valor: "Saneamento Rural", label: "Saneamento Rural", cor: "#f8cdcd", strokeColor: "#0092be", strokeWidth: 3.0},
                {valor: "Capacitação - PMSB", label: "Capacitação - PMSB", cor: "#f5df4d", strokeColor: "#0092be", strokeWidth: 3.0},
                {valor: "Abastecimento de Água", label: "Abastecimento de Água", cor: "#0071bd", strokeColor: "#0092be", strokeWidth: 3.0},
                {valor: "Esgotamento Sanitário", label: "Esgotamento Sanitário", cor: "#96710b", strokeColor: "#0092be", strokeWidth: 3.0},
                {valor: "MSD", label: "MSD", cor: "#c800e2", strokeColor: "#0092be", strokeWidth: 3.0},
            ] 
        }},
        { id: "informacoes_municipais", 
            nome: "Informações Municipais",
            visivel: false,
            minzoom: 3,
            variavelSel: "",
            variaveis: [
                {value: "jenks_deficit_agua_rural_ibge", label: "Déficit água rural - Municipal", tipo: "percentual_invertido", legenda: [{valor: 5, label: "72,68 - 100%", cor: "#d62828"}, {valor: 4, label: "47,54 - 72,68%", cor: "#f77f00"}, {valor: 3, label: "27,07 - 47,54%", cor: "#ffe066"}, {valor: 2, label: "10,21 - 27,07%", cor: "#95d5b2"}, {valor: 1, label: "0 - 10,21%", cor: "#2d6a4f"},]},
                {value: "jenks_deficit_esgoto_rural_ibge", label: "Déficit esgoto rural - Municipal", tipo: "percentual_invertido", legenda: [{valor: 5, label: "86,61 - 100%", cor: "#d62828"}, {valor: 4, label: "68,81 - 86,61%", cor: "#f77f00"}, {valor: 3, label: "48,75 - 68,81%", cor: "#ffe066"}, {valor: 2, label: "25,45 - 48,75%", cor: "#95d5b2"}, {valor: 1, label: "0 - 25,45%", cor: "#2d6a4f"},]},
                {value: "jenks_deficit_residuo_rural_ibge", label: "Déficit resíduos rural - Municipal", tipo: "percentual_invertido", legenda: [{valor: 5, label: "83,13 - 100%", cor: "#d62828"}, {valor: 4, label: "64,57 - 83,13%", cor: "#f77f00"}, {valor: 3, label: "45,11 - 64,57%", cor: "#ffe066"}, {valor: 2, label: "23,18 - 45,11%", cor: "#95d5b2"}, {valor: 1, label: "0 - 23,18%", cor: "#2d6a4f"},]},
                {value: "jenks_deficit_banheiro_rural_ibge", label: "Déficit banheiro rural - Municipal", tipo: "percentual_invertido", legenda: [{valor: 5, label: "55,89 - 100%", cor: "#d62828"}, {valor: 4, label: "35,55 - 55,89%", cor: "#f77f00"}, {valor: 3, label: "17,57 - 35,55%", cor: "#ffe066"}, {valor: 2, label: "5,85 - 17,57%", cor: "#95d5b2"}, {valor: 1, label: "0 - 5,85%", cor: "#2d6a4f"},]},
                {value: "jenks_deficit_agua_urbana_ibge", label: "Déficit água urbano - Municipal", tipo: "percentual_invertido", legenda: [{valor: 5, label: "66,26 - 100%", cor: "#d62828"}, {valor: 4, label: "33,52 - 66,26%", cor: "#f77f00"}, {valor: 3, label: "15,40 - 33,52%", cor: "#ffe066"}, {valor: 2, label: "4,66 - 15,40%", cor: "#95d5b2"}, {valor: 1, label: "0 - 4,66%", cor: "#2d6a4f"},]},
                {value: "jenks_deficit_esgoto_urbana_ibge", label: "Déficit esgoto urbano - Municipal", tipo: "percentual_invertido", legenda: [{valor: 5, label: "79,52 - 100%", cor: "#d62828"}, {valor: 4, label: "54,66 - 79,52%", cor: "#f77f00"}, {valor: 3, label: "31,11 - 54,66%", cor: "#ffe066"}, {valor: 2, label: "12,16 - 31,11%", cor: "#95d5b2"}, {valor: 1, label: "0 - 12,16%", cor: "#2d6a4f"},]},
                {value: "jenks_deficit_residuo_urbana_ibge", label: "Déficit resíduos urbano - Municipal", tipo: "percentual_invertido", legenda: [{valor: 5, label: "38,29 - 100%", cor: "#d62828"}, {valor: 4, label: "18,86 - 38,29%", cor: "#f77f00"}, {valor: 3, label: "7,84 - 18,86%", cor: "#ffe066"}, {valor: 2, label: "2,39 - 7,84%", cor: "#95d5b2"}, {valor: 1, label: "0 - 2,39%", cor: "#2d6a4f"},]},
                {value: "jenks_deficit_banheiro_urbana_ibge", label: "Déficit banheiro urbano - Municipal", tipo: "percentual_invertido", legenda: [{valor: 5, label: "23,01 - 100%", cor: "#d62828"}, {valor: 4, label: "10,78 - 23,01%", cor: "#f77f00"}, {valor: 3, label: "4,64 - 10,78%", cor: "#ffe066"}, {valor: 2, label: "1,36 - 4,64%", cor: "#95d5b2"}, {valor: 1, label: "0 - 1,36%", cor: "#2d6a4f"},]},
                {value: "subgrupo", label: "Subgrupo PAC", tipo: "categorica", legenda: [{valor: "G1", label: "G1", cor: "#d73027"}, {valor: "G2", label: "G2", cor: "#fc8d59"}, {valor: "G3", label: "G3", cor: "#049e91"}]},
                {value: "tipo_catmetropol", label: "Categoria Metropolitana", tipo: "categorica", legenda: [{valor: "Não Possui", label: "Não Possui", cor: "#ffffff"}, {valor: "RM", label: "RM", cor: "#46f3df"}, {valor: "RIDE, RM", label: "RIDE, RM", cor: "#00515c"}, {valor: "RIDE", label: "RIDE", cor: "#0034df"}, {valor: "RAIDE", label: "RAIDE", cor: "#867d00"}, {valor: "Entorno Metropolitano", label: "Entorno Metropolitano", cor: "#f5b352"}, {valor: "Colar Metropolitano", label: "Colar Metropolitano", cor: "#fc2f8f"}, {valor: "Área de Expansão Metropolitana", label: "Área de Expansão Metropolitana", cor: "#d62828"}]},
                {value: "populacao_total_censo_2022_maior_50000", label: "População 2022 >50 mil", tipo: "booleana", legenda: [{valor: false, label: "< 50 mil", cor: "#2a9d8f"}, {valor: true, label: "> 50 mil", cor: "#d62828"}]},
            ]
        },
        { id: "informacoes_setores_censitarios", 
            nome: "Informações Setores Censitarios",
            visivel: false,
            minzoom: 8,
            variavelSel: "",
            variaveis: [
                {value: "jenks_perc_agua_forma_nao_adequada", label: "Água - forma não adequada - Setores", tipo: "percentual_invertido", legenda: [{valor: 5, label: "81 - 100%", cor: "#d62828"}, {valor: 4, label: "51 - 81%", cor: "#f77f00"}, {valor: 3, label: "25 - 51%", cor: "#ffe066"}, {valor: 2, label: "7 - 25%", cor: "#95d5b2"}, {valor: 1, label: "0 - 7%", cor: "#2d6a4f"},]},
                {value: "jenks_perc_esgoto_tipo_nao_adequado", label: "Esgoto - tipo não adequado - Setores", tipo: "percentual_invertido", legenda: [{valor: 5, label: "86 - 100%", cor: "#d62828"}, {valor: 4, label: "60 - 86%", cor: "#f77f00"}, {valor: 3, label: "36 - 60%", cor: "#ffe066"}, {valor: 2, label: "10 - 36%", cor: "#95d5b2"}, {valor: 1, label: "0 - 10%", cor: "#2d6a4f"},]},
                {value: "jenks_perc_lixo_destino_nao_adequado", label: "Destino lixo não adequado - Setores", tipo: "percentual_invertido", legenda: [{valor: 5, label: "85 - 100%", cor: "#d62828"}, {valor: 4, label: "58 - 85%", cor: "#f77f00"}, {valor: 3, label: "31 - 58%", cor: "#ffe066"}, {valor: 2, label: "9 - 31%", cor: "#95d5b2"}, {valor: 1, label: "0 - 9%", cor: "#2d6a4f"},]},
                {value: "jenks_perc_ban_sem_ban_exclusivo", label: "Sem banheiro exclusivo - Setores", tipo: "percentual_invertido", legenda: [{valor: 5, label: "78 - 100%", cor: "#d62828"}, {valor: 4, label: "47 - 78%", cor: "#f77f00"}, {valor: 3, label: "23 - 47%", cor: "#ffe066"}, {valor: 2, label: "6 - 23%", cor: "#95d5b2"}, {valor: 1, label: "0 - 6%", cor: "#2d6a4f"},]},
            ]
        },
        
    ]);
    
    
    const [painelCamadas, setPainelCamadas] = useState(false);
    const [painelFiltros, setPainelFiltros] = useState(false);
    const [painelDetalhe, setPainelDetalhe] = useState(false);
    const [zoomAtual, setZoomAtual] = useState(3);
    const [coord, setCoord] = useState({ lat: "", long: "" });
    

    const {filtros} = useContext(FiltrosContext)


    const API_URL = "http://localhost:8000/api/v1/mapa";
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const coordRef = useRef(null);

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
        center: [-47.9, -15.8], 
        zoom: 3                 
        });

        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.on("zoomend", () => {setZoomAtual(map.getZoom());}); //captura o zoom atual do mapa e salva no estado zoomAtual
        
        map.on("mousemove", (e) => {
            if (!coordRef.current) return;
            coordRef.current.textContent = `Lat: ${e.lngLat.lat.toFixed(6)} | Lon: ${e.lngLat.lng.toFixed(6)}`;
        });

        map.addControl(new maplibregl.ScaleControl({maxWidth: 120, unit: "metric"}), "top-left");

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
            map.addSource("geometrias_carteira_dsr", {type: "vector", tiles: [urlGeometriasCarteiraDsr(filtros)], minzoom: 4, maxzoom: 20});


            
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
                layout:{visibility: layers.find(l=>l.id==="geometrias_carteira_dsr")?.visivel? "visible": "none"},
                minzoom: carteira?.minzoom,
                paint: {
                    "circle-radius": ["interpolate", ["linear"], ["zoom"], 4.0, 2.0, 5.0, 3.0, 6.0, 4.0, 7.0, 5.0, 8.0, 6.0],
                    "circle-color": gerarMatch(carteira?.simbologia, "cor", "#000000"),
                    "circle-stroke-color": gerarMatch(carteira?.simbologia, "strokeColor", "#000000"),
                    "circle-stroke-width": gerarMatch(carteira?.simbologia, "strokeWidth", 0),
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
        atualizarSource("municipios_2022", urlMunicipios2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
        atualizarSource("cidades", urlCidades({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
        atualizarSource("distritos_2022", urlDistritos2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
        atualizarSource("setores_censitarios_2022", urlSetoresCensitarios2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.cod_catmetropol, filtros.semiarido_2022, filtros.amazonia_legal, filtros.vale_jequetinhonha]);
    
    useEffect(()=>{
        atualizarSource("localidades_2022", urlLocalidades2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_localidade: filtros.cod_localidade, cod_catmetropol: filtros.cod_catmetropol}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.cod_localidade, filtros.cod_catmetropol]);

    useEffect(()=>{
        atualizarSource("enderecos_2022", urlEnderecos2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_dsc_localidade: filtros.cod_dsc_localidade, cod_catmetropol: filtros.cod_catmetropol}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.cod_dsc_localidade, filtros.cod_catmetropol]);

    useEffect(()=>{
        atualizarSource("geometrias_carteira_dsr", urlGeometriasCarteiraDsr({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, nr_proposta: filtros.nr_proposta, nr_instrumento: filtros.nr_instrumento, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.nr_proposta, filtros.nr_instrumento, filtros.cod_catmetropol, filtros.semiarido_2022, filtros.amazonia_legal, filtros.vale_jequetinhonha]);
    




    //useEffect que gera o popup ao clicar na feicao
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const camadas = [ "enderecos_2022", "setores_censitarios_2022_fill", "geometrias_carteira_dsr", "informacoes_municipais", "informacoes_setores_censitarios"];
        
        function handleClick(e) {
            const features = map.queryRenderedFeatures(e.point, { layers: camadas });

            if (!features.length) return;

            const f = features[0];
            const props = f.properties;
            const layerConfig = layers.find(l => l.id === f.layer.id);
            
            
            //console.log(props);
            
            let html = "";
            
            if (f.layer.id === "enderecos_2022") {
                html += `
                <strong> Espécie: </strong> ${props.especie}<br>
                <strong> Localidade do endereço: </strong> ${props.dsc_localidade}
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
                <strong> Ação </strong> <br>
                ${props.acao_padronizada}<br/>
                <br/>
                <strong> Proposta: </strong> ${props.nr_proposta} <br>
                <strong> Instrumento: </strong> ${props.instrumento} <br>
                <br/>
                <strong> Objeto: </strong> ${props.objeto} <br>
                <br/>
                <a href="${props.link_transferegov}" target="_blank" rel="noopener noreferrer"> Link Transferegov </a>
                `; 
            }


            if (f.layer.id === "informacoes_setores_censitarios") {
                
                html += `
                    <strong>Situação:</strong> ${props.situacao}<br>
                    <strong>Município:</strong> ${props.nome_municipio}<br>
                    <strong>População no setor:</strong> ${Number(props.total_pessoas).toLocaleString("pt-BR")}<br>
                `;

                const variavelConfig = layerConfig?.variaveis?.find(v => v.value === layerConfig?.variavelSel);

                if (variavelConfig) {

                    let valor;
                    
                    if (variavelConfig.tipo === "booleana") {
                        valor = props[variavelConfig.value] ? "Sim" : "Não";
                    }
                    else if (variavelConfig.value.startsWith("jenks_")) {
                        const campo = variavelConfig.value.replace(/^jenks_/, "");
                        valor = props[campo] != null? `${(props[campo] * 1).toFixed(2)}%`: null;
                    } else {
                        valor = props[variavelConfig.value];
                    }


                    if (valor != null) {
                        html += `<br><strong>${variavelConfig.label}:</strong> ${valor}`;
                    }
                }
            }



            if (f.layer.id === "informacoes_municipais") {
                
                html += `
                    <strong>Município:</strong> ${props.nome}<br>
                    <strong>População 2022:</strong> ${Number(props.populacao_total_censo_2022).toLocaleString("pt-BR")}<br>
                    <strong>Categ. Metrop.:</strong> ${props.label_catmetropol}<br>
                    <strong>Subgrupo:</strong> ${props.subgrupo}<br>
                `;

                const variavelConfig = layerConfig?.variaveis?.find(v => v.value === layerConfig?.variavelSel);

                if (variavelConfig) {

                    let valor;
                    
                    if (variavelConfig.tipo === "booleana") {
                        valor = props[variavelConfig.value] ? "Sim" : "Não";
                    }
                    else if (variavelConfig.value.startsWith("jenks_")) {
                        const campo = variavelConfig.value.replace(/^jenks_/, "");
                        valor = props[campo] != null? `${(props[campo] * 100).toFixed(2)}%`: null;
                    } else {
                        valor = props[variavelConfig.value];
                    }


                    if (valor != null) {
                        html += `<br><strong>${variavelConfig.label}:</strong> ${valor}`;
                    }
                }
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

        setLayers(prev => {
            
            const layerPrincipal = prev.find(l => l.id === id);
            
            if (!layerPrincipal) return prev;
            
            const novaVis = !layerPrincipal.visivel;
            
            return prev.map(layer => {
                const deveAlterar = layer.id === id || layer.dependencias?.includes(id);

                if (!deveAlterar) return layer;

                if (map.getLayer(layer.id)) {map.setLayoutProperty(layer.id, "visibility", novaVis? "visible": "none");}
                return {...layer, visivel: novaVis};
            });
        });
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

                const variavelConfig = layer.variaveis.find(v => v.value === layer.variavelSel);
                
                if (!variavelConfig) continue;

                if (variavelConfig.tipo === "booleana") {
                    map.setPaintProperty(layer.id, "fill-color", [
                            "case",
                            ["get", layer.variavelSel],
                            variavelConfig.legenda.find(i => i.valor === true).cor,
                            variavelConfig.legenda.find(i => i.valor === false).cor
                    ]);
                }
                else {
                    map.setPaintProperty(layer.id, "fill-color", gerarMatchLegenda(
                            layer.variavelSel,
                            variavelConfig.legenda
                    ));
                }
            }
        }

        atualizarClassificacoes();

    }, [layers]);
    //--------------------------------------------------------------------------------------------

    
    
    // função que faz o fly até a coordenada digitada
    const marcadorCoordRef = useRef(null);

    function irParaCoordenada() {
        
        const latNum = Number(coord.lat.replace(",", ".").trim());
        const longNum = Number(coord.long.replace(",", ".").trim());

        if (
            coord.lat.trim() === "" ||
            coord.long.trim() === "" ||
            Number.isNaN(latNum) ||
            Number.isNaN(longNum) ||
            latNum < -35 || latNum > 7 ||
            longNum < -76 || longNum > -33
        ) {
        alert("Coordenadas inválidas");
        return;
        }
        
        const map = mapRef.current;
        if (!map) return;
        
        map.flyTo({
        center: [longNum, latNum],
        zoom: 13
        });

        // remove marcador anterior
        if (marcadorCoordRef.current) {
            marcadorCoordRef.current.remove();
        }

        // cria novo marcador
        marcadorCoordRef.current = new maplibregl.Marker({
            color: "#ff0000"
        })

        .setLngLat([longNum, latNum])
        .addTo(map);
    };
    //--------------------------------------------------------------------------------------------


    //função que limpa as coordenadas digitadas
    function limparCoordenada() {

        // limpa inputs
        setCoord({ lat: "", long: "" });

        // remove marcador
        if (marcadorCoordRef.current) {
            marcadorCoordRef.current.remove();
            marcadorCoordRef.current = null;
        }

        // volta mapa para posição inicial
        const map = mapRef.current;

        if (map) {
            map.flyTo({
                center: [-47.9, -15.8],
                zoom: 4
            });
        }
    }
    //--------------------------------------------------------------------------------------------

    //useEffect(() => {console.log("coord mudou");}, [coord]);
    //useEffect(() => {console.log("zoom mudou");}, [zoomAtual]);
    //useEffect(() => {console.log("filtros mudaram");}, [filtros]);


    return ( 
        <div className={estilos.mapa_box}>
            <button className={estilos.botaoFiltros} onClick={() => setPainelFiltros(!painelFiltros)}>Filtrar</button>
            {painelFiltros && 
                <FiltroPainel
                    setPainelFiltros={setPainelFiltros}
                    setPainelDetalhe={setPainelDetalhe}
                    painelDetalhe={painelDetalhe}
                    layers={layers}
                />
            }
            <button className={estilos.botaoCamadas} onClick={() => setPainelCamadas(!painelCamadas)}> <Layers className={estilos.LayersIcon}/> </button> 
            {painelCamadas && (<CamadasSection layers={layers} toggleLayer={toggleLayer} alterarVariavel={alterarVariavel}/>)}
            {painelCamadas && (<LegendaSection layers={layers} zoomAtual={zoomAtual}/>)}
            <InputSection coord={coord} setCoord={setCoord} irParaCoordenada={irParaCoordenada} limparCoordenada={limparCoordenada}/>
            <div ref={coordRef} className={estilos.coordenadasMouse}> Lat: -- | Lon: -- </div>
            {(painelDetalhe && painelFiltros && filtros.cod_municipio) && (<DetalheSection setPainelDetalhe={setPainelDetalhe}/>)}
            <div ref={mapContainer} className={estilos.mapContainer}/>
        </div>
    );
}