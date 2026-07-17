import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import estilos from "../../components/mapa/Popup.module.css"


//esse hook é responsável pelas ações decorrentes de clique nas feições

export function useClicar(mapRef, layers, modoAnalise, setFeatureSelecionada) {
        
    const featureSelecionadaRef = useRef(null);
    const popupRef = useRef(null);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        

        const camadas = [ "enderecos_2022", "setores_censitarios_2022_fill", "geometrias_carteira_dsr", "geometrias_carteira_drf", "informacoes_municipais", "informacoes_setores_censitarios"];
        

        function handleClick(e) {
            const features = map.queryRenderedFeatures(e.point, { layers: camadas });

            if (!features.length) {
                if (featureSelecionadaRef.current) {
                    map.setFeatureState(featureSelecionadaRef.current,{ selected: false });
                    featureSelecionadaRef.current = null;
                    setFeatureSelecionada(null);
                }
                return;
            }

            const f = features[0];
            const props = f.properties;
            const layerConfig = layers.find(l => l.id === f.layer.id);
            

            if (modoAnalise && f.layer.id !== "geometrias_carteira_dsr" && featureSelecionadaRef.current) {
                map.setFeatureState(featureSelecionadaRef.current, {selected: false});
                featureSelecionadaRef.current = null;
                setFeatureSelecionada(null);
            }
            
            if (modoAnalise && f.layer.id === "geometrias_carteira_dsr") {
                if (featureSelecionadaRef.current) {
                    map.setFeatureState(featureSelecionadaRef.current, { selected: false });
                }
                const estado = {source: f.source, sourceLayer: f.sourceLayer, id: f.id};
                map.setFeatureState(estado, {selected: true});
                featureSelecionadaRef.current = estado;
                setFeatureSelecionada(f);
            }

            
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
                <strong> Código IBGE: </strong> ${props.cod_municipio} <br>
                <br/>
                <strong> ${props.situacao} </strong> <br>
                ${props.situacao_detalhada}
                `;
            }

            if (f.layer.id === "geometrias_carteira_dsr") {
                html += `
                <strong> Modalidade </strong> <br>
                ${props.modalidade}<br/>
                <br/>
                ${props.nr_proposta != null? `<strong> Proposta: </strong> ${props.nr_proposta} <br>`: ""}
                ${props.nr_instrumento != null? `<strong> Instrumento: </strong> ${props.nr_instrumento} <br>`: ""}
                ${props.cod_tci != null? `<strong> Código TCI: </strong> ${props.cod_tci} <br>`: ""}
                <br/>
                <strong> Objeto: </strong> ${props.objeto} <br>
                <br/>
                ${props.valor_global != null? `<strong> Valor Global: </strong> ${Number(props.valor_global).toLocaleString("pt-BR")} <br>`: ""}
                ${props.valor_repasse != null? `<strong> Valor Repasse: </strong> ${Number(props.valor_repasse).toLocaleString("pt-BR")} <br>`: ""}
                ${props.situacao_projeto != null? `<strong> Situacao do Projeto: </strong> ${props.situacao_projeto} <br>`: ""}
                ${props.situacao_obra != null? `<strong> Situacao da Obra: </strong> ${props.situacao_obra} <br>`: ""}
                <br/>
                ${props.link_transferegov? `<a href="${props.link_transferegov}" target="_blank" rel="noopener noreferrer">Link Transferegov</a><br>`: ""}
                ${props.link_saci? `<a href="${props.link_saci}" target="_blank" rel="noopener noreferrer">Link Saci</a>`: ""}
                `; 
            }


            if (f.layer.id === "geometrias_carteira_drf") {
                html += `
                <strong> Modalidade </strong> <br>
                ${props.modalidade}<br/>
                <br/>
                ${props.nr_proposta != null? `<strong> Proposta: </strong> ${props.nr_proposta} <br>`: ""}
                ${props.nr_instrumento != null? `<strong> Instrumento: </strong> ${props.nr_instrumento} <br>`: ""}
                ${props.cod_tci != null? `<strong> Código TCI: </strong> ${props.cod_tci} <br>`: ""}
                <br/>
                <strong> Objeto: </strong> ${props.objeto} <br>
                <br/>
                ${props.link_transferegov? `<a href="${props.link_transferegov}" target="_blank" rel="noopener noreferrer">Link Transferegov</a><br>`: ""}
                ${props.link_saci? `<a href="${props.link_saci}" target="_blank" rel="noopener noreferrer">Link Saci</a>`: ""}
                `; 
            }


            if (f.layer.id === "informacoes_setores_censitarios") {
                
                html += `
                    <strong>Situação:</strong> ${props.situacao}<br>
                    <strong>Município:</strong> ${props.nome_municipio}<br> 
                    <strong>População no setor:</strong> ${Number(props.total_pessoas).toLocaleString("pt-BR")}<br>
                    <strong>Total de domicílios:</strong> ${Number(props.total_domicilios).toLocaleString("pt-BR")}<br>
                    <strong>DPPO:</strong> ${Number(props.dppo_domicilios_particulares_permanentes_ocupados).toLocaleString("pt-BR")}<br>
                `;

                const variavelConfig = layerConfig?.variaveis?.find(v => v.atributo === layerConfig?.variavelSel);

                if (variavelConfig) {

                    let valor;
                    
                    if (variavelConfig.tipo === "booleana") {
                        valor = props[variavelConfig.atributo] ? "Sim" : "Não";
                    }
                    else if (variavelConfig.atributo.startsWith("jenks_")) {
                        const campo = variavelConfig.atributo.replace(/^jenks_/, "");
                        valor = props[campo] != null? `${(props[campo] * 1).toFixed(2)}%`: null;
                    } else {
                        valor = props[variavelConfig.atributo];
                    }


                    if (valor != null) {
                        html += `<br><strong>${variavelConfig.label}:</strong> ${valor}`;
                    }
                }
            }



            if (f.layer.id === "informacoes_municipais") {
                
                html += `
                    <strong>Município:</strong> ${props.nome}<br>
                    <strong> Código IBGE: </strong> ${props.cod_ibge} <br>
                    <strong>População 2022:</strong> ${Number(props.populacao_total_censo_2022).toLocaleString("pt-BR")}<br>
                    <strong>Categ. Metrop.:</strong> ${props.label_catmetropol}<br>
                    <strong>RM Prioritária:</strong>${props.rm_prioritaria == null? " -": props.rm_prioritaria? "Sim": "Não"}<br>
                    <strong>Subgrupo:</strong> ${props.subgrupo}<br>
                `;

                const variavelConfig = layerConfig?.variaveis?.find(v => v.atributo === layerConfig?.variavelSel);

                if (variavelConfig) {

                    let valor;
                    
                    if (variavelConfig.tipo === "booleana") {
                        valor = props[variavelConfig.atributo] ? "Sim" : "Não";
                    }
                    else if (variavelConfig.atributo.startsWith("jenks_")) {
                        const campo = variavelConfig.atributo.replace(/^jenks_/, "");
                        valor = props[campo] != null? `${(props[campo] * 100).toFixed(2)}%`: null;
                    } else {
                        valor = props[variavelConfig.atributo];
                    }


                    if (valor != null) {
                        html += `<br><strong>${variavelConfig.label}:</strong> ${valor}`;
                    }
                }
            }

            
            popupRef.current?.remove();
            popupRef.current = new maplibregl.Popup({
                className: estilos.popup,
                maxWidth: "380px"
            })
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);
        }

        map.on("click", handleClick);

        return () => {map.off("click", handleClick);};

    }, [layers, modoAnalise]);

    //useEffect para limpar a feição selecionar quando o modo analise é desativado
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (!modoAnalise && featureSelecionadaRef.current) {
            map.setFeatureState(featureSelecionadaRef.current, { selected: false });
            featureSelecionadaRef.current = null;
            setFeatureSelecionada(null);
        }
    }, [modoAnalise]);
}