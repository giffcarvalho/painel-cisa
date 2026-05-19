import { createContext, useContext, useMemo, useState } from 'react'

const FiltrosContext = createContext(null)

// espelha exatamente os campos do FiltrosCarteiraDSR do backend
const FILTROS_INICIAIS = {
  componente:                   [],
  uf:                           [],
  municipio:                    [],
  novo_pac:                     [],
  situacao_obra:                [],
  situacao_contratacao:         [],
  fase_instrumento:             [],
  carteira_ativa:               [],
  ano_proposta:                 [],
  tipo_instrumento:             [],
  acao_padronizada:             [],
  acao_orcamentaria:            [],
  nr_proposta:                  [],
  nome_proponente:              [],
  termino_vigencia:             [],
  nr_proposta_selecao_pac:      [],
  nr_instrumento:               []
}

export function FiltrosProvider({ children }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS)
  const [isDrawerOpen, setDrawerOpen] = useState(false)

  const aplicarFiltros = (novosFiltros) => setFiltros(novosFiltros)
  const limparFiltros  = ()             => setFiltros(FILTROS_INICIAIS)

  const qtdeFiltrosAtivos = Object.values(filtros).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null
  ).length

  const contextValue = useMemo(() => ({
    filtros,
    aplicarFiltros,
    limparFiltros,
    isDrawerOpen,
    setDrawerOpen,
    qtdeFiltrosAtivos,
  }), [filtros, isDrawerOpen, qtdeFiltrosAtivos])

  return (
    <FiltrosContext.Provider value={{
      filtros, aplicarFiltros, limparFiltros,
      isDrawerOpen, setDrawerOpen,
      qtdeFiltrosAtivos,
    }}>
      {children}
    </FiltrosContext.Provider>
  )
}

export const useFiltros = () => {
  const ctx = useContext(FiltrosContext)
  if (!ctx) throw new Error('useFiltros deve ser usado dentro de FiltrosProvider')
  return ctx
}