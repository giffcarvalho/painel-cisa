import estilos from "./ContatoRecebedor.module.css";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { IMaskInput } from "react-imask";
import { enviarContato } from "../../api/pontosControle";
import { useAuth } from "@/context/auth/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useBuscaContatoQuery } from '../../hooks/usePontosControle';


export default function ContatoRecebedor({ fecharJanelaContato, idRecebedor, recebedor }) {
    
    
    const queryClient = useQueryClient();
    const { isAuthenticated, openLoginModal } = useAuth();
    const [enviando, setEnviando] = useState(false);

    const { data: contatoData, isLoading } = useBuscaContatoQuery(idRecebedor);

    // Helper para gerar o estado inicial zerado (7 posições)
    const gerarEstadoInicial = () =>
        Array.from({ length: 7 }, () => ({
            nome: "",
            cargo: "",
            telefone: "",
            email: "",
            observacao: "",
        }));

    // 2. Inicializa o estado com 7 posições vazias
    const [contatos, setContatos] = useState(gerarEstadoInicial);


    // 3. Atualiza os campos quando a API retornar os dados existentes
    useEffect(() => {
        const contatosExistentes = contatoData?.data;

        if (Array.isArray(contatosExistentes) && contatosExistentes.length > 0) {
            const novoEstado = gerarEstadoInicial();

            contatosExistentes.forEach((item) => {
                const idx = item.nr_contato - 1; // Ajusta para índice base 0
                if (idx >= 0 && idx < 7) {
                    novoEstado[idx] = {
                        nome: item.nome || "",
                        cargo: item.cargo || "",
                        telefone: item.telefone || "",
                        email: item.email || "",
                        observacao: item.observacao || "",
                    };
                }
            });

            setContatos(novoEstado);
        }
    }, [contatoData]);


    const atualizarContato = (index, campo, valor) => {
        setContatos((prev) => {
            const novos = [...prev];
            novos[index][campo] = valor;
            return novos;
        });
    };

    

    //verificações para checar se o formulário deve ser salvo, e qual contato deve ser salvo
    
    // Pega os contatos originais
    const contatosOriginais = contatoData?.data || [];

    // Mapeia e filtra apenas os contatos alterados
    const contatosAlterados = contatos
        .map((contatoAtual, idx) => {
            const nrContato = idx + 1;
            
            const contatoOriginal = contatosOriginais.find(
                (item) => item.nr_contato === nrContato
            );

            const nome = contatoAtual.nome.trim();
            const cargo = contatoAtual.cargo.trim();
            const telefone = contatoAtual.telefone.trim();
            const email = contatoAtual.email.trim();
            const observacao = contatoAtual.observacao.trim();

            const origNome = (contatoOriginal?.nome || "").trim();
            const origCargo = (contatoOriginal?.cargo || "").trim();
            const origTelefone = (contatoOriginal?.telefone || "").trim();
            const origEmail = (contatoOriginal?.email || "").trim();
            const origObservacao = (contatoOriginal?.observacao || "").trim();

            const mudou =
                nome !== origNome ||
                cargo !== origCargo ||
                telefone !== origTelefone ||
                email !== origEmail ||
                observacao !== origObservacao;

            if (!mudou) return null;

            return {
                id_recebedor: idRecebedor,
                nr_contato: nrContato,
                nome: nome || null,
                cargo: cargo || null,
                telefone: telefone || null,
                email: email || null,
                observacao: observacao || null,
            };
        })
        .filter(Boolean);

    

    const houveAlteracao = contatosAlterados.length > 0;
    
    // Se o contato sofreu alteração mas o nome ficou vazio
    const temContatoInvalido = contatosAlterados.some((c) => c.nome === null);

    // Condição final para saber se o formulário pode ser salvo
    const podeSalvar = !isAuthenticated || (houveAlteracao && !temContatoInvalido);




    // Função que realiza o envio
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            openLoginModal();
            return;
        }


        // Garante que haja um idRecebedor relacionado ao formulário
        if (!idRecebedor) {
            alert("Identificador do recebedor não informado.");
            return;
        }

        if (!podeSalvar) return;

        
        try {
            setEnviando(true);

            // Envia APENAS o array contendo os contatos que realmente mudaram
            await enviarContato(contatosAlterados);

            queryClient.invalidateQueries({
                queryKey: ['pontos-controle', 'contato', idRecebedor]
            });

            fecharJanelaContato();

        } catch (error) {
            console.error("Erro ao salvar os contatos:", error);
            alert(error.message || "Erro ao salvar os contatos.");
        } finally {
            setEnviando(false);
        }
    };
    

    // Define a mensagem do tooltip do botão Salvar
    const obterTextoTooltip = () => {
        if (!isAuthenticated) return "Será solicitado login para salvar as alterações";
        if (temContatoInvalido) return "O preenchimento do Nome do contato é obrigatório";
        if (!houveAlteracao) return "Não há alterações para salvar";
        return "";
    };


    return (
        <div className={estilos.overlay_modal}>
            <form className={estilos.janela} onSubmit={handleSubmit}>
                <div className={estilos.cabecalho_contato}>
                    <h4>Lista de contatos - {recebedor ? `${recebedor}` : ""}</h4>
                    <button 
                        type="button" 
                        className={estilos.botaoX} 
                        onClick={fecharJanelaContato}
                    >
                        <X className={estilos.XFechar} />
                    </button>
                </div>



                <div className={estilos.contato}>

                    <div className={estilos.cabecalho_colunas}>
                        <span className={estilos.coluna_numero}></span>
                        <span className={estilos.coluna_nome}>Nome</span>
                        <span className={estilos.coluna_cargo}>Cargo</span>
                        <span className={estilos.coluna_telefone}>Telefone</span>
                        <span className={estilos.coluna_email}>E-mail</span>
                        <span className={estilos.coluna_observacao}>Observação</span>
                    </div>


                    {contatos.map((contato, idx) => (
                        <div key={idx} className={estilos.contato_caixa}>
                            <p className={estilos.coluna_numero}>{idx + 1}</p>
                            
                            <input
                                type="text"
                                className={estilos.coluna_nome}
                                placeholder="Nome do contato"
                                value={contato.nome}
                                onChange={(e) => atualizarContato(idx, "nome", e.target.value)}
                            />
                            
                            <input
                                type="text"
                                className={estilos.coluna_cargo}
                                placeholder="Cargo"
                                value={contato.cargo}
                                onChange={(e) => atualizarContato(idx, "cargo", e.target.value)}
                            />
                            
                            {/* IMaskInput usando a classe de largura e a classe visual */}
                            <IMaskInput
                                mask="(00) 00000-0000"
                                className={`${estilos.coluna_telefone} ${estilos.input_telefone}`}
                                placeholder="(00) 00000-0000"
                                value={contato.telefone}
                                onAccept={(valor) => atualizarContato(idx, "telefone", valor)}
                            />
                            
                            <input
                                type="email"
                                className={estilos.coluna_email}
                                placeholder="E-mail"
                                value={contato.email}
                                onChange={(e) => atualizarContato(idx, "email", e.target.value)}
                            />
                            
                            <textarea
                                className={`${estilos.coluna_observacao} ${estilos.campo_observacao}`}
                                rows="1"
                                maxLength={100}
                                placeholder="Observação"
                                value={contato.observacao}
                                onChange={(e) => atualizarContato(idx, "observacao", e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <div className={estilos.acoes_formulario}>
                    <button 
                        type="submit"
                        className={estilos.botao_salvar}
                        title={obterTextoTooltip()}
                        disabled={enviando || isLoading || !podeSalvar}
                    >
                        {enviando ? "Salvando..." : "Salvar"}
                    </button>
                </div>
            </form>
        </div>
    );
}