import { useState, useEffect } from "react";
import estilos from "./PlanoAcao.module.css";
import { X, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { enviarPlanoAcao } from "../../api/pontosControle";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/context/auth/useAuth";
import { formatDatetime } from '../../utils/formatters';
import { ajudaPergunta } from '../../utils/pontoControleUtils';




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
    const [ajudaAberta, setAjudaAberta] = useState(null);
  
    
    const [confirmacao, setConfirmacao] = useState(dadosExibicao?.confirmacao || "");
    const [coordenacao, setCoordenacao] = useState(dadosExibicao?.coordenacao || "");
    const [mandataria, setMandataria] = useState(dadosExibicao?.mandataria || "");
    const [proponente, setProponente] = useState(dadosExibicao?.recebedor || "");
    const [descricaoAcao, setDescricaoAcao] = useState(dadosExibicao?.descricao_acao || "");
    const [prazoPactuado, setPrazoPactuado] = useState(dadosExibicao?.prazo_pactuado || "");
    
    
    const [enviando, setEnviando] = useState(false);
    const queryClient = useQueryClient();
    const { isAuthenticated, openLoginModal } = useAuth();


    const abrirAjuda = (chavePergunta) => {
        setAjudaAberta(chavePergunta);
    };    
        

    const fecharAjuda = () => {
        setAjudaAberta(null);
    };

    // Fecha o modal de ajuda ao pressionar ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
        if (e.key === "Escape" && ajudaAberta) {
            fecharAjuda();
        }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [ajudaAberta]);



    // Sincroniza os estados com o item do histórico selecionado ou limpa para criação
    useEffect(() => {
        if (!modoCriacao && dadosExibicao) {
            setConfirmacao(dadosExibicao.confirmacao || "");
            setCoordenacao(dadosExibicao.coordenacao || "");
            setMandataria(dadosExibicao.mandataria || "");
            setProponente(dadosExibicao.recebedor || "");
            setDescricaoAcao(dadosExibicao.descricao_acao || "");
            setPrazoPactuado(dadosExibicao.prazo_pactuado || "");
        } else if (modoCriacao) {
            limparCampos();
        }
    }, [indiceAtual, modoCriacao, historicoExistente]);

    
    const limparCampos = () => {
        setConfirmacao("");
        setCoordenacao("");
        setMandataria("");
        setProponente("");
        setDescricaoAcao("");
        setPrazoPactuado("");
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


    // Validação específica para o campo 'observacaoAcao'
    const descricaoAcaoValida = descricaoAcao.trim().length >= 30;

       

    // Comparação para saber se HOUVE alguma alteração em relação aos dados salvos originalmente
    const houveAlteracao = 
        confirmacao !== (dadosExibicao?.confirmacao || "") ||
        coordenacao !== (dadosExibicao?.coordenacao || "") ||
        mandataria !== (dadosExibicao?.mandataria || "") ||
        proponente !== (dadosExibicao?.recebedor || "") ||
        descricaoAcao !== (dadosExibicao?.descricao_acao || "") ||
        prazoPactuado !== (dadosExibicao?.prazo_pactuado || "")

    // O botão só estará liberado se tiver preenchimento e se tiver havido alteração
    const podeSalvar = modoCriacao && descricaoAcaoValida;
    
    

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

        // Validação de obrigatoriedade e tamanho mínimo
        if (!descricaoAcaoValida) {
            alert("A descrição da ação é obrigatória e deve ter no mínimo 30 caracteres.");
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
            descricao_acao: descricaoAcao || null,
            prazo_pactuado: prazoPactuado || null,
            };

        try {
            setEnviando(true);
            const resposta = await enviarPlanoAcao(dadosFormulario);
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
        if (!modoCriacao) return "Clique em 'Nova Ação' para cadastrar um novo registro";
        if (!descricaoAcaoValida) return "A descrição da ação é obrigatória";
        if (!isAuthenticated) return "Você precisará fazer login para concluir o salvamento";
        
        return "";
    };


    const conteudoAjuda = ajudaAberta ? ajudaPergunta[ajudaAberta] : null;

    return (
        <div className={estilos.overlay_modal}>
            

            {conteudoAjuda && (
                <div className={estilos.modal_ajuda_overlay} onClick={fecharAjuda}>
                <div
                    className={estilos.modal_ajuda_card}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={estilos.modal_ajuda_cabecalho}>
                    <h4>{conteudoAjuda.titulo}</h4>
                    <button
                        type="button"
                        className={estilos.botaoX}
                        onClick={fecharAjuda}
                    >
                        <X className={estilos.XFechar} />
                    </button>
                    </div>
                    {Array.isArray(conteudoAjuda.explicacao) ? (
                        conteudoAjuda.explicacao.map((paragrafo, index) => (
                        <p key={index} className={estilos.modal_ajuda_texto}>
                            {paragrafo}
                        </p>
                        ))
                    ) : (
                        <p className={estilos.modal_ajuda_texto}>
                        {conteudoAjuda.explicacao}
                        </p>
                    )}
                </div>
                </div>
            )}


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
                    <button
                        type="button"
                        className={estilos.headerInfoButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            abrirAjuda("confirmacao");
                        }}
                        aria-label={"Abrir ajuda sobre esta pergunta"}
                        title={"Abrir ajuda sobre esta pergunta"}
                        >
                        ?
                    </button>  
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
                    <button
                        type="button"
                        className={estilos.headerInfoButton}
                        onClick={(e) => {
                        e.stopPropagation();
                        abrirAjuda("coordenacao");
                        }}
                        aria-label="Abrir ajuda sobre esta pergunta"
                        title="Abrir ajuda sobre esta pergunta"
                    >
                        ?
                    </button>
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
                    <button
                        type="button"
                        className={estilos.headerInfoButton}
                        onClick={(e) => {
                        e.stopPropagation();
                        abrirAjuda("mandataria");
                        }}
                        aria-label="Abrir ajuda sobre esta pergunta"
                        title="Abrir ajuda sobre esta pergunta"
                    >
                        ?
                    </button>
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
                    <button
                        type="button"
                        className={estilos.headerInfoButton}
                        onClick={(e) => {
                        e.stopPropagation();
                        abrirAjuda("proponente");
                        }}
                        aria-label="Abrir ajuda sobre esta pergunta"
                        title="Abrir ajuda sobre esta pergunta"
                    >
                        ?
                    </button>
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
                <div>
                    <textarea
                        className={estilos.texto_descricao}
                        rows="3"
                        maxLength={250}
                        placeholder="Descrição da ação realizada (mínimo 30 caracteres) *"
                        value={descricaoAcao}
                        onChange={(e) => setDescricaoAcao(e.target.value)}
                        disabled={!modoCriacao}
                    />
                    {modoCriacao && (
                        <span className={estilos.mensagem_erro_campo}>
                            ({descricaoAcao.trim().length}/250)
                        </span>
                    )}
                </div>

                {/* Campo de Data */}
                <div className={estilos.prazo_pactuado}>
                    <label htmlFor="prazoPactuado">Foi pactuado algum prazo com o ente recebedor ou mandatária?</label>
                    <button
                        type="button"
                        className={estilos.headerInfoButton}
                        onClick={(e) => {
                        e.stopPropagation();
                        abrirAjuda("prazoPactuado");
                        }}
                        aria-label="Abrir ajuda sobre esta pergunta"
                        title="Abrir ajuda sobre esta pergunta"
                        style={{ marginLeft: "4px", marginRight: "auto" }}
                    >
                        ?
                    </button>
                    <input 
                        className={estilos.prazo_pactuado_campo}
                        type="date"
                        id="prazoAcao"
                        value={prazoPactuado}
                        onChange={(e) => setPrazoPactuado(e.target.value)}
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