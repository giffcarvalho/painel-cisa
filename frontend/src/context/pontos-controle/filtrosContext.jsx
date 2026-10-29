import { createContext, useCallback, useMemo, useState } from 'react';
import { FILTROS_INICIAIS_PONTOS_CONTROLE, contarFiltrosAtivosPontosControle } from './filtrosContextValue';

export const FiltrosPontosControleContext = createContext(null);

const clonarFiltrosIniciais = () => ({ ...FILTROS_INICIAIS_PONTOS_CONTROLE });

const limparValor = (value) => String(value ?? '').trim();

export function FiltrosPontosControleProvider({ children }) {
  const [filtros, setFiltros] = useState(clonarFiltrosIniciais);
  
  const setFiltro = useCallback((nome_coluna, valor) => {
    const valorLimpo = limparValor(valor);

    setFiltros((filtrosAtuais) => ({
      ...filtrosAtuais,
      [nome_coluna]: valorLimpo,
    }));
  }, []);

  const limparFiltro = useCallback((nome_coluna) => {
    setFiltros((filtrosAtuais) => ({
      ...filtrosAtuais,
      [nome_coluna]: '',
    }));
  }, []);


  const limparTodosFiltros = useCallback(() => {
    setFiltros(clonarFiltrosIniciais());
  }, []);

  const totalFiltrosAtivos = useMemo(
    () => contarFiltrosAtivosPontosControle(filtros),
    [filtros]
  );

  const value = useMemo(
    () => ({
      filtros,
      totalFiltrosAtivos,
      setFiltro,
      limparFiltro,
      limparTodosFiltros,
      filtrosIniciais: FILTROS_INICIAIS_PONTOS_CONTROLE,
    }),
    [
      filtros,
      totalFiltrosAtivos,
      setFiltro,
      limparFiltro,
      limparTodosFiltros,
    ]
  );

  return (
    <FiltrosPontosControleContext.Provider value={value}>
      {children}
    </FiltrosPontosControleContext.Provider>
  );
}
