import { useState } from "react";
import estilos from "./PlanoAcao.module.css";
import { X } from "lucide-react";
import { enviarPlanoAcao } from "../../api/pontosControle";



export default function PlanoAcao({ fecharJanelaPlanoAcao, nrInstrumento, campo, statusPontoControle}) {

    const [confirmacao, setConfirmacao] = useState("");
    const [coordenacao, setCoordenacao] = useState("");
    const [mandataria, setMandataria] = useState("");
    const [proponente, setProponente] = useState("");
    const [observacaoAcao, setObservacaoAcao] = useState("");
    const [prazoAcao, setPrazoAcao] = useState("");
    const [statusAcao, setStatusAcao] = useState("");
    const [observacaoStatusAcao, setObservacaoStatusAcao] = useState("");
    const [enviando, setEnviando] = useState(false);

    //Esta função monta o objeto com os dados do formulário e chama a função enviarPlanoAcao da api
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nrInstrumento || !campo) {
            alert("Identificador do instrumento ou campo não informado.");
            return;
        }

        const dadosFormulario = {
            nr_instrumento: nrInstrumento,
            ponto_controle: campo, // alterado de 'campo' para 'ponto_controle'
            status_ponto_controle: statusPontoControle,
            confirmacao,
            coordenacao,
            mandataria,
            recebedor: proponente, // alterado de 'proponente' para 'recebedor'
            observacao_acao: observacaoAcao,
            prazo_acao: prazoAcao || null, // Garante null se for string vazia
            status_acao: statusAcao,
            observacao_status_acao: observacaoStatusAcao,
            };

        try {
            setEnviando(true);
            const resposta = await enviarPlanoAcao(dadosFormulario);
            console.log("Plano de ação salvo com sucesso:", resposta);
            fecharJanelaPlanoAcao();
        
        } catch (error) {
            console.error("Erro ao salvar o plano de ação:", error);
            alert("Não foi possível salvar o plano de ação. Tente novamente.");
        
        } finally {
            setEnviando(false);
        }
    };


    const limparFormulario = () => {
        setConfirmacao("");
        setCoordenacao("");
        setMandataria("");
        setProponente("");
        setObservacaoAcao("");
        setPrazoAcao("");
        setStatusAcao("");
        setObservacaoStatusAcao("");
    };


    const alterarConfirmacao = (e) => {
        setConfirmacao(e.target.value);
    };

    const alterarCoordenacao = (e) => {
        setCoordenacao(e.target.value);
    };

    const alterarMandataria = (e) => {
        setMandataria(e.target.value);
    };

    const alterarProponente = (e) => {
        setProponente(e.target.value);
    };

    const alterarObservacaoAcao = (e) => {
        setObservacaoAcao(e.target.value);
    };

    const alterarPrazoAcao = (e) => {
        setPrazoAcao(e.target.value);
    };

    const alterarStatusAcao = (e) => {
        setStatusAcao(e.target.value);
    };

    const alterarObservacaoStatusAcao = (e) => {
        setObservacaoStatusAcao(e.target.value);
    };



    return (
        <div className={estilos.overlay_modal}>
            <form onSubmit={handleSubmit} className={estilos.janela}>
                
                <div className={estilos.cabecalho_plano}>
                   <h4>Plano de Ação - Instrumento {nrInstrumento || '—'}</h4>
                    <button 
                        type="button"
                        className={estilos.botaoX}
                        onClick={fecharJanelaPlanoAcao}>
                        <X className={estilos.XFechar} />
                    </button>
                </div>


                <div className={estilos.ponto_controle}>
                    <h3>{campo || '—'}: {statusPontoControle || '—'}</h3>
                </div>


                <div className={estilos.pergunta}>
                    <h3>Confirma status do Ponto de Controle?</h3>
                    <label className={estilos.label_radio}>
                        <input
                            type="radio"
                            name="confirmacao"
                            value="Sim"
                            checked={confirmacao === "Sim"}
                            onChange={alterarConfirmacao}
                        />
                        Sim
                    </label>
                    <label className={estilos.label_radio}>
                        <input
                            type="radio"
                            name="confirmacao"
                            value="Não"
                            checked={confirmacao === "Não"}
                            onChange={alterarConfirmacao}
                        />
                        Não
                    </label>
                </div>


                <div className={estilos.pergunta}>
                    <h3>Submeter situação à Coordenação?</h3>
                    <label className={estilos.label_radio}>
                        <input
                            type="radio"
                            name="coordenacao"
                            value="Sim"
                            checked={coordenacao === "Sim"}
                            onChange={alterarCoordenacao}
                        />
                        Sim
                    </label>
                    <label className={estilos.label_radio}>
                        <input
                            type="radio"
                            name="coordenacao"
                            value="Não"
                            checked={coordenacao === "Não"}
                            onChange={alterarCoordenacao}
                        />
                        Não
                    </label>
                </div>


                <div className={estilos.pergunta}>
                    <h3>Colocar em pauta de reunião com a mandatária?</h3>
                    <label className={estilos.label_radio}>
                        <input
                            type="radio"
                            name="mandataria"
                            value="Sim"
                            checked={mandataria === "Sim"}
                            onChange={alterarMandataria}
                        />
                        Sim
                    </label>
                    <label className={estilos.label_radio}>
                        <input
                            type="radio"
                            name="mandataria"
                            value="Não"
                            checked={mandataria === "Não"}
                            onChange={alterarMandataria}
                        />
                        Não
                    </label>
                </div>


                <div className={estilos.pergunta}>
                    <h3>Foi realizado ou irá realizar contato com o proponente?</h3>
                    <label className={estilos.label_radio}>
                        <input
                            type="radio"
                            name="proponente"
                            value="Sim"
                            checked={proponente === "Sim"}
                            onChange={alterarProponente}
                        />
                        Sim
                    </label>
                    <label className={estilos.label_radio}>
                        <input
                            type="radio"
                            name="proponente"
                            value="Não"
                            checked={proponente === "Não"}
                            onChange={alterarProponente}
                        />
                        Não
                    </label>
                </div>

                
                <textarea
                    className={estilos.texto_observacao}
                    rows="3"
                    maxLength={250}
                    placeholder="Descrição das ações"
                    value={observacaoAcao}
                    onChange={alterarObservacaoAcao}
                />

                
                <div className={estilos.prazo_acao}>
                    <label htmlFor="prazoAcao">Gostaria de definir um prazo?</label>
                    <input className={estilos.prazo_acao_campo}
                        type="date"
                        id="prazoAcao"
                        value={prazoAcao}
                        onChange={alterarPrazoAcao}
                    />
                </div>


                <div className={estilos.cabecalho_status}>
                    <h4>Acompanhamento do Plano de Ação</h4>
                </div>

                <div className={estilos.pergunta_bloco}>
                    <h3>Status de execução das ações previstas:</h3>
                    <div className={estilos.opcoes_grid}>
                        <label className={estilos.label_radio_bloco}>
                            <input
                                type="radio"
                                name="statusAcao"
                                value="A realizar"
                                checked={statusAcao === "A realizar"}
                                onChange={alterarStatusAcao}
                            />
                            A realizar
                        </label>
                        <label className={estilos.label_radio_bloco}>
                            <input
                                type="radio"
                                name="statusAcao"
                                value="Em andamento"
                                checked={statusAcao === "Em andamento"}
                                onChange={alterarStatusAcao}
                            />
                            Em andamento
                        </label>
                        <label className={estilos.label_radio_bloco}>
                            <input
                                type="radio"
                                name="statusAcao"
                                value="Aguardando retorno"
                                checked={statusAcao === "Aguardando retorno"}
                                onChange={alterarStatusAcao}
                            />
                            Aguardando retorno
                        </label>
                        <label className={estilos.label_radio_bloco}>
                            <input
                                type="radio"
                                name="statusAcao"
                                value="Executada parcialmente"
                                checked={statusAcao === "Executada parcialmente"}
                                onChange={alterarStatusAcao}
                            />
                            Executada parcialmente
                        </label>
                        <label className={estilos.label_radio_bloco}>
                            <input
                                type="radio"
                                name="statusAcao"
                                value="Concluída"
                                checked={statusAcao === "Concluída"}
                                onChange={alterarStatusAcao}
                            />
                            Concluída
                        </label>
                    </div>
                </div>


                <textarea
                    className={estilos.texto_observacao}
                    rows="3"
                    maxLength={250}
                    placeholder="Descrição do status de execução das ações previstas"
                    value={observacaoStatusAcao}
                    onChange={alterarObservacaoStatusAcao}
                />
                
                <div className={estilos.acoes_formulario}>
                    <button 
                        type="button"
                        className={estilos.botao_cancelar}
                        onClick={limparFormulario}
                        disabled={enviando}
                    >
                        Limpar formulário
                    </button>

                    <button 
                        type="submit"
                        className={estilos.botao_salvar}
                        disabled={enviando}
                    >
                        {enviando ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>

            </form>
        </div>
        
    )
}