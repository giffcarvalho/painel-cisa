import estilos from "./ContatoMandataria.module.css";
import { X } from "lucide-react";
import { Fragment, useState } from "react";
import { useBuscaContatoMandatariaQuery } from '../../hooks/usePontosControle';
import { emptyValue } from '../../utils/formatters';



export default function ContatoMandataria({ setContatoMandataria }) {

    const [codUf, setCodUf] = useState('12');
    const { data, isLoading, isError, refetch } = useBuscaContatoMandatariaQuery(codUf);
    const listaContatosMandataria = data?.data || [];
    

    return (
        <div className={estilos.overlay_modal}>
            <div className={estilos.janela}>

                <div className={estilos.cabecalho}>
                    
                    <div className={estilos.secao_esquerda}>    
                        <h4>Contatos Mandatária</h4>
                        <label>Selecione uma UF:</label>
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

                <div className={estilos.container_tabela}>
                    <table className={estilos.tabela}>
                        
                        <thead>
                            <tr className={estilos.headerRow}>
                                <th className={estilos.colMedia}>Nome</th>
                                <th className={estilos.colPequena}>Cargo</th>
                                <th className={estilos.colPequena}>Tipo Setor</th>
                                <th className={estilos.colPequena}>Setor</th>
                                <th className={estilos.colPequena}>Telefone</th>
                                <th className={estilos.colMedia}>Email</th>
                                <th className={estilos.colGigante}>Observação</th>
                            </tr>
                        </thead>

                        <tbody>
                            {listaContatosMandataria.map((contato, index) => {
                                const idContato = listaContatosMandataria.id_contato;
                                const rowKey = String(idContato ?? `${contato.id_contato ?? 'sem-id'}-${index}`);

                                return (
                                    <Fragment key={rowKey}>
                                        <tr>
                                            <td className={estilos.compactCell}>{emptyValue(contato.nome)}</td>
                                            <td className={estilos.compactCell}>{emptyValue(contato.cargo)}</td>
                                            <td className={estilos.compactCell}>{emptyValue(contato.tipo_setor)}</td>
                                            <td className={estilos.compactCell}>{emptyValue(contato.setor)}</td>
                                            <td className={estilos.compactCell}>{emptyValue(contato.telefone)}</td>
                                            <td className={estilos.compactCell}>{emptyValue(contato.email)}</td>
                                            <td className={estilos.compactCell}>{emptyValue(contato.observacao)}</td>
                                        </tr>
                                    </Fragment>
                                );
                            })}
                        </tbody>

                    </table>
                </div>

            </div>
        </div>
    );
}

