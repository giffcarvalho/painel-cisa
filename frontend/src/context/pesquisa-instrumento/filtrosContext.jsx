import { createContext, useCallback, useMemo, useState } from 'react';
import {
  FILTROS_INICIAIS_PESQUISA_INSTRUMENTO,
  contarFiltrosAtivosPesquisaInstrumento,
} from './filtrosContextValue';

export const FiltrosPesquisaInstrumentoContext = createContext(null);

const clonarFiltrosIniciais = () => ({
  ...FILTROS_INICIAIS_PESQUISA_INSTRUMENTO,
});

const limparValor = (value) => String(value ?? '').trim();

export function FiltrosPesquisaInstrumentoProvider({ children }) {
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
    () => contarFiltrosAtivosPesquisaInstrumento(filtros),
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
      filtrosIniciais: FILTROS_INICIAIS_PESQUISA_INSTRUMENTO,
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
    <FiltrosPesquisaInstrumentoContext.Provider value={value}>
      {children}
    </FiltrosPesquisaInstrumentoContext.Provider>
  );
}
