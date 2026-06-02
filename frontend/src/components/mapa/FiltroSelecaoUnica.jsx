import estilos from "./FiltroSelecaoUnica.module.css"
import { ChevronDown, CircleX, } from 'lucide-react'
import { useState, useEffect } from "react";



export default function ({ id, label, valorAtual="", opcoes=[], getValue, getLabel, onBuscar, onChange }) {
    
    const [termoBusca, setTermoBusca] = useState('');
    const [aberto, setAberto] = useState(false); 
    const itemSelecionado = opcoes.find(item => getValue(item) === valorAtual);
    const opcoesFiltradas = opcoes.filter(item => getLabel(item).toLowerCase().includes(termoBusca.toLowerCase()));

    useEffect(() => {
        if (!aberto) {
            setTermoBusca(itemSelecionado? getLabel(itemSelecionado): "");
        }
    }, [valorAtual, aberto]);




    return (
        <div className={estilos.caixaExterna}
            tabIndex={-1}
            onBlur={(e) => {if (!e.currentTarget.contains(e.relatedTarget)) {setAberto(false)}}}
        >
            
            <label htmlFor={`filtro-${id}`} className={estilos.label}>
                    {label}
            </label>
            

            <div className={estilos.caixaInput}>
                <input className={estilos.input}
                    id={`filtro-${id}`}
                    value={termoBusca}
                    placeholder='Digite para filtrar...'
                    autoComplete='off'
                    onFocus={() => {
                        setAberto(true)
                        setTermoBusca("")
                    }}
                    onChange={(e) => {
                        const texto=e.target.value
                        setTermoBusca(texto)
                        setAberto(true)
                        if(onBuscar){onBuscar(texto)}
                    }}
                />
                
                
                <button className={estilos.XLimpar}
                    type="button"
                    onClick={() => {
                        setAberto(false)
                        setTermoBusca("")
                        onChange(null)
                    }}>
                    <CircleX/> 
                </button>



                <button className={estilos.setaDropDown}
                    type="button"
                    onClick={() => {
                        setAberto((v) => !v)
                        setTermoBusca("")
                    }}>
                    <ChevronDown/>
                </button>
                

                {aberto && (
                <div className={estilos.painelOpcoes}>
                    
                    <div className={estilos.caixaOpcoes}>
                        {opcoesFiltradas.map((item) => {
                            const valor = getValue(item)
                            
                            return (

                                <button className={estilos.opcao}
                                    type="button"
                                    key={valor}
                                    onClick={() => {
                                        onChange(valor)
                                        setTermoBusca("")
                                        setAberto(false)
                                    }}
                                >
                                    <span className={estilos.item}> {getLabel(item)} </span>
                                </button>
                            )
                        })}
                            {opcoesFiltradas.length === 0 && (
                                <div className={estilos.nenhumaOpcao}>
                                    Nenhuma opção encontrada
                                </div>
                            )}
                    </div>
                </div>
                )}
            </div>
        </div>
    )
} 