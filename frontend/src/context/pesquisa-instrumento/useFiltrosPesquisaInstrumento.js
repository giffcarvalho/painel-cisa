import { useContext } from 'react';
import { FiltrosPesquisaInstrumentoContext } from './filtrosContext';

export function useFiltrosPesquisaInstrumento() {
  const context = useContext(FiltrosPesquisaInstrumentoContext);

  if (!context) {
    throw new Error(
      'useFiltrosPesquisaInstrumento deve ser usado dentro de FiltrosPesquisaInstrumentoProvider'
    );
  }

  return context;
}