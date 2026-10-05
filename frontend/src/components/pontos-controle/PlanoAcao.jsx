import { useState, useEffect } from "react";
import estilos from "./PlanoAcao.module.css";
import { X, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { enviarPlanoAcao } from "../../api/pontosControle";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/context/auth/useAuth";
import { formatDatetime } from '../../utils/formatters';



export default function PlanoAcao({ 
    fecharJanelaPlanoAcao,
    nrInstrumento,
    campo,
    statusPontoControle,
    historicoExistente = [],
}) {
    const [indiceAtual, setIndiceAtual] = useState(0);
    const [modoCriacao, setModoCriacao] = useState(historicoExistente.length === 0);
    const dadosExibicao = !modoCriacao ? historicoExistente[indiceAtual] : null;
    
    const [confirmacao, setConfirmacao] = useState(dadosExibicao?.confirmacao || "");
    const [coordenacao, setCoordenacao] = useState(dadosExibicao?.coordenacao || "");
    const [mandataria, setMandataria] = useState(dadosExibicao?.mandataria || "");
    const [proponente, setProponente] = useState(dadosExibicao?.recebedor || "");
    const [observacaoAcao, setObservacaoAcao] = useState(dadosExibicao?.observacao_acao || "");
    const [prazoAcao, setPrazoAcao] = useState(dadosExibicao?.prazo_acao || "");
    const [statusAcao, setStatusAcao] = useState(dadosExibicao?.status_acao || "");
    const [observacaoStatusAcao, setObservacaoStatusAcao] = useState(dadosExibicao?.observacao_status_acao || "");
    
    const [enviando, setEnviando] = useState(false);
    const queryClient = useQueryClient();
    const { isAuthenticated, openLoginModal } = useAuth();

    // Sincroniza os estados com o item do histórico selecionado ou limpa para criação
    useEffect(() => {
        if (!modoCriacao && dadosExibicao) {
            setConfirmacao(dadosExibicao.confirmacao || "");
            setCoordenacao(dadosExibicao.coordenacao || "");
            setMandataria(dadosExibicao.mandataria || "");
            setProponente(dadosExibicao.recebedor || "");
            setObservacaoAcao(dadosExibicao.observacao_acao || "");
            setPrazoAcao(dadosExibicao.prazo_acao || "");
            setStatusAcao(dadosExibicao.status_acao || "");
            setObservacaoStatusAcao(dadosExibicao.observacao_status_acao || "");
        } else if (modoCriacao) {
            limparCampos();
        }
    }, [indiceAtual, modoCriacao, historicoExistente]);

    
    const limparCampos = () => {
        setConfirmacao("");
        setCoordenacao("");
        setMandataria("");
        setProponente("");
        setObservacaoAcao("");
        setPrazoAcao("");
        setStatusAcao("");
        setObservacaoStatusAcao("");
    };


    // Navegação no Histórico
    const handleAnterior = () => {
        if (modoCriacao) {
            setModoCriacao(false);
            setIndiceAtual(0);
        } else if (indiceAtual < historicoExistente.length - 1) {
            setIndiceAtual((prev) => prev + 1);
        }
    };

    const handleProximo = () => {
        if (indiceAtual > 0) {
            setIndiceAtual((prev) => prev - 1);
        }
    };

    const handleNovoRegistro = () => {
        setModoCriacao(true);
    };




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
        confirmacao !== (dadosExibicao?.confirmacao || "") ||
        coordenacao !== (dadosExibicao?.coordenacao || "") ||
        mandataria !== (dadosExibicao?.mandataria || "") ||
        proponente !== (dadosExibicao?.recebedor || "") ||
        observacaoAcao !== (dadosExibicao?.observacao_acao || "") ||
        prazoAcao !== (dadosExibicao?.prazo_acao || "") ||
        statusAcao !== (dadosExibicao?.status_acao || "") ||
        observacaoStatusAcao !== (dadosExibicao?.observacao_status_acao || "");

    // O botão só estará liberado se tiver preenchimento E se tiver havido alteração
    const podeSalvar = modoCriacao && isAuthenticated && possuiPreenchimento;
    
    

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
        if (!modoCriacao && !houveAlteracao) {
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

    const obterTextoTooltip = () => {
        if (!modoCriacao) return "Clique em 'Novo Plano' para cadastrar um novo registro";
        if (!isAuthenticated) return "Faça login para salvar o plano de ação";
        if (!possuiPreenchimento) return "Preencha ao menos um campo para salvar";
        return "";
    };




    return (
        <div className={estilos.overlay_modal}>
            <form onSubmit={handleSubmit} className={estilos.janela}>
                
                {/* Cabeçalho */}
                <div className={estilos.cabecalho}>
                    <div className={estilos.cabecalho_plano}>
                        <h4>Ações realizadas - Instrumento {nrInstrumento || '—'}</h4>
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
                </div>

                

                {/* Barra de Navegação no Histórico */}
                <div className={estilos.barra_navegacao}>
                    <div className={estilos.controles_historico}>
                        <button
                            type="button"
                            className={estilos.botao_nav}
                            onClick={handleAnterior}
                            disabled={modoCriacao ? historicoExistente.length === 0 : indiceAtual === historicoExistente.length - 1}
                            title="Ver registro mais antigo"
                        >
                            <ChevronLeft size={18} />
                            Anterior
                        </button>

                        <span className={estilos.indicador_pagina}>
                            {modoCriacao ? (
                                <strong>Novo Registro</strong>
                            ) : (
                                `Registro ${historicoExistente.length - indiceAtual} de ${historicoExistente.length}`
                            )}
                        </span>

                        <button
                            type="button"
                            className={estilos.botao_nav}
                            onClick={handleProximo}
                            disabled={modoCriacao || indiceAtual === 0}
                            title="Ver registro mais recente"
                        >
                            Próximo
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {!modoCriacao && (
                        <button
                            type="button"
                            className={estilos.botao_novo}
                            onClick={handleNovoRegistro}
                        >
                            <Plus size={16} />
                            Nova ação
                        </button>
                    )}
                </div>

                <div className={estilos.pergunta}>
                    <h3>Confirma status do Ponto de Controle?</h3>
                    <label className={`${estilos.label_radio} ${!modoCriacao ? estilos.disabled : ''}`}>
                        <input
                            type="radio"
                            name="confirmacao"
                            value="Sim"
                            checked={confirmacao === "Sim"}
                            onChange={(e) => setConfirmacao(e.target.value)}
                            disabled={!modoCriacao}
                        />
                        Sim
                    </label>
                    <label className={`${estilos.label_radio} ${!modoCriacao ? estilos.disabled : ''}`}>
                        <input
                            type="radio"
                            name="confirmacao"
                            value="Não"
                            checked={confirmacao === "Não"}
                            onChange={(e) => setConfirmacao(e.target.value)}
                            disabled={!modoCriacao}
                        />
                        Não
                    </label>
                </div>

                <div className={estilos.pergunta}>
                    <h3>Deseja que o Coordenador avalie a situação?</h3>
                    <label className={`${estilos.label_radio} ${!modoCriacao ? estilos.disabled : ''}`}>
                        <input
                            type="radio"
                            name="coordenacao"
                            value="Sim"
                            checked={coordenacao === "Sim"}
                            onChange={(e) => setCoordenacao(e.target.value)}
                            disabled={!modoCriacao}
                        />
                        Sim
                    </label>
                    <label className={`${estilos.label_radio} ${!modoCriacao ? estilos.disabled : ''}`}>
                        <input
                            type="radio"
                            name="coordenacao"
                            value="Não"
                            checked={coordenacao === "Não"}
                            onChange={(e) => setCoordenacao(e.target.value)}
                            disabled={!modoCriacao}
                        />
                        Não
                    </label>
                </div>

                <div className={estilos.pergunta}>
                    <h3>Foi realizado contato com a mandatária?</h3>
                    <label className={`${estilos.label_radio} ${!modoCriacao ? estilos.disabled : ''}`}>
                        <input
                            type="radio"
                            name="mandataria"
                            value="Sim"
                            checked={mandataria === "Sim"}
                            onChange={(e) => setMandataria(e.target.value)}
                            disabled={!modoCriacao}
                        />
                        Sim
                    </label>
                    <label className={`${estilos.label_radio} ${!modoCriacao ? estilos.disabled : ''}`}>
                        <input
                            type="radio"
                            name="mandataria"
                            value="Não"
                            checked={mandataria === "Não"}
                            onChange={(e) => setMandataria(e.target.value)}
                            disabled={!modoCriacao}
                        />
                        Não
                    </label>
                </div>

                <div className={estilos.pergunta}>
                    <h3>Foi realizado contato com o ente recebedor?</h3>
                    <label className={`${estilos.label_radio} ${!modoCriacao ? estilos.disabled : ''}`}>
                        <input
                            type="radio"
                            name="proponente"
                            value="Sim"
                            checked={proponente === "Sim"}
                            onChange={(e) => setProponente(e.target.value)}
                            disabled={!modoCriacao}
                        />
                        Sim
                    </label>
                    <label className={`${estilos.label_radio} ${!modoCriacao ? estilos.disabled : ''}`}>
                        <input
                            type="radio"
                            name="proponente"
                            value="Não"
                            checked={proponente === "Não"}
                            onChange={(e) => setProponente(e.target.value)}
                            disabled={!modoCriacao}
                        />
                        Não
                    </label>
                </div>

                {/* Textarea */}
                <textarea
                    className={estilos.texto_observacao}
                    rows="3"
                    maxLength={250}
                    placeholder="Descrição da ação realizada"
                    value={observacaoAcao}
                    onChange={(e) => setObservacaoAcao(e.target.value)}
                    disabled={!modoCriacao}
                />

                {/* Campo de Data */}
                <div className={estilos.prazo_acao}>
                    <label htmlFor="prazoAcao">Gostaria de definir um prazo para ser lembrado de retornar a esse Ponto?</label>
                    <input 
                        className={estilos.prazo_acao_campo}
                        type="date"
                        id="prazoAcao"
                        value={prazoAcao}
                        onChange={(e) => setPrazoAcao(e.target.value)}
                        disabled={!modoCriacao}
                    />
                </div>

                {/* Botões do Rodapé */}
                <div className={estilos.acoes_formulario}>
                    {!modoCriacao && dadosExibicao?.usuario && (
                        <div className={estilos.ultima_alteracao}>
                            <span>
                                Registrado por: {dadosExibicao.usuario}
                            </span>
                            {dadosExibicao.criado_em && (
                                <small className={estilos.data_alteracao}>
                                    {formatDatetime(dadosExibicao.criado_em)}
                                </small>
                            )}
                        </div>
                    )}

                    <button 
                        type="button"
                        className={estilos.botao_cancelar}
                        onClick={limparCampos}
                        disabled={!modoCriacao || enviando}
                    >
                        Limpar formulário
                    </button>

                    <button 
                        type="submit"
                        className={estilos.botao_salvar}
                        disabled={!modoCriacao || enviando || !podeSalvar}
                        title={obterTextoTooltip()}
                    >
                        {enviando ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>

            </form>
        </div>
    );
}