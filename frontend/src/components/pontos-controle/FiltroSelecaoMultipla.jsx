import styles from './FiltroSelecaoMultipla.module.css';
import { ChevronDown, X } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react';
import { normalizarTexto } from '@/utils/normalizer';
import { useBuscaOpcoesPontosControleQuery } from '@/hooks/usePontosControle';
import { useFiltrosPontosControle } from '@/context/pontos-controle/useFiltrosPontosControle';



export default function FiltroSelecaoMultipla({ nome_coluna }) {

    const [aberto, setAberto] = useState(false);
    const [termoBusca, setTermoBusca] = useState('');
    const filtroRef = useRef(null);
    const mapaRotulosRef = useRef({});
    const { filtros, setFiltro, limparFiltro } = useFiltrosPontosControle();
    const { data, isLoading } = useBuscaOpcoesPontosControleQuery(filtros, nome_coluna, aberto);
    
    const valoresSelecionadosContexto = useMemo(() => {
        const valorAtual = filtros[nome_coluna];
        if (!valorAtual) return [];
        return String(valorAtual).split(',').map(v => v.trim());
    }, [filtros, nome_coluna]);


    const opcoes = useMemo(() => {
        if (!data || !data.lista) return [];

        const listaFormatada = data.lista.map(item => {
            const valorStr = String(item.valor);
            const rotuloStr = item.rotulo;

            mapaRotulosRef.current[valorStr] = rotuloStr;

            return {
                valor: valorStr,
                rotulo: rotuloStr,
                selecionado: valoresSelecionadosContexto.includes(valorStr)
            };
        });

        return listaFormatada;
    }, [data, valoresSelecionadosContexto]);


    useEffect(() => {
        const gerenciamentoClicarFora = (event) => {
            
            if (filtroRef.current && !filtroRef.current.contains(event.target)) {
                setAberto(false);
                setTermoBusca('');
            }
        };

        document.addEventListener('mousedown', gerenciamentoClicarFora);

        return () => {
            document.removeEventListener('mousedown', gerenciamentoClicarFora);
        };

    }, []);


    const opcoesSelecionadas = useMemo(() => {
        
        return valoresSelecionadosContexto.map(valor => {
            const opcaoNaLista = opcoes.find(o => o.valor === valor);
            if (opcaoNaLista) {
                return opcaoNaLista;
            }
            
            const rotuloConhecido = mapaRotulosRef.current[valor] || valor;
            return {
                valor,
                rotulo: rotuloConhecido,
                selecionado: true
            };
        });
    }, [opcoes, valoresSelecionadosContexto]);


    const termoBuscaNormalizado = normalizarTexto(termoBusca);
    

    const opcoesFiltradasTermoBusca = termoBusca.trim().length < 2 
        ? opcoes 
        : opcoes.filter((opcao) => 
            normalizarTexto(opcao.rotulo).includes(termoBuscaNormalizado)
        );
    

    const textoPlaceholder = (() => {
        
        if (opcoesSelecionadas.length === 0) return "Todos";

        const primeiraOpcao = opcoesSelecionadas[0].rotulo;
        const quantidadeOutrasOpcoes = opcoesSelecionadas.length -1;

        return quantidadeOutrasOpcoes > 0 ? `${primeiraOpcao} +${quantidadeOutrasOpcoes}` : primeiraOpcao
    })();


    const alternarSelecaoOpcao = (valorSelecionado) => {
        const valorStr = String(valorSelecionado);
        let novosValores;

        if (valoresSelecionadosContexto.includes(valorStr)) {
            novosValores = valoresSelecionadosContexto.filter(v => v !== valorStr);
        } else {
            novosValores = [...valoresSelecionadosContexto, valorStr];
        }

        const valorParaContexto = novosValores.length > 0 ? novosValores.join(',') : '';
        setFiltro(nome_coluna, valorParaContexto);
    };

    
    const desmarcarTodasOpcoes = () => {
        limparFiltro(nome_coluna);
    };



    return (
        <div 
            className={styles.wrapper}
            ref={filtroRef}
        >
            
            <div className={styles.headerWrapper}>    
                <button 
                    className={styles.trigger}
                    type="button"
                    onClick={() => {
                        setAberto((atual) => !atual);
                        setTermoBusca('')
                    }}
                >
                    <span className={`${styles.placeholder} ${opcoesSelecionadas.length > 0 ? styles.placeholderComSelecao: ''}`}>{textoPlaceholder}</span>
                    <ChevronDown className={`${styles.chevron} ${aberto? styles.chevronOpen: ''}`}/>
                </button>

                {opcoesSelecionadas.length > 0 && (    
                    <button 
                        type="button"
                        title="Limpar filtro"
                        onClick={() => {
                            setAberto(false);
                            setTermoBusca('');
                            desmarcarTodasOpcoes();
                        }}
                    >
                        <X className={styles.clearButton}/> 
                    </button>
                )}
            </div>

            {aberto && (
                <div className={styles.menuWrapper}>
                    
                    <div className={styles.searchWrapper}>
                        <input
                            className={styles.searchField}
                            value={termoBusca}
                            autoFocus
                            autoComplete="off"
                            placeholder="Buscar..."
                            onChange={(e) => setTermoBusca(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setAberto(false);
                                    setTermoBusca('');
                                }
                            }}
                        />
                    </div>
                    
                    <div className={styles.selectedWrapper}>
                        {opcoes.filter((opcao) => opcao.selecionado === true).map((opcao) => {
                            return (
                                <div 
                                    className={styles.selectedOption}
                                    key={opcao.valor}
                                >    
                                    <span>{opcao.rotulo}</span>  
                                    <button 
                                        
                                        type="button"
                                        title="Excluir"
                                        onClick={() => alternarSelecaoOpcao(opcao.valor)}
                                    >
                                        <X className={styles.clearSelectedButton}/> 
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.optionsWrapper}>
                        {isLoading && (
                            <span className={styles.options}>Carregando opções</span>
                        )}
                        {opcoesFiltradasTermoBusca.map((opcao) => {
                            return (
                                <label 
                                    className={styles.options}
                                    key={opcao.valor}
                                >
                                    <input 
                                        type="checkbox"
                                        checked={opcao.selecionado}
                                        onChange={() => alternarSelecaoOpcao(opcao.valor)}
                                    />
                                    {opcao.rotulo}
                                </label>
                            );
                        })}
                    </div>

                </div>
            )}

        </div>
    );
}