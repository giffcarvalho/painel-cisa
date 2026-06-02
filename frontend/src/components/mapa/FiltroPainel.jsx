import estilos from "./FiltroPainel.module.css";
import { useState, useContext, useEffect } from "react";
import { X, Filter } from "lucide-react";
import FiltroSelect from "./FiltroSelect";
import { FiltrosContext } from "../../context/mapa/filtrosContext";
import FiltroSelecaoUnica from "./FiltroSelecaoUnica";


export default function FiltroPainel ({ setPainelFiltros }) {
    
    const { listas, filtros, buscarMunicipios, buscarNrPropostas, atualizarFiltro, limparFiltros } = useContext(FiltrosContext);
    const [rascunho, setRascunho] = useState({municipios: []})
    

    useEffect(() => {
        atualizarFiltro('cod_municipio', rascunho.municipios)
    }, [rascunho.municipios])

 
    
    const handleChange = (campo, valor, acao = 'TOGGLE') => {
        setRascunho(prev => {
            if (acao === 'LIMPAR') return {...prev, [campo]: []}
            
            if (acao === 'TODOS') {
                const atuais = prev[campo] || []
                const novos = [...new Set([...atuais, ...valor])]
                return { ...prev, [campo]: novos }
            }
    
            const valoresAtuais = prev[campo] || []
            if (valoresAtuais.includes(valor)) {
                return { ...prev, [campo]: valoresAtuais.filter(v => v !== valor) }
            } else {
                return { ...prev, [campo]: [...valoresAtuais, valor] }
            }
            })
        }


    return (
        <>
            <div className={estilos.filtrosPainel}>
                <div className={estilos.filtrosCabecalho}>
                    <div className={estilos.titulo}>
                        <Filter className={estilos.filterIcon}/>
                        <h2>Filtros do Mapa</h2>
                    </div>
                    <button className={estilos.botaoX} onClick={() => setPainelFiltros(false)}>
                        <X className={estilos.XFechar} />
                    </button>
                </div>
                
                <div className={estilos.filtrosSel}>
                    
                    <FiltroSelecaoUnica
                        key='uf'
                        id='cod_uf'
                        label='UF'
                        valorAtual={filtros.cod_uf}
                        opcoes={listas.ufs}
                        getValue={(uf)=>uf.cod_uf}
                        getLabel={(uf)=>uf.sigla_uf}
                        onChange={(valor)=> atualizarFiltro("cod_uf", valor)}
                    />
                    

                    <FiltroSelecaoUnica
                        key='municipio'
                        id='cod_municipio'
                        label='Município'
                        valorAtual={filtros.cod_municipio}
                        opcoes={listas.municipios}
                        getValue={(m)=>m.cod_municipio}
                        getLabel={(m)=>m.nome_municipio}
                        onBuscar={(texto) => buscarMunicipios(texto)}
                        onChange={(valor)=> atualizarFiltro("cod_municipio", valor)}
                    />
                    

                    <FiltroSelecaoUnica
                        key='nrProposta'
                        id='nrProposta'
                        label='Número da Proposta'
                        valorAtual={filtros.nr_proposta}
                        opcoes={listas.nrPropostas}
                        getValue={(nr)=>nr.nr_proposta}
                        getLabel={(nr)=>nr.nr_proposta}
                        onBuscar={(texto) => buscarNrPropostas(texto)}
                        onChange={(valor)=> atualizarFiltro("nr_proposta", valor)}
                    />



                </div>

                <div className={estilos.areaBotoes}>
                    <button className={estilos.botaoLimpar} onClick={limparFiltros} >Limpar Filtros</button>
                </div>
            </div>
            
        </>
    )
} 



/*
<FiltroSelect
                        key='municipio'
                        id='municipio'
                        label='Município'
                        valorAtual={rascunho.municipios}
                        opcoes={listas.municipios}
                        getValue={(m) => m.cod_municipio}
                        getLabel={(m) => m.nome_municipio}
                        onBuscar={(texto) => buscarMunicipios(texto)}
                        onChange={(valor, acao) => handleChange('municipios', valor, acao)}
/>
*/
