import estilos from "./FiltroPainel.module.css";
import { useState, useContext, useEffect } from "react";
import { X, Filter } from "lucide-react";
import FiltroSelect from "./FiltroSelect";
import { FiltrosContext } from "../../context/mapa/filtrosContext";


export default function FiltroPainel ({ setPainelFiltros }) {
    
    const { listas, buscarMunicipios, atualizarFiltro, filtros } = useContext(FiltrosContext);
    const [rascunho, setRascunho] = useState({municipios: [], ufs: []})
    

    useEffect(() => {
        atualizarFiltro('cod_uf', rascunho.ufs)
    }, [rascunho.ufs])

    useEffect(() => {
        atualizarFiltro('cod_municipio', rascunho.municipios)
    }, [rascunho.municipios])


    const handleChange = (campo, valor, acao = 'TOGGLE') => {
        setRascunho(prev => {
            if (acao === 'LIMPAR') return { ...prev, [campo]: [] }
            
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
                    <FiltroSelect
                        key='uf'
                        id='uf'
                        label='UF'
                        valorAtual={rascunho.ufs}
                        opcoes={listas.ufs}
                        getValue={(u) => u.cod_uf}
                        getLabel={(u) => u.sigla_uf}
                        onChange={(valor, acao) => {const novo = handleChange('ufs', valor, acao)}}
                    />
                    
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

                </div>

                <div className={estilos.areaBotoes}>
                    <button className={estilos.botaoLimpar}>Limpar Filtros</button>
                    <button className={estilos.botaoAplicar}>Aplicar Filtros</button>
                </div>
            </div>
            
        </>
    )
} 