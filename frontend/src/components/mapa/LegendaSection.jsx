import estilos from "./LegendaSection.module.css"
import { X } from "lucide-react";



export default function LegendaSection({layers, zoomAtual, setPainelLegenda, painelCamadas}) {
    

    const camadasComLegenda = layers.filter(layer => layer.visivel && layer.simbologia && zoomAtual >= (layer.minzoom ?? 0));
    const camadasVariaveis = layers.filter(layer => layer.visivel && layer.variaveis && layer.variavelSel && zoomAtual >= (layer.minzoom ?? 0));
    
    return (
        <div className={`${estilos.legenda} ${painelCamadas ? estilos.comCamadas : estilos.semCamadas}`}>
            <div className={estilos.legendaCabecalho}>
                    <div className={estilos.titulo}>
                        <p>Legenda</p>
                    </div>
                    <button 
                        className={estilos.botaoX}
                        onClick={() => {setPainelLegenda(false)}}>
                        <X className={estilos.XFechar} />
                    </button>
            </div>

            <div className={estilos.conteudo}>
                {camadasComLegenda.map(layer => (
                    <div key={layer.id}>

                        {layer.simbologia.tipo === "categorica" && (<h4>{layer.nome}</h4>)}

                        {layer.simbologia.tipo === "categorica" && layer.simbologia.simbolo === "ponto" && layer.simbologia.classes.map(classe => (
                            <div className={estilos.itemLegenda} key={classe.valor}>
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
                            <div className={estilos.itemLegenda}>
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
                            <div className={estilos.itemLegenda} key={classe.valor}>
                                <span className={estilos.linhaPontilhada}
                                        style={{ borderColor: classe.cor }}
                                />
                                {classe.label}
                            </div>
                        ))}


                        {layer.simbologia.tipo === "categorica" && layer.simbologia.simbolo === "poligono" && layer.simbologia.classes.map(classe => (
                            <div className={estilos.itemLegenda} key={classe.valor}>
                                <span className={estilos.poligono}
                                        style={{ background: classe.cor }}
                                />
                                {classe.label}
                            </div>
                        ))}



                        {layer.simbologia.tipo === "simples" && layer.simbologia.simbolo === "linha" && (
                            <div className={estilos.itemLegenda}>
                                <span className={estilos.linha}
                                    style={{ borderColor: layer.simbologia.cor }}
                                />
                                {layer.nome}
                            </div>
                        )}

                    </div>
                ))}

                {camadasVariaveis.map(layer => {const variavelAtual = layer.variaveis.find(v => v.atributo === layer.variavelSel);

                    if (!variavelAtual?.legenda) return null;

                    return (
                        <div key={layer.id}>
                            <h4>{variavelAtual.label}</h4>

                            {variavelAtual.legenda.map(item => (
                                <div className={estilos.itemLegenda} key={String(item.label)}>
                                    {variavelAtual.simbolo === "ponto" ? (
                                        <span
                                            className={estilos.ponto}
                                            style={{background: item.cor, borderColor: item.strokeColor, borderWidth: item.strokeWidth}}
                                        />
                                    ) : (
                                        <span
                                            className={estilos.poligono}
                                            style={{ background: item.cor }}
                                        />
                                    )}
                                    {String(item.label)}
                                </div>
                            ))}
                        </div> 
                    );
                })}
            </div>
        </div>
    );
} 