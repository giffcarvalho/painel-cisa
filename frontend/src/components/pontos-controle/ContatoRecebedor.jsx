import estilos from "./ContatoRecebedor.module.css";
import { useState } from "react";
import { X } from "lucide-react";
import { IMaskInput } from "react-imask";


export default function ContatoRecebedor({fecharJanelaContato}) {

    const [nome, setNome] = useState();
    const [cargo, setCargo] = useState();
    const [telefone, setTelefone] = useState();
    const [email, setEmail] = useState();
    const [observacao, setObservacao] = useState();



    return (
        <div className={estilos.overlay_modal}>

            <form className={estilos.janela}>

                <div className={estilos.cabecalho_contato}>
                    <h4>Contato com o ente recebedor - </h4>
                    <button 
                        type="button"
                        className={estilos.botaoX}
                        onClick={fecharJanelaContato}>
                        <X className={estilos.XFechar} />
                    </button>
                </div>


                <div className={estilos.contato}>
                    
                    <div className={estilos.contato_caixa}>
                        <p>Contato 1:</p>
                        <div className={estilos.linha}>
                            <input
                                type="text"
                                className={estilos.campo_nome}
                                placeholder="Nome do contato"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                            />

                            <input
                                type="text"
                                className={estilos.campo_cargo}
                                placeholder="Cargo"
                                value={cargo}
                                onChange={(e) => setCargo(e.target.value)}
                            />

                            <IMaskInput
                                mask="(00) 00000-0000"
                                className={estilos.campo_telefone}
                                placeholder="(00) 00000-0000"
                                value={telefone}
                                onAccept={(value) => setTelefone(value)}
                            />
                        </div>
                    
                        <div className={estilos.linha}>
                            <input
                                type="email"
                                className={estilos.campo_email}
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <textarea
                                className={estilos.campo_observacao}
                                rows="2"
                                maxLength={115}
                                placeholder="Observação"
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                            />
                        </div>
                    </div>


                    <div className={estilos.contato_caixa}>
                        <p>Contato 2:</p>
                        <div className={estilos.linha}>
                            <input
                                type="text"
                                className={estilos.campo_nome}
                                placeholder="Nome do contato"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                            />

                            <input
                                type="text"
                                className={estilos.campo_cargo}
                                placeholder="Cargo"
                                value={cargo}
                                onChange={(e) => setCargo(e.target.value)}
                            />

                            <IMaskInput
                                mask="(00) 00000-0000"
                                className={estilos.campo_telefone}
                                placeholder="(00) 00000-0000"
                                value={telefone}
                                onAccept={(value) => setTelefone(value)}
                            />
                        </div>
                        
                        <div className={estilos.linha}>
                            <input
                                type="email"
                                className={estilos.campo_email}
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <textarea
                                className={estilos.campo_observacao}
                                rows="2"
                                maxLength={115}
                                placeholder="Observação"
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                            />
                        </div>
                    </div>


                    <div className={estilos.contato_caixa}>
                        <p>Contato 3:</p>
                        <div className={estilos.linha}>
                            <input
                                type="text"
                                className={estilos.campo_nome}
                                placeholder="Nome do contato"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                            />

                            <input
                                type="text"
                                className={estilos.campo_cargo}
                                placeholder="Cargo"
                                value={cargo}
                                onChange={(e) => setCargo(e.target.value)}
                            />

                            <IMaskInput
                                mask="(00) 00000-0000"
                                className={estilos.campo_telefone}
                                placeholder="(00) 00000-0000"
                                value={telefone}
                                onAccept={(value) => setTelefone(value)}
                            />
                        </div>
                        
                        <div className={estilos.linha}>
                            <input
                                type="email"
                                className={estilos.campo_email}
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <textarea
                                className={estilos.campo_observacao}
                                rows="2"
                                maxLength={115}
                                placeholder="Observação"
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                            />
                        </div>
                    </div>


                    <div className={estilos.contato_caixa}>
                        <p>Contato 4:</p>
                        <div className={estilos.linha}>
                            <input
                                type="text"
                                className={estilos.campo_nome}
                                placeholder="Nome do contato"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                            />

                            <input
                                type="text"
                                className={estilos.campo_cargo}
                                placeholder="Cargo"
                                value={cargo}
                                onChange={(e) => setCargo(e.target.value)}
                            />

                            <IMaskInput
                                mask="(00) 00000-0000"
                                className={estilos.campo_telefone}
                                placeholder="(00) 00000-0000"
                                value={telefone}
                                onAccept={(value) => setTelefone(value)}
                            />
                        </div>
                        
                        <div className={estilos.linha}>
                            <input
                                type="email"
                                className={estilos.campo_email}
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <textarea
                                className={estilos.campo_observacao}
                                rows="2"
                                maxLength={115}
                                placeholder="Observação"
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                            />
                        </div>
                    </div>





                </div>
                
            </form>

        </div>
    )
}