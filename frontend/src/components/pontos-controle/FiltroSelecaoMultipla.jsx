import styles from './FiltroSelecaoMultipla.module.css';
import { ChevronDown, CircleX, X } from 'lucide-react'
import { useState } from 'react';



export default function FiltroSelecaoMultipla() {

    const [aberto, setAberto] = useState(false);
    const [termoBusca, setTermoBusca] = useState('');
    const [opcoes, setOpcoes] = useState([
        { valor: "teste_1", rotulo: "Teste 1", selecionado: false },
        { valor: "teste_2", rotulo: "Teste 2", selecionado: false },
        { valor: "teste_3", rotulo: "Teste 3", selecionado: false },
        { valor: "teste_4", rotulo: "Teste 4", selecionado: false },
        { valor: "teste_5", rotulo: "Teste 5", selecionado: false },
        { valor: "teste_6", rotulo: "Teste 6", selecionado: false },
    ]);
    

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


    return (
        <div className={styles.wrapper}>
            
            <div className={styles.headerWrapper}>    
                <button 
                    className={styles.trigger}
                    type="button"
                    onClick={() => {
                        setAberto((atual) => !atual);
                        setTermoBusca('')
                    }}
                >
                    <span className={styles.placeholder}>Todos</span>
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
                    <CircleX className={styles.clearButton}/> 
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
                        {opcoes.map((opcao) => {
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