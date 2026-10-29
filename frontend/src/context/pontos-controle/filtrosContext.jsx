import { createContext, useCallback, useMemo, useState } from 'react';
import {
  FILTROS_INICIAIS_PONTOS_CONTROLE,
  contarFiltrosAtivosPontosControle,
} from './filtrosContextValue';

export const FiltrosPontosControleContext = createContext(null);

const clonarFiltrosIniciais = () => ({
  ...FILTROS_INICIAIS_PONTOS_CONTROLE,
});

const limparValor = (value) => String(value ?? '').trim();

export function FiltrosPontosControleProvider({ children }) {
  const [filtros, setFiltros] = useState(clonarFiltrosIniciais);
  const [filtroPrincipal, setFiltroPrincipal] = useState(null);

  const setFiltro = useCallback((nome_coluna, valor) => {
    const valorLimpo = limparValor(valor);

    if (!valorLimpo && nome_coluna === filtroPrincipal) {
      setFiltroPrincipal(null);
      setFiltros(clonarFiltrosIniciais());
      return;
    }

    if (valorLimpo && !filtroPrincipal) {
      setFiltroPrincipal(nome_coluna);
    }

    setFiltros((filtrosAtuais) => {
      if (!valorLimpo) {
        return {
          ...filtrosAtuais,
          [nome_coluna]: '',
        };
      }

      return {
        ...filtrosAtuais,
        [nome_coluna]: valorLimpo,
      };
    });
  }, [filtroPrincipal]);

  const limparFiltro = useCallback((nome_coluna) => {
    if (nome_coluna === filtroPrincipal) {
      setFiltroPrincipal(null);
      setFiltros(clonarFiltrosIniciais());
      return;
    }

    setFiltros((filtrosAtuais) => {
      return {
        ...filtrosAtuais,
        [nome_coluna]: '',
      };
    });
  }, [filtroPrincipal]);

  const limparTodosFiltros = useCallback(() => {
    setFiltroPrincipal(null);
    setFiltros(clonarFiltrosIniciais());
  }, []);

  const totalFiltrosAtivos = useMemo(
    () => contarFiltrosAtivosPontosControle(filtros),
    [filtros]
  );

  const value = useMemo(
    () => ({
      filtros,
      filtroPrincipal,
      totalFiltrosAtivos,
      setFiltro,
      limparFiltro,
      limparTodosFiltros,
      filtrosIniciais: FILTROS_INICIAIS_PONTOS_CONTROLE,
    }),
    [
      filtros,
      filtroPrincipal,
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
