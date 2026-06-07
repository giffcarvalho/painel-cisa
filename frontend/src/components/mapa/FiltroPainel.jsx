import estilos from "./FiltroPainel.module.css";
import { useContext, useEffect} from "react";
import { X, Filter } from "lucide-react";
import { FiltrosContext } from "../../context/mapa/filtrosContext";
import FiltroSelecaoUnica from "./FiltroSelecaoUnica";


export default function FiltroPainel ({ setPainelFiltros, layers }) {
    
    const {
        listas,
        filtros,
        buscarMunicipios,
        buscarNrPropostas,
        buscarNrInstrumentos,
        buscarLocalidades,
        buscarLocalidadeEnderecos,
        buscarCategoriasMetropolitanas,
        atualizarFiltro,
        limparFiltros
    } = useContext(FiltrosContext);

    
    //verifica se as camadas estão visíveis, pois a existência de alguns filtros dependem da camada a ser filtrada estar ligada
    const localidadesVisivel = layers.find(l => l.id === "localidades_2022")?.visivel;
    const enderecosVisivel = layers.find(l => l.id === "enderecos_2022")?.visivel;
    const carteiraVisivel = layers.find(l => l.id === "geometrias_carteira_dsr")?.visivel;
    const informacoesMunicipaisVisivel = layers.find(l => l.id === "informacoes_municipais")?.visivel;

    useEffect(() => {

    if (!localidadesVisivel && filtros.cod_localidade) {
        atualizarFiltro("cod_localidade", null);
    }
    if (!enderecosVisivel && filtros.cod_dsc_localidade) {
        atualizarFiltro("cod_dsc_localidade", null);
    }
    if (!carteiraVisivel) {
        atualizarFiltro("nr_proposta", null);
        atualizarFiltro("nr_instrumento", null);
    }
    if (!informacoesMunicipaisVisivel) {
        atualizarFiltro("cod_catmetropol", null);
        atualizarFiltro("subgrupo", null);
    }


    }, [localidadesVisivel, enderecosVisivel, carteiraVisivel, informacoesMunicipaisVisivel]);

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
                        getLabel={(m)=>m.nome}
                        onBuscar={(texto) => buscarMunicipios(texto)}
                        onChange={(valor)=> atualizarFiltro("cod_municipio", valor)}
                    />
                    
                    {(filtros.cod_municipio) && (layers.find(l => l.id === "localidades_2022")?.visivel) && (
                        <>
                            <FiltroSelecaoUnica
                                key='localidade'
                                id='cod_localidade'
                                label='Localidades (principais)'
                                valorAtual={filtros.cod_localidade}
                                opcoes={listas.localidades}
                                getValue={(l)=>l.cod_localidade}
                                getLabel={(l)=>l.nome_localidade}
                                onBuscar={(texto) => buscarLocalidades(texto)}
                                onChange={(valor)=> atualizarFiltro("cod_localidade", valor)}
                            />
                        </>
                    )}


                    {(filtros.cod_municipio) && (layers.find(l => l.id === "enderecos_2022")?.visivel) && (
                        <>    
                            <FiltroSelecaoUnica
                                key='localidadeEnderecos'
                                id='cod_dsc_localidade'
                                label='Localidades dos Endereços (menor porte)'
                                valorAtual={filtros.cod_dsc_localidade}
                                opcoes={listas.localidadeEnderecos}
                                getValue={(e)=>e.cod_dsc_localidade}
                                getLabel={(e)=>e.dsc_localidade}
                                onBuscar={(texto) => buscarLocalidadeEnderecos(texto)}
                                onChange={(valor)=> atualizarFiltro("cod_dsc_localidade", valor)}
                            />
                        </>
                    )}

                    

                    {(layers.find(l => l.id === "geometrias_carteira_dsr")?.visivel) && (
                        <>
                            <FiltroSelecaoUnica
                                key='nrInstrumento'
                                id='nrInstrumento'
                                label='Número do Instrumento'
                                valorAtual={filtros.nr_instrumento}
                                opcoes={listas.nrInstrumentos}
                                getValue={(nr)=>nr.nr_instrumento}
                                getLabel={(nr)=>nr.nr_instrumento}
                                onBuscar={(texto) => buscarNrInstrumentos(texto)}
                                onChange={(valor)=> atualizarFiltro("nr_instrumento", valor)}
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
                        </>
                    )}


                    {(informacoesMunicipaisVisivel) && (
                        <>    
                            <FiltroSelecaoUnica
                                key='categoriasMetropolitanas'
                                id='cod_catmetropol'
                                label='Categorias Metropolitanas'
                                valorAtual={filtros.cod_catmetropol}
                                opcoes={listas.categoriasMetropolitanas}
                                getValue={(e)=>e.cod_catmetropol}
                                getLabel={(e)=>e.label_catmetropol}
                                onBuscar={(texto) => buscarCategoriasMetropolitanas(texto)}
                                onChange={(valor)=> atualizarFiltro("cod_catmetropol", valor)}
                            />

                            <FiltroSelecaoUnica
                                key='subgrupo'
                                id='subgrupo'
                                label='Subgrupo - PAC'
                                valorAtual={filtros.subgrupo}
                                opcoes={listas.subgrupo}
                                getValue={(e)=>e.subgrupo}
                                getLabel={(e)=>e.subgrupo}
                                onChange={(valor)=> atualizarFiltro("subgrupo", valor)}
                            />

                            <FiltroSelecaoUnica
                                key='semiarido_2022'
                                id='semiarido_2022'
                                label='Semiarido'
                                valorAtual={filtros.semiarido_2022}
                                opcoes={listas.semiarido_2022}
                                getValue={(e)=>e.semiarido_2022}
                                getLabel={(e)=>e.semiarido_2022}
                                onChange={(valor)=> atualizarFiltro("semiarido_2022", valor)}
                            />

                            <FiltroSelecaoUnica
                                key='amazonia_legal'
                                id='amazonia_legal'
                                label='Amazônia Legal'
                                valorAtual={filtros.amazonia_legal}
                                opcoes={listas.amazonia_legal}
                                getValue={(e)=>e.amazonia_legal}
                                getLabel={(e)=>e.amazonia_legal}
                                onChange={(valor)=> atualizarFiltro("amazonia_legal", valor)}
                            />

                            <FiltroSelecaoUnica
                                key='vale_jequetinhonha'
                                id='vale_jequetinhonha'
                                label='Vale do Jequetinhonha'
                                valorAtual={filtros.vale_jequetinhonha}
                                opcoes={listas.vale_jequetinhonha}
                                getValue={(e)=>e.vale_jequetinhonha}
                                getLabel={(e)=>e.vale_jequetinhonha}
                                onChange={(valor)=> atualizarFiltro("vale_jequetinhonha", valor)}
                            />

                        </>
                    )}



                </div>

                <div className={estilos.areaBotoes}>
                    <button className={estilos.botaoLimpar} onClick={limparFiltros} >Limpar Filtros</button>
                </div>
            </div>
            
        </>
    )
} 




//Trechos removidos pois eram do filtro de seleção múltipla
/*
const [rascunho, setRascunho] = useState({municipios: []})
    

    useEffect(() => {
        if (rascunho.municipios.length > 0) {
            atualizarFiltro('cod_municipio', rascunho.municipios)
        }
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
*/




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
