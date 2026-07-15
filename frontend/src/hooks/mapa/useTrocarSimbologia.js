import { useEffect } from "react";
import { gerarMatchLegenda, gerarMatch } from "../../utils/mapaUtils";

//esse hook faz a troca da simbologia do mapa de acordo com a variável escolhida

export function useTrocarSimbologia(mapRef, layers, modoAnalise) {

    useEffect(() => {

        const map = mapRef.current;
        if (!map) return;

        
        async function atualizarClassificacoes() {

            for (const layer of layers) {

                if (!map.getLayer(layer.id)) continue;
                if (layer.id === "geometrias_carteira_dsr") {
                    if (modoAnalise) {
                        map.setPaintProperty(layer.id, "circle-color", "#9E9E9E");
                        map.setPaintProperty(layer.id, "circle-stroke-color", ["case", ["boolean", ["feature-state", "selected"], false], "#ffff00", "#666666"]);
                        map.setPaintProperty(layer.id, "circle-stroke-width", ["case", ["boolean", ["feature-state", "selected"], false], 3, 0]);
                    } else {
                        map.setPaintProperty(layer.id, "circle-color", gerarMatch(layer.simbologia, "cor", "#000000"));
                        map.setPaintProperty(layer.id, "circle-stroke-color", gerarMatch(layer.simbologia, "strokeColor", "#000000"));
                        map.setPaintProperty(layer.id, "circle-stroke-width", gerarMatch(layer.simbologia, "strokeWidth", 0));
                    }
                    continue;
                }
                if (!layer.variaveis) continue;
                if (!layer.variavelSel) {map.setPaintProperty(layer.id, "fill-color", "#e7e1e1"); continue;}

                const variavelConfig = layer.variaveis.find(v => v.value === layer.variavelSel);
                
                if (!variavelConfig) {map.setPaintProperty(layer.id, "fill-color", "#e7e1e1"); continue;}

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

    }, [layers, modoAnalise]);
}