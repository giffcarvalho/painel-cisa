import styles from './FiltroSelecaoMultipla.module.css';
import { ChevronDown, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react';
import { normalizarTexto } from '@/utils/normalizer';



export default function FiltroSelecaoMultipla() {

    const [aberto, setAberto] = useState(false);
    const [termoBusca, setTermoBusca] = useState('');
    const [opcoes, setOpcoes] = useState([
        { valor: 21, rotulo: "Olho D'Água do Piauí", selecionado: false },
        { valor: 23, rotulo: "Olhos-d'Água", selecionado: false },
        { valor: 24, rotulo: "Mãe d'Água", selecionado: false },
        { valor: 25, rotulo: "Olho d'Água das Flores", selecionado: false },
        { valor: 26, rotulo: "Não-Me-Toque", selecionado: false },
        { valor: 27, rotulo: "Apicum-Açu", selecionado: false },
    ]);
    

    const filtroRef = useRef(null);
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


    const alternarSelecaoOpcao = (valorSelecionado) => {
        const novasOpcoes = opcoes.map((opcao) => {
            if (opcao.valor === valorSelecionado) {
                return { ...opcao, selecionado: !opcao.selecionado };
            }
            return opcao;
        });
        setOpcoes(novasOpcoes);
    };


    const desmarcarTodasOpcoes = () => {
        const novasOpcoes = opcoes.map((opcao) => ({
            ...opcao,
            selecionado: false
        }));
        setOpcoes(novasOpcoes);
    };


    const opcoesSelecionadas = opcoes.filter((opcao) => opcao.selecionado === true);
    

    const textoPlaceholder = (() => {
        
        if (opcoesSelecionadas.length === 0) return "Todos";

        const primeiraOpcao = opcoesSelecionadas[0].rotulo;
        const quantidadeOutrasOpcoes = opcoesSelecionadas.length -1;

        return quantidadeOutrasOpcoes > 0 ? `${primeiraOpcao} +${quantidadeOutrasOpcoes}` : primeiraOpcao
    })();


    const termoBuscaNormalizado = normalizarTexto(termoBusca);
    
    
    const opcoesFiltradasTermoBusca = termoBusca.trim().length < 2 
        ? opcoes 
        : opcoes.filter((opcao) => 
            normalizarTexto(opcao.rotulo).includes(termoBuscaNormalizado)
        );


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