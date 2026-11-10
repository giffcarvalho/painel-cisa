import estilos from "./ContatoMandataria.module.css";
import { X, Trash } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { IMaskInput } from "react-imask";
import { useAuth } from "@/context/auth/useAuth";
import { enviarContatoMandataria } from "../../api/pontosControle";
import { useBuscaContatoMandatariaQuery } from '../../hooks/usePontosControle';
import { useQueryClient } from "@tanstack/react-query";



export default function ContatoMandataria({ setContatoMandataria }) {

    const [codUf, setCodUf] = useState('12');
    const { data, isLoading, isError } = useBuscaContatoMandatariaQuery(codUf);
    const [contatos, setContatos] = useState([]);
    const containerRef = useRef(null);
    const { isAuthenticated, openLoginModal } = useAuth();
    const queryClient = useQueryClient();
    const listaContatosMandataria = data?.data || [];
    
    
    useEffect(() => {
        
        if (listaContatosMandataria.length > 0) {
        
            const novoEstado = listaContatosMandataria.map((item) => ({
                nome: item.nome || "",
                cargo: item.cargo || "",
                tipo_setor: item.tipo_setor || "",
                setor: item.setor || "",
                telefone: item.telefone || "",
                email: item.email || "",
                observacao: item.observacao || "",
            }));

            setContatos(novoEstado);

        } else {
            
            setContatos([{
                nome: "", cargo: "", tipo_setor: "", setor: "", telefone: "", email: "", observacao: ""
            }]);
        }
    }, [data]);


    const atualizarContato = (index, campo, valor) => {
        setContatos((prev) => {
            const novos = [...prev];
            novos[index][campo] = valor;
            return novos;
        });
    };


    const adicionarLinha = () => {
        setContatos((prev) => [
            ...prev,
            { nome: "", cargo: "", tipo_setor: "", setor: "", telefone: "", email: "", observacao: "" }
        ]);

        setTimeout(() => {
            if (containerRef.current) {
                containerRef.current.scrollTo({
                    top: containerRef.current.scrollHeight,
                    behavior: "smooth"
                });
            }
        }, 100);
    };

    const removerLinha = (index) => {
        setContatos((prev) => {
            const novos = prev.filter((_, i) => i !== index);
            
            return novos.length > 0 ? novos : [{ nome: "", cargo: "", tipo_setor: "", setor: "", telefone: "", email: "", observacao: "" }];
        });
    };

    
    //verificações para checar se o formulário deve ser salvo, e qual contato deve ser salvo
    // Pega os contatos originais
    

    // Mapeia e filtra apenas os contatos alterados
    const contatosAlterados = contatos
        .map((contatoAtual, idContato) => {
                        
            const contatoOriginal = listaContatosMandataria.find(
                (item) => item.id_contato === idContato
            );

            const nome = contatoAtual.nome.trim();
            const cargo = contatoAtual.cargo.trim();
            const tipoSetor = contatoAtual.tipo_setor.trim();
            const setor = contatoAtual.setor.trim();
            const telefone = contatoAtual.telefone.trim();
            const email = contatoAtual.email.trim();
            const observacao = contatoAtual.observacao.trim();

            const origNome = (contatoOriginal?.nome || "").trim();
            const origCargo = (contatoOriginal?.cargo || "").trim();
            const origTipoSetor = (contatoOriginal?.tipo_setor || "").trim();
            const origSetor = (contatoOriginal?.setor || "").trim();
            const origTelefone = (contatoOriginal?.telefone || "").trim();
            const origEmail = (contatoOriginal?.email || "").trim();
            const origObservacao = (contatoOriginal?.observacao || "").trim();

            const mudou =
                nome !== origNome ||
                cargo !== origCargo ||
                tipoSetor !== origTipoSetor ||
                setor !== origSetor ||
                telefone !== origTelefone ||
                email !== origEmail ||
                observacao !== origObservacao;

            if (!mudou) return null;

            return {
                cod_uf: codUf,
                id_contato: idContato,
                nome: nome || null,
                cargo: cargo || null,
                tipo_setor: tipoSetor || null,
                setor: setor || null,
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


        // Garante que haja um codUf relacionado ao formulário
        if (!codUf) {
            alert("Identificador da UF não informada.");
            return;
        }

        if (!podeSalvar) return;

        
        try {
            setEnviando(true);

            // Envia APENAS o array contendo os contatos que realmente mudaram
            await enviarContatoMandataria(contatosAlterados);

            queryClient.invalidateQueries({
                queryKey: ['pontos-controle', 'contatoMandataria', codUf]
            });

            setContatoMandataria(false)

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
            <div className={estilos.janela}>

                <div className={estilos.cabecalho}>
                    <div className={estilos.secao_esquerda}>    
                        <h4>Contatos Mandatária - UF:</h4>
                        <select 
                            value={codUf}
                            onChange={(e) => setCodUf(e.target.value)}
                            >
                            <option value="12">AC</option>
                            <option value="27">AL</option>
                            <option value="16">AP</option>
                            <option value="13">AM</option>
                            <option value="29">BA</option>
                            <option value="23">CE</option>
                            <option value="53">DF</option>
                            <option value="32">ES</option>
                            <option value="52">GO</option>
                            <option value="21">MA</option>
                            <option value="51">MT</option>
                            <option value="50">MS</option>
                            <option value="31">MG</option>
                            <option value="15">PA</option>
                            <option value="25">PB</option>
                            <option value="41">PR</option>
                            <option value="26">PE</option>
                            <option value="22">PI</option>
                            <option value="33">RJ</option>
                            <option value="24">RN</option>
                            <option value="43">RS</option>
                            <option value="11">RO</option>
                            <option value="14">RR</option>
                            <option value="42">SC</option>
                            <option value="35">SP</option>
                            <option value="17">TO</option>
                            <option value="28">SE</option>
                        </select>
                    </div>
                    
                    <button 
                        type="button"
                        className={estilos.botaoX}
                        onClick={() => setContatoMandataria(false)}
                    >
                        <X className={estilos.XFechar} />
                    </button>  
                </div>
                
                
                <div className={estilos.contactContainer} ref={containerRef}>
                    <div className={estilos.columnHeader}>
                        <span className={estilos.nameColumn}>Nome</span>
                        <span className={estilos.positionColumn}>Cargo</span>
                        <span className={estilos.sectorTypeColumn}>Tipo Setor</span>
                        <span className={estilos.sectorColumn}>Setor</span>
                        <span className={estilos.phoneColumn}>Telefone</span>
                        <span className={estilos.emailColumn}>E-mail</span>
                        <span className={estilos.observationColumn}>Observação</span>
                    </div>

                    {contatos.map((contato, idx) => (
                        <div key={idx} className={estilos.contactLine}>
                                                        
                            <input
                                type="text"
                                className={estilos.nameColumn}
                                placeholder="Nome do contato"
                                value={contato.nome}
                                onChange={(e) => atualizarContato(idx, "nome", e.target.value)}
                            />
                            
                            <input
                                type="text"
                                className={estilos.positionColumn}
                                placeholder="Cargo"
                                value={contato.cargo}
                                onChange={(e) => atualizarContato(idx, "cargo", e.target.value)}
                            />

                            <input
                                type="text"
                                className={estilos.sectorTypeColumn}
                                placeholder="Tipo Setor"
                                value={contato.tipo_setor}
                                onChange={(e) => atualizarContato(idx, "tipo_setor", e.target.value)}
                            />

                            <input
                                type="text"
                                className={estilos.sectorColumn}
                                placeholder="Setor"
                                value={contato.setor}
                                onChange={(e) => atualizarContato(idx, "setor", e.target.value)}
                            />
                            
                            <IMaskInput
                                mask="(00) 00000-0000"
                                className={`${estilos.phoneColumn} ${estilos.phoneInput}`}
                                placeholder="(00) 00000-0000"
                                value={contato.telefone}
                                onAccept={(valor) => atualizarContato(idx, "telefone", valor)}
                            />
                            
                            <input
                                type="email"
                                className={estilos.emailColumn}
                                placeholder="E-mail"
                                value={contato.email}
                                onChange={(e) => atualizarContato(idx, "email", e.target.value)}
                            />
                            
                            <textarea
                                className={`${estilos.observationColumn} ${estilos.observationInput}`}
                                rows="1"
                                maxLength={100}
                                placeholder="Observação"
                                value={contato.observacao}
                                onChange={(e) => atualizarContato(idx, "observacao", e.target.value)}
                            />

                            <button 
                                type="button"
                                className={estilos.deleteButton}
                                title = "Excluir contato"
                                onClick={() => removerLinha(idx)}
                            >
                                <Trash size={15}/>
                            </button> 
                        </div>
                    ))}

                </div>

                <div className={estilos.actionForm}>
                    <button 
                        type="submit"
                        className={estilos.actionButton}
                        title="Adicionar contato"
                        disabled={isLoading}
                        onClick={adicionarLinha}
                    >
                        Adicionar contato
                    </button>
                    <button 
                        type="submit"
                        className={estilos.actionButton}
                        title={obterTextoTooltip()}
                        disabled={isLoading}
                    >
                        Salvar
                    </button>
                </div>

            </div>
        </div>
    );
}

