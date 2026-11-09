import estilos from "./ContatoMandataria.module.css";
import { X, Trash } from "lucide-react";
import { Fragment, useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { useBuscaContatoMandatariaQuery } from '../../hooks/usePontosControle';
import { emptyValue } from '../../utils/formatters';



export default function ContatoMandataria({ setContatoMandataria }) {

    const [codUf, setCodUf] = useState('12');
    const { data, isLoading, isError } = useBuscaContatoMandatariaQuery(codUf);
    const [contatos, setContatos] = useState([]);

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
    };

    const removerLinha = (index) => {
        setContatos((prev) => {
            const novos = prev.filter((_, i) => i !== index);
            
            return novos.length > 0 ? novos : [{ nome: "", cargo: "", tipo_setor: "", setor: "", telefone: "", email: "", observacao: "" }];
        });
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
                
                
                <div className={estilos.contactContainer}>
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
                        title="Salvar"
                        disabled={isLoading}
                    >
                        Salvar
                    </button>
                </div>

            </div>
        </div>
    );
}

