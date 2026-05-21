import { useContext } from 'react'
import { FiltrosContext } from './filtrosContextValue'

export function useFiltros() {
  const ctx = useContext(FiltrosContext)
  if (!ctx) throw new Error('useFiltros deve ser usado dentro de FiltrosProvider')
  return ctx
}
