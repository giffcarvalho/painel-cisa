import estilos from "./AnaliseCoordenadaSection.module.css";


export default function AnaliseCoordenadaSection({featureSelecionada, coordenadas, atualizarAnaliseCoordenada, possuiCoordenadasAlteradas, salvarAnaliseCoordenadas}) {
    
    if (!featureSelecionada) return null;

    const coordenada = coordenadas.find(c => c.id_coordenada === featureSelecionada.id);
    
    console.log(featureSelecionada);
    console.log(coordenadas);
    console.log(coordenadas.find(c => c.id_coordenada === featureSelecionada.id));

    const valorSelecionado = coordenada?.situacao_analise ?? "";
    
    function alterarAnalise(e) {atualizarAnaliseCoordenada(featureSelecionada.id, e.target.value)}

    return(
        <div className={estilos.caixa_externa}>
            <div className={estilos.painel_opcoes}>
                <h4>Análise da coordenada selecionada</h4>
                
                <div className={estilos.conteudo}>
                    <div className={estilos.correta}>
                        <label>
                            <input
                                type="radio"
                                name="analise"
                                value="Correta"
                                checked={valorSelecionado === "Correta"}
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
                                value="Errada (correção a ser solicitada)"
                                checked={valorSelecionado === "Errada (correção a ser solicitada)"}
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
                                value="Errada (correção já solicitada)"
                                checked={valorSelecionado === "Errada (correção já solicitada)"}
                                onChange={alterarAnalise}
                            />
                            Errada (correção já solicitada)
                        </label>
                    </div>
                </div>
            </div>
            <button className={`${estilos.botao_salvar} ${possuiCoordenadasAlteradas ? estilos.botao_salvar_ativo : ""}`} onClick={salvarAnaliseCoordenadas} disabled={!possuiCoordenadasAlteradas}> Salvar Análise das Coordenadas</button>
        </div>
    )
}