import estilos from "./FiltroSelect.module.css"
import { ChevronDown, X } from 'lucide-react'
import { useState, useEffect } from "react";



export default function ({ id, label, valorAtual=[], opcoes=[], getValue, getLabel, onBuscar, onChange }) {
    
    const [termoBusca, setTermoBusca] = useState('');
    const [aberto, setAberto] = useState(false); 
    
    
    const [labelsCache, setLabelsCache] = useState({})

    useEffect(() => {
        setLabelsCache(prev => ({ ...prev, ...Object.fromEntries(opcoes.map(o => [getValue(o), getLabel(o)]))}))
    }, [opcoes])
          
    return (
        <div className={estilos.caixaExterna}>
            
            <div className={estilos.caixaLabel}>
                <label htmlFor={`filtro-${id}`} className={estilos.label}>
                    {label}
                </label>
                {valorAtual.length > 0 && (
                    <span className={estilos.qtdeSelecionados}>
                        {valorAtual.length} selecionado(s)
                    </span>
                )}
            </div>


            <div className={estilos.caixaInput}>
                <input className={estilos.input}
                    id={`filtro-${id}`}
                    value={termoBusca}
                    placeholder='Digite para filtrar...'
                    autoComplete='off'
                    onFocus={() => setAberto(true)}
                    onBlur={() => setTimeout(() => setAberto(false), 200)}
                    onChange={(e)=>{
                        const texto=e.target.value
                        setTermoBusca(texto)
                        setAberto(true)
                        if(onBuscar){onBuscar(texto)}
                    }}
                />
                
                
                <button className={estilos.setaDropDown}
                    type="button"
                    /*onMouseDown={(e) => e.preventDefault()}*/
                    onClick={() => setAberto((atual) => !atual)}
                    aria-label={aberto ? 'Recolher Opções' : 'Mostrar Opções'}
                >
                    <ChevronDown/>
                </button>
                

                {aberto && (
                <div className={estilos.painelOpcoes}>
                    <div className={estilos.opcoesGerais}>
                        <button 
                            className={estilos.selecaoTodos}
                            type="button"
                            /*onMouseDown={(e) => e.preventDefault()}*/
                            onClick={() => onChange(opcoes.map(item => getValue(item)), 'TODOS')}
                        >
                            Marcar todos visíveis
                        </button>

                        <button 
                            className={estilos.selecaoLimpar}
                            type="button"
                            /*onMouseDown={(e) => e.preventDefault()}*/
                            onClick={() => onChange([], 'LIMPAR')}
                        >
                            Limpar Seleção
                        </button>
                    </div>
                    
                    <div className={estilos.caixaOpcoes}>
                        {opcoes.map((item) => {
                            const valor = getValue(item)
                            const selecionado = valorAtual.includes(valor);
                            return (

                                <button className={`${estilos.opcao} ${selecionado ? estilos.selecionado : estilos.normal}`}
                                    type="button"
                                    key={valor}
                                    /*onMouseDown={(e) => e.preventDefault()}*/
                                    onClick={() => onChange(valor, 'TOGGLE')}
                                >
                                    <div className={`${estilos.checkBox} ${selecionado ? estilos.selecionado : estilos.normal}`}>
                                        {selecionado && (
                                            <svg className={estilos.svg} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={estilos.item}> {getLabel(item)} </span>
                                </button>
                            )
                        })}
                            {opcoes.length === 0 && (
                                <div className={estilos.nenhumaOpcao}>
                                    Nenhuma opção encontrada
                                </div>
                            )}
                    </div>
                </div>
                )}        


            
                {valorAtual.length > 0 && (
                    <div className={estilos.caixaSelecionados}>
                        {valorAtual.map(item => (
                        <span key={item} className={estilos.listaSelecionados}>
                            <span className={estilos.spanInterno}>{labelsCache[item]}</span>

                            <button 
                                className={estilos.botaoXValorSelecionado}
                                type="button"
                                onClick={() => onChange(item, 'TOGGLE')}
                                aria-label={`Remover ${item}`}
                            >
                                <X className={estilos.xSelecionados}/>
                            </button>
                        </span>
                    ))}
                    </div>
                )}

            </div>
        </div>
    )
} 