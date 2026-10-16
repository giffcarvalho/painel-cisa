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

  const setFiltro = useCallback((campo, valor) => {
    const valorLimpo = limparValor(valor);

    if (!valorLimpo && campo === filtroPrincipal) {
      setFiltroPrincipal(null);
      setFiltros(clonarFiltrosIniciais());
      return;
    }

    if (valorLimpo && !filtroPrincipal) {
      setFiltroPrincipal(campo);
    }

    setFiltros((filtrosAtuais) => {
      if (!valorLimpo) {
        return {
          ...filtrosAtuais,
          [campo]: '',
        };
      }

      return {
        ...filtrosAtuais,
        [campo]: valorLimpo,
      };
    });
  }, [filtroPrincipal]);

  const limparFiltro = useCallback((campo) => {
    if (campo === filtroPrincipal) {
      setFiltroPrincipal(null);
      setFiltros(clonarFiltrosIniciais());
      return;
    }

    setFiltros((filtrosAtuais) => {
      return {
        ...filtrosAtuais,
        [campo]: '',
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
