import estilos from "./LegendaSection.module.css"



export default function LegendaSection({layers, zoomAtual}) {
    

    const camadasComLegenda = layers.filter(layer => layer.visivel && layer.simbologia && zoomAtual >= (layer.minzoom ?? 0));
    const informacoesMunicipais = layers.find(l => l.id === "informacoes_municipais");
    const variavelAtual = informacoesMunicipais?.variaveis.find(v => v.value === informacoesMunicipais.variavelSel);
    
    return (
        <div className={estilos.legenda}>

            {camadasComLegenda.map(layer => (
                <div key={layer.id}>

                    {layer.simbologia.tipo === "categorica" && (<h4>{layer.nome}</h4>)}

                    {layer.simbologia.tipo === "categorica" && layer.simbologia.simbolo === "ponto" && layer.simbologia.classes.map(classe => (
                        <div key={classe.valor}>
                            <span className={estilos.ponto}
                                    style={{ 
                                        background: classe.cor,
                                        borderColor: classe.strokeColor,
                                        borderWidth: `${classe.strokeWidth}px`
                                    }}
                            />
                            {classe.label}
                        </div>
                    ))}


                    {layer.simbologia.tipo === "simples" && layer.simbologia.simbolo === "ponto" && (
                        <div>
                            <span className={estilos.ponto}
                                    style={{ 
                                        background: layer.simbologia.cor,
                                        borderColor: layer.simbologia.strokeColor,
                                        borderWidth: `${layer.simbologia.strokeWidth}px`
                                    }}
                            />
                            {layer.nome}
                        </div>
                    )}

                    {layer.simbologia.tipo === "categorica" && layer.simbologia.simbolo === "linhaPontilhada" && layer.simbologia.classes.map(classe => (
                        <div key={classe.valor}>
                            <span className={estilos.linhaPontilhada}
                                    style={{ borderColor: classe.cor }}
                            />
                            {classe.label}
                        </div>
                    ))}



                    {layer.simbologia.tipo === "simples" && layer.simbologia.simbolo === "linha" && (
                        <div>
                            <span className={estilos.linha}
                                style={{ borderColor: layer.simbologia.cor }}
                            />
                            {layer.nome}
                        </div>
                    )}

                </div>
            ))}

            {informacoesMunicipais?.visivel && variavelAtual?.legenda && (
                <div>
                    <h4>{variavelAtual.label}</h4>
                    {variavelAtual.legenda.map(item => (
                        <div key={String(item.label)}>
                            <span className={estilos.poligono}
                                style={{ background: item.cor }}
                            />
                            {String(item.label)}
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
} 