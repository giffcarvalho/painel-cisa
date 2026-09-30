import { useState, useEffect } from "react";
import estilos from "./PlanoAcao.module.css";
import { X } from "lucide-react";
import { enviarPlanoAcao } from "../../api/pontosControle";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/context/auth/useAuth";
import { formatDate } from '../../utils/formatters';



export default function PlanoAcao({ 
    fecharJanelaPlanoAcao,
    nrInstrumento,
    campo,
    statusPontoControle,
    dadosExistentes,
}) {

    const [confirmacao, setConfirmacao] = useState(dadosExistentes?.confirmacao || "");
    const [coordenacao, setCoordenacao] = useState(dadosExistentes?.coordenacao || "");
    const [mandataria, setMandataria] = useState(dadosExistentes?.mandataria || "");
    const [proponente, setProponente] = useState(dadosExistentes?.recebedor || "");
    const [observacaoAcao, setObservacaoAcao] = useState(dadosExistentes?.observacao_acao || "");
    const [prazoAcao, setPrazoAcao] = useState(dadosExistentes?.prazo_acao || "");
    const [statusAcao, setStatusAcao] = useState(dadosExistentes?.status_acao || "");
    const [observacaoStatusAcao, setObservacaoStatusAcao] = useState(dadosExistentes?.observacao_status_acao || "");
    const [enviando, setEnviando] = useState(false);
    const queryClient = useQueryClient();
    const { isAuthenticated, openLoginModal } = useAuth();

    // Garante que os campos sejam atualizados sempre que dadosExistentes mudar
    useEffect(() => {
        if (dadosExistentes) {
            setConfirmacao(dadosExistentes.confirmacao || "");
            setCoordenacao(dadosExistentes.coordenacao || "");
            setMandataria(dadosExistentes.mandataria || "");
            setProponente(dadosExistentes.recebedor || "");
            setObservacaoAcao(dadosExistentes.observacao_acao || "");
            setPrazoAcao(dadosExistentes.prazo_acao || "");
            setStatusAcao(dadosExistentes.status_acao || "");
            setObservacaoStatusAcao(dadosExistentes.observacao_status_acao || "");
        }
    }, [dadosExistentes]);


    // Variável criada para permitir testar se pelo menos um campo editavel foi preenchido.
    // Ela é usada para bloquear o envio de formulário totalmente vazio
    const possuiPreenchimento = [
        confirmacao,
        coordenacao,
        mandataria,
        proponente,
        observacaoAcao,
        prazoAcao,
        statusAcao,
        observacaoStatusAcao,
    ].some((valor) => valor !== "" && valor !== null && valor !== undefined);
    

    // Comparação para saber se HOUVE alguma alteração em relação aos dados salvos originalmente
    const houveAlteracao = 
        confirmacao !== (dadosExistentes?.confirmacao || "") ||
        coordenacao !== (dadosExistentes?.coordenacao || "") ||
        mandataria !== (dadosExistentes?.mandataria || "") ||
        proponente !== (dadosExistentes?.recebedor || "") ||
        observacaoAcao !== (dadosExistentes?.observacao_acao || "") ||
        prazoAcao !== (dadosExistentes?.prazo_acao || "") ||
        statusAcao !== (dadosExistentes?.status_acao || "") ||
        observacaoStatusAcao !== (dadosExistentes?.observacao_status_acao || "");

    // O botão só estará liberado se tiver preenchimento E se tiver havido alteração
    const podeSalvar = !isAuthenticated || (possuiPreenchimento && houveAlteracao);
    
    

    //Esta função monta o objeto com os dados do formulário e chama a função enviarPlanoAcao da api
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Garante que usuário logado possa salvar o formulário
        if (!isAuthenticated) {
            openLoginModal();
            return;
        }

        // Garante que haja um instrumento e um ponto de controle relacionado ao formulário
        if (!nrInstrumento || !campo) {
            alert("Identificador do instrumento ou campo não informado.");
            return;
        }

        // Se nenhum campo foi preenchido, bloqueia o envio
        if (!possuiPreenchimento) {
            alert("Preencha ao menos um campo do plano de ação antes de enviar.");
            return;
        }

        // Se não houve alteração em relação ao Plano de Ação já existente, bloqueia o envio
        if (!houveAlteracao) {
            alert("Nenhuma alteração foi realizada para salvar.");
            return;
        }


        const dadosFormulario = {
            nr_instrumento: nrInstrumento,
            ponto_controle: campo, // alterado de 'campo' para 'ponto_controle'
            status_ponto_controle: statusPontoControle,
            confirmacao: confirmacao || null,
            coordenacao: coordenacao || null,
            mandataria: mandataria || null,
            recebedor: proponente || null,
            observacao_acao: observacaoAcao || null,
            prazo_acao: prazoAcao || null,
            status_acao: statusAcao || null,
            observacao_status_acao: observacaoStatusAcao || null,
            };

        try {
            setEnviando(true);
            const resposta = await enviarPlanoAcao(dadosFormulario);
            console.log("Plano de ação salvo com sucesso:", resposta);
            queryClient.invalidateQueries({ queryKey: ['pontos-controle', 'plano_acao'] });
            fecharJanelaPlanoAcao();
        
        } catch (error) {
            console.error("Erro ao salvar o plano de ação:", error);
            alert(error.message || "Erro ao salvar o plano de ação.");
        
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


    // Define a mensagem do tooltip do botão Salvar
    const obterTextoTooltip = () => {
        if (!isAuthenticated) return "Faça login para salvar o plano de ação";
        if (!possuiPreenchimento) return "Preencha ao menos um campo para salvar";
        if (!houveAlteracao) return "Altere ao menos um campo para salvar";
        return "";
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
                    {dadosExistentes?.id_usuario && (
                        <span className={estilos.ultima_alteracao}>
                        Última alteração por: <strong>{dadosExistentes.id_usuario}</strong>
                        {dadosExistentes.criado_em && (
                            <> - {formatDate(dadosExistentes.criado_em)}</>
                        )}
                        </span>
                    )}
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
                        disabled={enviando || !podeSalvar}
                        title={obterTextoTooltip()}
                    >
                        {enviando ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>

            </form>
        </div>
        
    )
}