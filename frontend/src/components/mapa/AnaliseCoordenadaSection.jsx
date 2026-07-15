import estilos from "./AnaliseCoordenadaSection.module.css";


export default function AnaliseCoordenadaSection({featureSelecionada}) {
    
    if (!featureSelecionada) return null;

    return(
        <div className={estilos.painel}>
            <h4>Análise da coordenada selecionada</h4>
            
            <div className={estilos.conteudo}>
                <label>
                    <input
                        type="radio"
                        name="analise"
                        value="correta"
                    />
                    Correta
                </label>

                <label>
                    <input
                        type="radio"
                        name="analise"
                        value="erro_solicitar"
                    />
                    Errada (correção a ser solicitada)
                </label>

                <label>
                    <input
                        type="radio"
                        name="analise"
                        value="erro_solicitada"
                    />
                    Errada (correção já solicitada)
                </label>
            </div>
        </div>
    )
}