import { useContext } from 'react';
import { FiltrosPontosControleContext } from './filtrosContext';

export function useFiltrosPontosControle() {
  const context = useContext(FiltrosPontosControleContext);

  if (!context) {
    throw new Error(
      'useFiltrosPontosControle deve ser usado dentro de FiltrosPontosControleProvider'
    );
  }

  return context;
}