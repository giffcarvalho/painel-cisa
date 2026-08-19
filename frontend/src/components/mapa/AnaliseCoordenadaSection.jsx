import estilos from "./AnaliseCoordenadaSection.module.css";
import { useState } from "react";
import { pdf } from '@react-pdf/renderer';
import { AnaliseCoordenadaPdf } from './AnaliseCoordenadaPdf';


export default function AnaliseCoordenadaSection({
    featureSelecionada,
    coordenadas,
    atualizarAnaliseCoordenada,
    possuiCoordenadasAlteradas,
    salvarAnaliseCoordenadas,
    navegarCoordenada,
    loading,
    identificador,
    situacaoCorrecao,
    setSituacaoCorrecao,
    observacaoGeral,
    setObservacaoGeral,
    painelFiltros,
    setModoAnalise,
    restaurarEstadoOriginal,
}) {
    
    
    const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
    const [erroEnvio, setErroEnvio] = useState(null);
    const [sucessoEnvio, setSucessoEnvio] = useState(null);
    const coordenada = featureSelecionada? coordenadas.find(c => c.id_coordenada === featureSelecionada.id): null;
    const valorSelecionado = coordenada?.situacao_analise ?? "";
    const indiceAtual = featureSelecionada? coordenadas.findIndex(coordenada => coordenada.id_coordenada === featureSelecionada.id): -1;
    const totalCoordenadas = coordenadas.length;
    const posicaoAtual = featureSelecionada && indiceAtual !== -1 ? indiceAtual + 1 : 0;
    const anteriorDesabilitado = coordenadas.length === 0 || indiceAtual <= 0;
    const proximaDesabilitado = coordenadas.length === 0 || (indiceAtual !== -1 && indiceAtual === coordenadas.length - 1);
    
    const obterTextoBotao = () => {
        if (loading) return "Carregando ....";
        if (possuiCoordenadasAlteradas) return "Ver resumo / Salvar";
        return "Ver resumo";
    };

    const abrirConfirmacao = () => {
        setErroEnvio(null);
        setSucessoEnvio(null);
        setConfirmacaoAberta(true);
    };

    const fecharConfirmacao = () => {
        setErroEnvio(null);
        setSucessoEnvio(null);
        setConfirmacaoAberta(false);
    };

    const submeterConfirmacao = async (e) => {
        e.preventDefault();
        setErroEnvio(null);
        setSucessoEnvio(null);

        try {
            await salvarAnaliseCoordenadas();
            setSucessoEnvio("Análise enviada com sucesso!");
        } catch (error) {
            setErroEnvio(error.message);
        }
    };

    const handleObservacaoChange = (e) => {
        setObservacaoGeral(e.target.value);
        if (sucessoEnvio) setSucessoEnvio(null);
        if (erroEnvio) setErroEnvio(null);
    };

    const handleSituacaoCorrecaoChange = (e) => {
        setSituacaoCorrecao(e.target.value);
        if (sucessoEnvio) setSucessoEnvio(null);
        if (erroEnvio) setErroEnvio(null);
    };
    

    function alterarAnalise(e) {
        if (featureSelecionada?.id) {
            atualizarAnaliseCoordenada(featureSelecionada.id, e.target.value);
        }
    }

    const handleCancelarAnalise = () => {
        restaurarEstadoOriginal();
        setModoAnalise(false);
    };



    //função para gerar o resumo da anpalise em pdf 
    const handleExportarPDF = async () => {
    
        const blob = await pdf(
            <AnaliseCoordenadaPdf
            identificador={identificador}
            coordenadas={coordenadas}
            observacaoGeral={observacaoGeral}
            situacaoCorrecao={situacaoCorrecao}
            />
        ).toBlob();

        const identificadorFormatado = identificador 
            ? String(identificador).trim().replace(/[/\\?%*:|"<>]/g, '-')
            : null;

        const nomeArquivo = identificadorFormatado
            ? `Analise_Coordenadas_Instrumento_${identificadorFormatado}.pdf`
            : 'Analise_Coordenadas.pdf';

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;

        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    

    return(
        <div className={`${estilos.caixa_externa} ${painelFiltros ? estilos.comPainelFiltros : ""}`}>
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
                className={`${estilos.botao_salvar} ${!loading ? estilos.botao_salvar_ativo : ""}`} 
                onClick={abrirConfirmacao} 
                disabled={loading}
            > 
                {obterTextoBotao()}
            </button>

            <button 
                className={estilos.botao_cancelar_analise} 
                onClick={handleCancelarAnalise} 
                disabled={loading}
            > 
                {possuiCoordenadasAlteradas ? "Cancelar Análise" : "Fechar Análise"}
            </button>


            {confirmacaoAberta && (
                <div className={estilos.overlay_modal}>
                    <div className={estilos.janela_confirmacao}>
                        
                        <div className={estilos.titulo}>
                            <h4 className={estilos.titulo_confirmacao}>Resumo da Análise {identificador ? `- Instrumento: ${identificador}` : ''}</h4>
                            <button 
                                type="button"
                                className={estilos.botao_exportar}
                                onClick={handleExportarPDF}
                                disabled={possuiCoordenadasAlteradas}
                            >
                                Gerar pdf
                            </button>
                        </div>


                        <div className={estilos.container_tabela}>
                            <table className={estilos.tabela_resumo}>
                                <thead>
                                    <tr>
                                        <th>N</th>
                                        <th>Latitude</th>
                                        <th>Longitude</th>
                                        <th>Análise</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coordenadas.map((item, index) => {
                                        const analiseExibida = item._coordenadaAlterada
                                            ? (item.situacao_analise || "Sem análise")
                                            : (item._coordenadaOriginal?.situacao_analise || item.situacao_analise || "Sem análise");
                                        
                                        const latitudeExibida = item.latitude ?? item._coordenadaOriginal?.latitude ?? "-";
                                        const longitudeExibida = item.longitude ?? item._coordenadaOriginal?.longitude ?? "-";

                                        return (
                                            <tr key={item.id_coordenada || index}>
                                                <td className={estilos.coluna_n}>{index + 1}</td>
                                                <td className={estilos.coluna_l}>{latitudeExibida}</td>
                                                <td className={estilos.coluna_l}>{longitudeExibida}</td>
                                                <td className={item._coordenadaAlterada ? estilos.item_alterado : ""}>
                                                    {analiseExibida}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                                                
                        <form onSubmit={submeterConfirmacao}>
                            <textarea
                                className={estilos.texto_observacao}
                                rows="3"
                                maxLength={180}
                                placeholder="Observação (opcional)"
                                value={observacaoGeral}
                                onChange={handleObservacaoChange}
                            />


                            <div className={estilos.container_pergunta_correcao}>
                                <p className={estilos.texto_pergunta}>As correções das coordenadas com erro já foram solicitadas ao recebedor?</p>
                                <div className={estilos.opcoes_radio_correcao}>
                                    <label className={estilos.label_radio}>
                                        <input
                                            type="radio"
                                            name="correcaoProponente"
                                            value="Sim"
                                            checked={situacaoCorrecao === "Sim"}
                                            onChange={handleSituacaoCorrecaoChange}
                                        />
                                        Sim
                                    </label>

                                    <label className={estilos.label_radio}>
                                        <input
                                            type="radio"
                                            name="correcaoProponente"
                                            value="Não"
                                            checked={situacaoCorrecao === "Não"}
                                            onChange={handleSituacaoCorrecaoChange}
                                        />
                                        Não
                                    </label>

                                    <label className={estilos.label_radio}>
                                        <input
                                            type="radio"
                                            name="correcaoProponente"
                                            value="Sem necessidade"
                                            checked={situacaoCorrecao === "Sem necessidade"}
                                            onChange={handleSituacaoCorrecaoChange}
                                        />
                                        Não há necessidade de solicitar correção
                                    </label>
                                </div>
                            </div>
                            

                            {!possuiCoordenadasAlteradas && (
                                <p className={estilos.mensagem_alteracao}>
                                Não há alterações para enviar
                                </p>
                            )}


                            <div className={estilos.area_botoes_confirmacao}>
                                <button 
                                    type="button" 
                                    className={estilos.botao_cancelar} 
                                    onClick={fecharConfirmacao}
                                >
                                    {sucessoEnvio ? "Fechar" : "Voltar"}
                                </button>
                                <button 
                                    type="submit" 
                                    className={estilos.botao_confirmar}
                                    disabled={!possuiCoordenadasAlteradas || loading}
                                >
                                    {loading ? "Enviando..." : "Confirmar e Enviar"}
                                </button>
                            </div>


                            {erroEnvio ? (
                                <p className={estilos.mensagem_erro}>
                                    {erroEnvio}
                                </p>
                            ) : sucessoEnvio ? (
                                <p className={estilos.mensagem_sucesso}>
                                    {sucessoEnvio}
                                </p>
                            ) : null}

                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}