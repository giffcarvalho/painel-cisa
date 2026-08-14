import estilos from "./AnaliseCoordenadaSection.module.css";
import { useState } from "react";


export default function AnaliseCoordenadaSection({
    featureSelecionada,
    coordenadas,
    atualizarAnaliseCoordenada,
    possuiCoordenadasAlteradas,
    salvarAnaliseCoordenadas,
    navegarCoordenada,
    loading,
    sucessoEnviado
}) {
    
    const coordenada = featureSelecionada? coordenadas.find(c => c.id_coordenada === featureSelecionada.id): null;
    const valorSelecionado = coordenada?.situacao_analise ?? "";
    const indiceAtual = featureSelecionada? coordenadas.findIndex(coordenada => coordenada.id_coordenada === featureSelecionada.id): -1;
    const totalCoordenadas = coordenadas.length;
    const posicaoAtual = featureSelecionada && indiceAtual !== -1 ? indiceAtual + 1 : 0;
    const anteriorDesabilitado = coordenadas.length === 0 || indiceAtual <= 0;
    const proximaDesabilitado = coordenadas.length === 0 || (indiceAtual !== -1 && indiceAtual === coordenadas.length - 1);
    const obterTextoBotao = () => {
        if (loading) return "Enviando ....";
        if (sucessoEnviado && !possuiCoordenadasAlteradas) return "Análise Enviada";
        return "Salvar e Enviar análise";
    };
    const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
    const [observacao, setObservacao] = useState('');
    const abrirConfirmacao = () => {setConfirmacaoAberta(true)};
    const fecharConfirmacao = () => {
        setConfirmacaoAberta(false);
        setObservacao('');
    };
    const submeterConfirmacao = (e) => {
        e.preventDefault();
        salvarAnaliseCoordenadas(observacao);
        fecharConfirmacao();
    };
    
    function alterarAnalise(e) {atualizarAnaliseCoordenada(featureSelecionada.id, e.target.value)}
    

    return(
        <div className={estilos.caixa_externa}>
            <div className={estilos.painel_opcoes}>

                <h4>Selecionar coordenada:</h4>

                <div className={estilos.caixa_navegacao}>
                    <button 
                        className={estilos.texto_navegacao}
                        onClick={() => navegarCoordenada(-1)}
                        disabled={anteriorDesabilitado}
                    >
                        Anterior
                    </button>
                    <span className={estilos.contador}>
                        {posicaoAtual}/{totalCoordenadas}
                    </span>
                    <button 
                        className={estilos.texto_navegacao}
                        onClick={() => navegarCoordenada(1)}
                        disabled={proximaDesabilitado}
                    >
                        {indiceAtual === -1 ? "Iniciar" : "Próxima"}
                    </button>
                </div>

                <h4>Análise da coordenada selecionada:</h4>

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

                    <div className={estilos.errada}>
                        <label>
                            <input
                                type="radio"
                                name="analise"
                                value="Município errado"
                                checked={valorSelecionado === "Município errado"}
                                onChange={alterarAnalise}
                            />
                            Município errado
                        </label>
                    </div>

                    <div className={estilos.errada}>
                        <label>
                            <input
                                type="radio"
                                name="analise"
                                value="Local genérico - sede"
                                checked={valorSelecionado === "Local genérico - sede"}
                                onChange={alterarAnalise}
                            />
                            Local genérico - sede
                        </label>
                    </div>

                    <div className={estilos.errada}>
                        <label>
                            <input
                                type="radio"
                                name="analise"
                                value="Local incoerente"
                                checked={valorSelecionado === "Local incoerente"}
                                onChange={alterarAnalise}
                            />
                            Local incoerente
                        </label>
                    </div>

                    <div className={estilos.errada}>
                        <label>
                            <input
                                type="radio"
                                name="analise"
                                value="Incoerência urbano/rural"
                                checked={valorSelecionado === "Incoerência urbano/rural"}
                                onChange={alterarAnalise}
                            />
                            Incoerência urbano/rural
                        </label>
                    </div>
                </div>
            </div>
            
            <button 
                className={`${estilos.botao_salvar} ${possuiCoordenadasAlteradas && !loading ? estilos.botao_salvar_ativo : ""}`} 
                onClick={abrirConfirmacao} 
                disabled={!possuiCoordenadasAlteradas || loading}
            > 
                {obterTextoBotao()}
            </button>


            {confirmacaoAberta && (
                <div className={estilos.overlay_modal}>
                    <div className={estilos.janela_confirmacao}>
                        <h4 className={estilos.titulo_confirmacao}>Resumo das Alterações</h4>
                        
                        {/* TABELA DE RESUMO */}
                        <div className={estilos.container_tabela}>
                            <table className={estilos.tabela_resumo}>
                                <thead>
                                    <tr>
                                        <th>Id</th>
                                        <th>Análise anterior</th>
                                        <th>Análise atual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coordenadas.map((item, index) => {
                                        const analiseAnterior = item._coordenadaOriginal?.situacao_analise ?? "Sem análise";
                                        const analiseAtual = item._coordenadaAlterada 
                                            ? (item.situacao_analise || "Sem análise")
                                            : "(não alterada)";

                                        return (
                                            <tr key={item.id_coordenada || index}>
                                                <td className={estilos.coluna_id}>{index + 1}</td>
                                                <td>{analiseAnterior}</td>
                                                <td className={item._coordenadaAlterada ? estilos.item_alterado : ""}>
                                                    {analiseAtual}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className={estilos.titulo_comentario}>Somente as coordenadas com alteração na análise serão enviadas</p>
                        {/* FORMULÁRIO DE ENVIO */}
                        <form onSubmit={submeterConfirmacao}>
                            <textarea
                                className={estilos.texto_observacao}
                                rows="3"
                                maxLength={150}
                                placeholder="Observação opcional"
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                            />

                            <div className={estilos.area_botoes_confirmacao}>
                                <button 
                                    type="button" 
                                    className={estilos.botao_cancelar} 
                                    onClick={fecharConfirmacao}
                                >
                                    Voltar e continuar análise
                                </button>
                                <button 
                                    type="submit" 
                                    className={estilos.botao_confirmar}
                                >
                                    Confirmar e Enviar
                                </button>
                            </div>
                        </form>
                        
                    </div>
                </div>
            )}

        </div>
    )
}