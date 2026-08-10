import estilos from "./MapaSection.module.css";
import { useEffect, useRef, useState, useContext } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, List, Filter } from "lucide-react";
import CamadasSection from "./CamadasSection";
import { FiltrosContext } from "../../context/mapa/filtrosContext";
import FiltroPainel from "./FiltroPainel";
import LegendaSection from "./LegendaSection";
import DetalheSection from "./DetalheSection";
import InputSection from "./InputSection";
import AnaliseCoordenadaSection from "./AnaliseCoordenadaSection";
import { useCriarMapa } from "@/hooks/mapa/useCriarMapa";
import { useAdicionarLayers } from "@/hooks/mapa/useAdicionarLayers";
import { useAplicarZoom } from "@/hooks/mapa/useAplicarZoom";
import { useAtualizarSources } from "@/hooks/mapa/useAtualizarSources";
import { useTrocarSimbologia } from "@/hooks/mapa/useTrocarSimbologia";
import { useClicar } from "@/hooks/mapa/useClicar";
import { useAuth } from "@/context/auth/useAuth";
import { listarDadosAnaliseCoordenadas, enviarAnaliseCoordenadas } from "../../api/mapa";
 

export default function MapaSection() { 
    
    //este estado armazena a visibilidade, simbologia e as variaveis das camadas
    const [layers, setLayers] = useState([
        {
            id: "ufs",
            nome: "Limites Estaduais",
            visivel: true,
            minzoom: 3,
            simbologia: {
                tipo: "simples",
                simbolo: "linha",
                cor: "#acaaaa"
            }
        },
        
        {
            id: "municipios_2022",
            nome: "Limites Municipais 2022",
            visivel: true,
            minzoom: 6,
            simbologia: {
                tipo: "simples",
                simbolo: "linha",
                cor: "#c9c9c9",
            }},
        
        {
            id: "cidades",
            nome: "Cidades",
            visivel: true,
            minzoom: 8,
            simbologia: {
                tipo: "simples",
                simbolo: "ponto",
                cor: "#ffffff",
                strokeColor: "#000000",
                strokeWidth: 3,
            }
        },
        
        {
            id: "cidades_labels",
            nome: "Nome das Cidades",
            visivel: true,
            dependencias: ["cidades"],
            mostrarPainel: false,
        },
        
        {
            id: "distritos_2022",
            nome: "Distritos 2022",
            visivel: true,
            minzoom: 7,
            simbologia: {
                tipo: "simples",
                simbolo: "linha",
                cor: "#9608b3",
            }
        },
        
        {
            id: "setores_censitarios_2022",
            nome: "Setores Censitários 2022",
            visivel: true,
            minzoom: 9,
            simbologia: {
                tipo: "categorica",
                simbolo: "linhaPontilhada",
                atributo: "cod_sit",
                classes: [
                    {valor: 1, label: "Área urbana de alta densidade", cor: "#ff1e00"},
                    {valor: 2, label: "Área urbana de baixa densidade", cor: "#f87f6f"},
                    {valor: 3, label: "Núcleo urbano", cor: "#3b0303"},
                    {valor: 5, label: "Aglomerado rural - Povoado", cor: "#fdff74"},
                    {valor: 6, label: "Aglomerado rural - Núcleo rural", cor: "#b8905c"},
                    {valor: 7, label: "Aglomerado rural - Lugarejo", cor: "#365809"},
                    {valor: 8, label: "Área rural - exclusive aglomerados", cor: "#a6ca03"},
                    {valor: 9, label: "Massas de água", cor: "#3067ff"},
                ]
            }
        },

        {
            id: "enderecos_2022",
            nome: "Endereços 2022",
            visivel: true,
            minzoom: 13,
            simbologia: {
                tipo: "categorica",
                simbolo: "ponto",
                atributo: "cod_especie",
                classes: [
                    {valor: 1, label: "Dom. particular", cor: "#fcff4f"},
                    {valor: 2, label: "Dom. coletivo", cor: "#999b24"},
                    {valor: 3, label: "Estab. agropecuário", cor: "#007566"},
                    {valor: 4, label: "Estab. ensino", cor: "#1034ff"},
                    {valor: 5, label: "Estab. saúde", cor: "#ff61ff"},
                    {valor: 6, label: "Estab. outras finalidades", cor: "#e9e9e9"},
                    {valor: 7, label: "Edificação em construção", cor: "#9e9e9e"},
                    {valor: 8, label: "Estab. religioso", cor: "#fc0543"},
                    
                ] 
            }
        },
        
        {
            id: "localidades_2022",
            nome: "Localidades 2022",
            visivel: true,
            minzoom: 9,
            simbologia: {
                tipo: "categorica",
                simbolo: "ponto",
                atributo: "categoria_localidade",
                classes: [
                    {valor: "Vila", label: "Vila", cor: "#9608b3", strokeColor: "#000000", strokeWidth: 1},
                    {valor: "Povoado", label: "Povoado", cor: "#fdff74", strokeColor: "#000000", strokeWidth: 1},
                    {valor: "Lugarejo", label: "Lugarejo", cor: "#365809", strokeColor: "#000000", strokeWidth: 1},
                    {valor: "Núcleo Rural", label: "Núcleo Rural", cor: "#b8905c", strokeColor: "#000000", strokeWidth: 1},
                    {valor: "Localidade Indígena", label: "Localidade Indígena", cor: "#880925", strokeColor: "#000000", strokeWidth: 1},
                    {valor: "Localidade Quilombola", label: "Localidade Quilombola", cor: "#442d2f", strokeColor: "#000000", strokeWidth: 1},
                    {valor: "Outras Localidades", label: "Outras Localidades", cor: "#ffffff", strokeColor: "#000000", strokeWidth: 1},
                ] 
            }
        },

        {
            id: "localidades_2022_labels",
            nome: "Nome das Localidades",
            visivel: true,
            dependencias: ["localidades_2022"],
            mostrarPainel: false
        },

        {
            id: "geometrias_carteira_drf",
            nome: "Carteira ativa DRF",
            visivel: false,
            minzoom: 3,
            simbologia: {
                tipo: "categorica",
                simbolo: "ponto",
                atributo: "modalidade",
                classes: [
                    {valor: "Desenvolvimento Institucional", label: "Desenvolvimento Institucional", cor: "#f8cdcd", strokeColor: "#ff5cdc", strokeWidth: 2.0},
                    {valor: "Redução e Controle de Perdas", label: "Redução e Controle de Perdas", cor: "#f5df4d", strokeColor: "#ff5cdc", strokeWidth: 2.0},
                    {valor: "Estudos e Projetos", label: "Estudos e Projetos", cor: "#17e904", strokeColor: "#ff5cdc", strokeWidth: 2.0},
                    {valor: "Esgotamento Sanitário", label: "Esgotamento Sanitário", cor: "#96710b", strokeColor: "#ff5cdc", strokeWidth: 2.0},
                    {valor: "Saneamento Integrado", label: "Saneamento Integrado", cor: "#c800e2", strokeColor: "#ff5cdc", strokeWidth: 2.0},
                    {valor: "Abastecimento de Água", label: "Abastecimento de Água", cor: "#0071bd", strokeColor: "#ff5cdc", strokeWidth: 2.0},
                    {valor: "Manejo de Resíduos Sólidos", label: "Manejo de Resíduos Sólidos", cor: "#ee8712", strokeColor: "#ff5cdc", strokeWidth: 2.0},
                    {valor: "Manejo de Águas Pluviais", label: "Manejo de Águas Pluviais", cor: "#7f7a80", strokeColor: "#ff5cdc", strokeWidth: 2.0},
                ] 
            }
        },
        
        { 
            id: "geometrias_carteira_dsr",
            nome: "Carteira DSR",
            visivel: false,
            minzoom: 3,
            variavelSel: "",
            variaveis: [
                {
                    atributo: "modalidade",
                    label: "Modalidade",
                    tipo: "categorica",
                    simbolo: "ponto",
                    legenda: [
                        {valor: "Saneamento Rural", label: "Saneamento Rural", cor: "#f8cdcd", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Capacitação - PMSB", label: "Capacitação - PMSB", cor: "#f5df4d", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Abastecimento de Água", label: "Abastecimento de Água", cor: "#0071bd", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Esgotamento Sanitário", label: "Esgotamento Sanitário", cor: "#96710b", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "MSD", label: "MSD", cor: "#c800e2", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Extinto", label: "Extinto", cor: "#000000", strokeColor: "#000000", strokeWidth: 1.0},
                    ]
                },
                {
                    atributo: "situacao_projeto",
                    label: "Situação do Projeto",
                    tipo: "categorica",
                    simbolo: "ponto",
                    legenda: [
                        {valor: "Aguardando elaboração", label: "Aguardando elaboração", cor: "#fdff89", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Em elaboração", label: "Em elaboração", cor: "#fce23c", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Enviado para análise", label: "Enviado para análise", cor: "#90d0fa", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Em análise", label: "Em análise", cor: "#00c4c4", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Em complementação", label: "Em complementação", cor: "#e29300", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Aprovado", label: "Aprovado", cor: "#4aff62", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Rejeitado", label: "Rejeitado", cor: "#e2001e", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "verificar", label: "verificar", cor: "#9e9e9e", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Não se aplica", label: "Não se aplica", cor: "#ffffff", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "Extinto", label: "Extinto", cor: "#000000", strokeColor: "#000000", strokeWidth: 1.0},
                    ]
                },
                {
                    atributo: "situacao_obra",
                    label: "Situacao da obra",
                    tipo: "categorica",
                    simbolo: "ponto",
                    legenda: [
                        {valor: "cadastrada", label: "Não iniciada", cor: "#f5df4d", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "em execucao", label: "Em execução", cor: "#0071bd", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "concluida", label: "Concluída", cor: "#4aff62", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "paralisada", label: "Paralisada", cor: "#e2001e", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "não se aplica", label: "Não se aplica", cor: "#ffffff", strokeColor: "#000000", strokeWidth: 1.0},
                        {valor: "cancelada", label: "Cancelada", cor: "#000000", strokeColor: "#000000", strokeWidth: 1.0},
                    ]
                },
            ]
        },
               
        {
            id: "informacoes_municipais", 
            nome: "Informações Municipais",
            visivel: false,
            minzoom: 3,
            variavelSel: "",
            variaveis: [
                {
                    atributo: "jenks_deficit_agua_rural_ibge",
                    label: "Déficit água rural - Municipal",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "72,68 - 100%", cor: "#d62828"},
                        {valor: 4, label: "47,54 - 72,68%", cor: "#f77f00"},
                        {valor: 3, label: "27,07 - 47,54%", cor: "#ffe066"},
                        {valor: 2, label: "10,21 - 27,07%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 10,21%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_deficit_esgoto_rural_ibge",
                    label: "Déficit esgoto rural - Municipal",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "86,61 - 100%", cor: "#d62828"},
                        {valor: 4, label: "68,81 - 86,61%", cor: "#f77f00"},
                        {valor: 3, label: "48,75 - 68,81%", cor: "#ffe066"},
                        {valor: 2, label: "25,45 - 48,75%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 25,45%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_deficit_residuo_rural_ibge",
                    label: "Déficit resíduos rural - Municipal",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "83,13 - 100%", cor: "#d62828"},
                        {valor: 4, label: "64,57 - 83,13%", cor: "#f77f00"},
                        {valor: 3, label: "45,11 - 64,57%", cor: "#ffe066"},
                        {valor: 2, label: "23,18 - 45,11%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 23,18%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_deficit_banheiro_rural_ibge",
                    label: "Déficit banheiro rural - Municipal",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "55,89 - 100%", cor: "#d62828"},
                        {valor: 4, label: "35,55 - 55,89%", cor: "#f77f00"},
                        {valor: 3, label: "17,57 - 35,55%", cor: "#ffe066"},
                        {valor: 2, label: "5,85 - 17,57%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 5,85%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_deficit_agua_urbana_ibge",
                    label: "Déficit água urbano - Municipal",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "66,26 - 100%", cor: "#d62828"},
                        {valor: 4, label: "33,52 - 66,26%", cor: "#f77f00"},
                        {valor: 3, label: "15,40 - 33,52%", cor: "#ffe066"},
                        {valor: 2, label: "4,66 - 15,40%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 4,66%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_deficit_esgoto_urbana_ibge",
                    label: "Déficit esgoto urbano - Municipal",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "79,52 - 100%", cor: "#d62828"},
                        {valor: 4, label: "54,66 - 79,52%", cor: "#f77f00"},
                        {valor: 3, label: "31,11 - 54,66%", cor: "#ffe066"},
                        {valor: 2, label: "12,16 - 31,11%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 12,16%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_deficit_residuo_urbana_ibge",
                    label: "Déficit resíduos urbano - Municipal",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "38,29 - 100%", cor: "#d62828"},
                        {valor: 4, label: "18,86 - 38,29%", cor: "#f77f00"},
                        {valor: 3, label: "7,84 - 18,86%", cor: "#ffe066"},
                        {valor: 2, label: "2,39 - 7,84%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 2,39%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_deficit_banheiro_urbana_ibge",
                    label: "Déficit banheiro urbano - Municipal",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "23,01 - 100%", cor: "#d62828"},
                        {valor: 4, label: "10,78 - 23,01%", cor: "#f77f00"},
                        {valor: 3, label: "4,64 - 10,78%", cor: "#ffe066"},
                        {valor: 2, label: "1,36 - 4,64%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 1,36%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "subgrupo",
                    label: "Subgrupo PAC",
                    tipo: "categorica",
                    simbolo: "poligono",
                    legenda: [
                        {valor: "G1", label: "G1", cor: "#d73027"},
                        {valor: "G2", label: "G2", cor: "#fc8d59"},
                        {valor: "G3", label: "G3", cor: "#049e91"}
                    ]
                },
                {
                    atributo: "tipo_catmetropol",
                    label: "Categoria Metropolitana",
                    tipo: "categorica",
                    simbolo: "poligono",
                    legenda: [
                        {valor: "Não Possui", label: "Não Possui", cor: "#ffffff"},
                        {valor: "RM", label: "RM", cor: "#46f3df"},
                        {valor: "RIDE, RM", label: "RIDE, RM", cor: "#00515c"},
                        {valor: "RIDE", label: "RIDE", cor: "#0034df"},
                        {valor: "RAIDE", label: "RAIDE", cor: "#867d00"},
                        {valor: "Entorno Metropolitano", label: "Entorno Metropolitano", cor: "#f5b352"},
                        {valor: "Colar Metropolitano", label: "Colar Metropolitano", cor: "#fc2f8f"},
                        {valor: "Área de Expansão Metropolitana", label: "Área de Expansão Metropolitana", cor: "#d62828"},
                    ]
                },
                {
                    atributo: "populacao_total_censo_2022_maior_50000",
                    label: "População 2022 >50 mil",
                    tipo: "booleana",
                    simbolo: "poligono",
                    legenda: [
                        {valor: false, label: "< 50 mil", cor: "#2a9d8f"},
                        {valor: true, label: "> 50 mil", cor: "#d62828"},
                    ]
                },
                {
                    atributo: "sinisa_adimplencia_gestao_municipal",
                    label: "SINISA - Adimplência Gestão Municipal",
                    tipo: "categorica",
                    simbolo: "poligono",
                    legenda: [
                        {valor: "adimplente", label: "Adimplente", cor: "#2a9d8f"},
                        {valor: "inadimplente", label: "Inadimplente", cor: "#d62828"},
                    ]
                },
                {
                    atributo: "sinisa_adimplencia_agua",
                    label: "SINISA - Adimplência Água",
                    tipo: "categorica",
                    simbolo: "poligono",
                    legenda: [
                        {valor: "adimplente", label: "Adimplente", cor: "#2a9d8f"},
                        {valor: "inadimplente", label: "Inadimplente", cor: "#d62828"},
                    ]
                },
                {
                    atributo: "sinisa_adimplencia_esgoto",
                    label: "SINISA - Adimplência Esgoto",
                    tipo: "categorica",
                    simbolo: "poligono",
                    legenda: [
                        {valor: "adimplente", label: "Adimplente", cor: "#2a9d8f"},
                        {valor: "inadimplente", label: "Inadimplente", cor: "#d62828"},
                    ]
                },
                {
                    atributo: "sinisa_declarou_possuir_pmsb",
                    label: "SINISA - Possui PMSB",
                    tipo: "categorica",
                    simbolo: "poligono",
                    legenda: [
                        {valor: "sim", label: "Sim", cor: "#2a9d8f"},
                        {valor: "em elaboração", label: "Em elaboração", cor: "#fc8d59"},
                        {valor: "sem resposta", label: "Sem resposta", cor: "#d62828"},
                    ]
                },
            ]
        },

        {
            id: "informacoes_setores_censitarios", 
            nome: "Informações Setores Censitarios",
            visivel: false,
            minzoom: 8,
            variavelSel: "",
            variaveis: [
                {
                    atributo: "jenks_perc_agua_forma_nao_adequada",
                    label: "Água - forma não adequada - Setores",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "81 - 100%", cor: "#d62828"},
                        {valor: 4, label: "51 - 81%", cor: "#f77f00"},
                        {valor: 3, label: "25 - 51%", cor: "#ffe066"},
                        {valor: 2, label: "7 - 25%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 7%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_perc_esgoto_tipo_nao_adequado",
                    label: "Esgoto - tipo não adequado - Setores",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "86 - 100%", cor: "#d62828"},
                        {valor: 4, label: "60 - 86%", cor: "#f77f00"},
                        {valor: 3, label: "36 - 60%", cor: "#ffe066"},
                        {valor: 2, label: "10 - 36%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 10%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_perc_lixo_destino_nao_adequado",
                    label: "Destino lixo não adequado - Setores",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "85 - 100%", cor: "#d62828"},
                        {valor: 4, label: "58 - 85%", cor: "#f77f00"},
                        {valor: 3, label: "31 - 58%", cor: "#ffe066"},
                        {valor: 2, label: "9 - 31%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 9%", cor: "#2d6a4f"},
                    ]
                },
                {
                    atributo: "jenks_perc_ban_sem_ban_exclusivo",
                    label: "Sem banheiro exclusivo - Setores",
                    tipo: "percentual_invertido",
                    simbolo: "poligono",
                    legenda: [
                        {valor: 5, label: "78 - 100%", cor: "#d62828"},
                        {valor: 4, label: "47 - 78%", cor: "#f77f00"},
                        {valor: 3, label: "23 - 47%", cor: "#ffe066"},
                        {valor: 2, label: "6 - 23%", cor: "#95d5b2"},
                        {valor: 1, label: "0 - 6%", cor: "#2d6a4f"},
                    ]
                },
            ]
        },
        
    ]);
    
    const {filtros} = useContext(FiltrosContext);
    const [painelCamadas, setPainelCamadas] = useState(false);
    const [painelLegenda, setPainelLegenda] = useState(false);
    const [painelFiltros, setPainelFiltros] = useState(false);
    const [painelDetalhe, setPainelDetalhe] = useState(false);
    const [zoomAtual, setZoomAtual] = useState(3);
    const [coord, setCoord] = useState({ lat: "", long: "" });
    const [featureSelecionada, setFeatureSelecionada] = useState(null);
    const [modoAnalise, setModoAnalise] = useState(false);
    const [coordenadas, setCoordenadas] = useState([]);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated, openLoginModal } = useAuth();

    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('')

    const mapContainer = useRef(null);
    const mapRef = useCriarMapa(mapContainer);
    const coordRef = useRef(null);

    //chamada das hooks com as funcionalidades principais
    useAdicionarLayers(mapRef, layers, filtros);
    useAplicarZoom(mapRef, filtros);
    useAtualizarSources(mapRef, filtros);
    useClicar(mapRef, layers, modoAnalise, setFeatureSelecionada);
    useTrocarSimbologia(mapRef, layers, modoAnalise);  

    
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const handleZoom = () => {setZoomAtual(map.getZoom())};
        map.on("zoomend", handleZoom);
        return () => {map.off("zoomend", handleZoom)}
    }, []);


    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const handleMouseMove = (e) => {
            if (!coordRef.current) return;
            coordRef.current.textContent = `Lat: ${e.lngLat.lat.toFixed(6)} | Lon: ${e.lngLat.lng.toFixed(6)}`;
        };
        map.on("mousemove", handleMouseMove);
        return () => {map.off("mousemove", handleMouseMove)};
    }, []);

  
    //função que alterna a visibilidade das camadas
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

    //função que alterna o mapa para o modo de análise
    const instrumentoSelecionado = !!(filtros.nr_instrumento || filtros.nr_proposta || filtros.cod_tci);
    function toggleModoAnalise() {
        if (!instrumentoSelecionado) {
            alert("Ative a camada Carteira DSR e filtre um único instrumento para poder ativar a análise.");
            return;
        }
        if (!isAuthenticated) {
            openLoginModal();
            return;
        }
        setModoAnalise(v => !v);
    }


    //useEffect que desliga o modo de análise caso o usuário deslique a camada carteira_dsr ou limpe o filtro de instrumento
    useEffect(() => {
        const carteira = layers.find(l => l.id === "geometrias_carteira_dsr");
        if (modoAnalise && (!instrumentoSelecionado || !carteira?.visivel)) {
            setModoAnalise(false);
        }
    }, [modoAnalise, instrumentoSelecionado, layers]);

    

    //chama a api pegando os dados das coordenadas do instrumento que estiver filtrado
    //copia os dados vindos da api para dentro de _coordenadaOriginal (_coordenadaOriginal vira um objeto dentro do objeto Coordenadas)
    //cria a flag _coordenadaAlterada
    //salva isso dentro do estado Coordenadas
    useEffect(() => {
        async function buscarAnaliseCoordenadas() {
            if (!instrumentoSelecionado) {
                setCoordenadas([]);
                return;
            }

            try {
                setLoading(true);
                const dadosAnaliseCoordenadas = 
                    await listarDadosAnaliseCoordenadas({nr_proposta: filtros.nr_proposta, nr_instrumento: filtros.nr_instrumento, cod_tci: filtros.cod_tci});

                const coordenadas = (dadosAnaliseCoordenadas || []).map(coordenada => ({
                    ...coordenada,
                    _coordenadaOriginal: {
                        id_coordenada: coordenada.id_coordenada,
                        situacao_analise: coordenada.situacao_analise,
                        cod_tci: coordenada.cod_tci,
                    },
                    _coordenadaAlterada: false,
                }));
                
                setCoordenadas(coordenadas);

            } catch (erro) {
                console.error(erro);
            } finally {
                setLoading(false);
            }
        }
        
        buscarAnaliseCoordenadas();

    }, [filtros.nr_proposta, filtros.nr_instrumento, filtros.cod_tci]);
   

    //console.log(coordenadas);
    //console.log(featureSelecionada);
      

    //pega um objeto coordenada e limpa as colunas, deixando apenas as colunas que devem persisitir para envio ao backend
    function dadosCoordenadaPersistencia(coordenada) {
        return {
            id_coordenada: coordenada.id_coordenada,
            situacao_analise: coordenada.situacao_analise ?? null,
            cod_tci: coordenada.cod_tci,
        }
    }

    //apenas testa se dois objetos são iguais
    function objetosIguais(a, b) {
        return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
    }



    //recebe uma coordenada específica e sua analise. Percorre o array de coordenadas do instrumento filtrado.
    //procrura no array até encontrar a coordenada específica recebida. Pega a analise recebida e atualiza jogando o novo valor no array. 
    //o estao Coordenadas vai ser atualizado, pois isso está dentro de um set
    //gera um objeto coordenada atualizada com a nova análise
    //compara se os dados a serem persistidos de coordendas atualizada são iguais a original, gerando a flag _coordenadaAlterada
    //ou seja essa função atualiza o estado e gera uma flag pra indicar se a atualização efetivou uma alteração ou não
    const atualizarAnaliseCoordenada = (idCoordenada, novaAnalise) => {
        setCoordenadas((current) =>
            current.map((coordenada) => {
            if (coordenada.id_coordenada !== idCoordenada) return coordenada

            const atualizado = {
                ...coordenada,
                situacao_analise: novaAnalise
            }

            return {
                ...atualizado,
                _coordenadaAlterada: !objetosIguais(
                dadosCoordenadaPersistencia(atualizado),
                coordenada._coordenadaOriginal
                ),
            }
            })
        )
    }

    
    //apenas testa se no estado coordenadas, tem alguma coordenada com alteração
    const possuiCoordenadasAlteradas = () => coordenadas.some(coordenada => coordenada._coordenadaAlterada);


    //prepara os dados para envio ao backend
    const montarPayloadAnaliseCoordenadas = () => ({
        coordenadas: coordenadas
            .filter(coordenada => coordenada._coordenadaAlterada)
            .map(dadosCoordenadaPersistencia),
        cod_tci
    });



    //essa função é chamada quando o usuário clicar no botão de salvar
    //chama montar payload e chama a função que envia os dados ao backend
    const salvarAnaliseCoordenadas = async () => {
        if (!possuiCoordenadasAlteradas()) return;

        setLoading(true);
        setMessage("");
        setMessageType("");

        try {
            const payload = montarPayloadAnaliseCoordenadas();

            const data =
                await enviarAnaliseCoordenadas(payload); 

            
            setMessage(data.mensagem);
            setMessageType("success");

        } catch (err) {
            setMessage(
                err?.response?.data?.detail ??
                "Não foi possível salvar as alterações."
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };



    return ( 
        <div className={estilos.mapa_box}>
            <button className={estilos.botaoFiltros} onClick={() => setPainelFiltros(!painelFiltros)}> <Filter className={estilos.Icon}/> <p className={estilos.IconTexto}> Filtros</p> </button>
            {painelFiltros && 
                <FiltroPainel
                    setPainelFiltros={setPainelFiltros}
                    setPainelDetalhe={setPainelDetalhe}
                    painelDetalhe={painelDetalhe}
                    layers={layers}
                />
            }
            <button className={estilos.botaoCamadas} onClick={() => setPainelCamadas(!painelCamadas)}> <Layers className={estilos.Icon}/> <p className={estilos.IconTexto}> Camadas</p> </button>
            <button className={estilos.botaoLegenda} onClick={() => setPainelLegenda(!painelLegenda)}> <List className={estilos.Icon}/> <p className={estilos.IconTexto}> Legenda</p> </button>
            <button className={`${estilos.botaoAnalisarCoordenadas} ${modoAnalise ? estilos.ativo : ""}`} onClick={toggleModoAnalise}> {modoAnalise ? "Análise Ativa" : "Analisar Coordenadas"}</button>
            {painelCamadas && (<CamadasSection layers={layers} toggleLayer={toggleLayer} alterarVariavel={alterarVariavel} setPainelCamadas={setPainelCamadas}/>)}
            {painelLegenda && (<LegendaSection layers={layers} zoomAtual={zoomAtual} setPainelLegenda={setPainelLegenda} painelCamadas={painelCamadas}/>)}
            <AnaliseCoordenadaSection 
                featureSelecionada={featureSelecionada}
                coordenadas={coordenadas}
                atualizarAnaliseCoordenada={atualizarAnaliseCoordenada}
                possuiCoordenadasAlteradas={possuiCoordenadasAlteradas()}
                salvarAnaliseCoordenadas={salvarAnaliseCoordenadas}/>
            <InputSection coord={coord} setCoord={setCoord} irParaCoordenada={irParaCoordenada} limparCoordenada={limparCoordenada}/>
            <div ref={coordRef} className={estilos.coordenadasMouse}> Lat: -- | Lon: -- </div>
            {(painelDetalhe && painelFiltros && filtros.cod_municipio) && (<DetalheSection setPainelDetalhe={setPainelDetalhe}/>)}
            <div ref={mapContainer} className={estilos.mapContainer}/>
        </div>
    );
}