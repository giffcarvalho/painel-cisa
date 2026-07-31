import estilos from "./AnaliseCoordenadaSection.module.css";


export default function AnaliseCoordenadaSection({featureSelecionada, analises, setAnalises}) {
    
    if (!featureSelecionada) return null;
    const valorSelecionado = analises[featureSelecionada?.id] ?? "";
    
    function alterarAnalise(e) {setAnalises(prev => ({...prev, [featureSelecionada.id]: e.target.value}))}

    return(
        <div className={estilos.painel}>
            <h4>Análise da coordenada selecionada</h4>
            
            <div className={estilos.conteudo}>
                <div className={estilos.correta}>
                    <label>
                        <input
                            type="radio"
                            name="analise"
                            value="correta"
                            checked={valorSelecionado === "correta"}
                            onChange={alterarAnalise}
                        />
                        Correta
                    </label>
                </div>

                <div className={estilos.erro_solicitar}>
                    <label>
                        <input
                            type="radio"
                            name="analise"
                            value="erro_solicitar"
                            checked={valorSelecionado === "erro_solicitar"}
                            onChange={alterarAnalise}
                        />
                        Errada (correção a ser solicitada)
                    </label>
                </div>

                <div className={estilos.erro_solicitada}>
                    <label>
                        <input
                            type="radio"
                            name="analise"
                            value="erro_solicitada"
                            checked={valorSelecionado === "erro_solicitada"}
                            onChange={alterarAnalise}
                        />
                        Errada (correção já solicitada)
                    </label>
                </div>
            </div>
        </div>
    )
}