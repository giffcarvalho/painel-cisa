import { useState } from "react";
import estilos from "./PlanoAcao.module.css"



export default function PlanoAcao() {

    const [confirmacao, setConfirmacao] = useState("");
    const [coordenacao, setCoordenacao] = useState("");
    const [mandataria, setMandataria] = useState("");
    const [proponente, setProponente] = useState("");
    const [observacaoAcao, setObservacaoAcao] = useState("");
    const [prazoAcao, setPrazoAcao] = useState("");
    const [statusAcao, setStatusAcao] = useState("");
    const [observacaoStatusAcao, setObservacaoStatusAcao] = useState("");



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
            <div className={estilos.janela}>
                
                <div className={estilos.cabecalho_plano}>
                    <h4>Plano de Ação - Instrumento xxxxxx</h4>
                </div>


                <div className={estilos.ponto_controle}>
                    <h3>Ponto de Controle: Vencimento de Cláusula Suspensiva</h3>
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
                    <h3>Realizar contato com o proponente</h3>
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
                    placeholder="Demais ações necessárias"
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
                
              
            </div>
        </div>
        
    )
}