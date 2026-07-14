import { useEffect } from "react";
import { gerarMatchLegenda } from "../../utils/mapaUtils";

//esse hook faz a troca da simbologia do mapa de acordo com a variável escolhida

export function useTrocarSimbologia(mapRef, layers) {

    useEffect(() => {

        const map = mapRef.current;
        if (!map) return;

        
        async function atualizarClassificacoes() {

            for (const layer of layers) {

                if (!layer.variaveis) continue;
                if (!map.getLayer(layer.id)) continue;
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

    }, [layers]);
}