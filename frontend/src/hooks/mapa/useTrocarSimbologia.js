import { useEffect } from "react";
import { gerarMatch, gerarMatchSituacaoAnalise } from "../../utils/mapaUtils";

// esse hook faz a troca da simbologia do mapa de acordo com a variável escolhida

export function useTrocarSimbologia(mapRef, layers, modoAnalise) {

    useEffect(() => {

        const map = mapRef.current;
        if (!map) return;

        for (const layer of layers) {

            if (!map.getLayer(layer.id)) continue;
            if (!layer.variaveis?.length) continue;

            const variavelConfig = layer.variaveis.find(v => v.atributo === layer.variavelSel);
            const simbolo = layer.variaveis[0]?.simbolo;
            const strokeColorAnalise = ["case", ["boolean", ["feature-state", "selected"], false], "#ffff00", "#b1b1b1"];
            const strokeWidthAnalise = ["case", ["boolean", ["feature-state", "selected"], false], 3, 2];

            // sem variável selecionada
            if (!variavelConfig) {
                if (simbolo === "ponto") {
                    map.setPaintProperty(layer.id, "circle-color", "#ffffff");
                    if (modoAnalise && layer.id === "geometrias_carteira_dsr") {
                        map.setPaintProperty(layer.id, "circle-stroke-color", strokeColorAnalise);
                        map.setPaintProperty(layer.id, "circle-stroke-width", strokeWidthAnalise);
                    } else {
                        map.setPaintProperty(layer.id, "circle-stroke-color", "#b1b1b1");
                        map.setPaintProperty(layer.id, "circle-stroke-width", 2);
                    }
                } else {
                    map.setPaintProperty(layer.id, "fill-color", "#e7e1e1");
                }
                continue;
            }

            
            // CAMADAS DE PONTO
            if (variavelConfig.simbolo === "ponto") {

                let expressaoCor;

                if (
                    modoAnalise &&
                    layer.id === "geometrias_carteira_dsr" &&
                    variavelConfig.atributo === "situacao_analise"
                ) {
                    expressaoCor = gerarMatchSituacaoAnalise(
                        variavelConfig.atributo,
                        variavelConfig.legenda,
                        "cor",
                        "#ffffff"
                    );
                } else {
                    expressaoCor = gerarMatch(
                        variavelConfig.atributo,
                        variavelConfig.legenda,
                        "cor",
                        "#ffffff"
                    );
                }

                map.setPaintProperty(
                    layer.id,
                    "circle-color",
                    expressaoCor
                );

                if (modoAnalise && layer.id === "geometrias_carteira_dsr") {
                    map.setPaintProperty(
                        layer.id,
                        "circle-stroke-color",
                        strokeColorAnalise
                    );

                    map.setPaintProperty(
                        layer.id,
                        "circle-stroke-width",
                        strokeWidthAnalise
                    );
                } else {
                    map.setPaintProperty(
                        layer.id,
                        "circle-stroke-color",
                        gerarMatch(
                            variavelConfig.atributo,
                            variavelConfig.legenda,
                            "strokeColor",
                            "#b1b1b1"
                        )
                    );

                    map.setPaintProperty(
                        layer.id,
                        "circle-stroke-width",
                        gerarMatch(
                            variavelConfig.atributo,
                            variavelConfig.legenda,
                            "strokeWidth",
                            0
                        )
                    );
                }

                continue;
            }


            // CAMADAS DE POLÍGONO
            if (variavelConfig.tipo === "booleana") {
                map.setPaintProperty(
                    layer.id,
                    "fill-color",
                    [
                        "case",
                        ["get", variavelConfig.atributo],
                        variavelConfig.legenda.find(i => i.valor === true).cor,
                        variavelConfig.legenda.find(i => i.valor === false).cor
                    ]
                );
            } else {
                map.setPaintProperty(
                    layer.id,
                    "fill-color",
                    gerarMatch(
                        variavelConfig.atributo,
                        variavelConfig.legenda,
                        "cor",
                        "#e7e1e1"
                    )
                );
            }
        }
    }, [layers, modoAnalise]);
}