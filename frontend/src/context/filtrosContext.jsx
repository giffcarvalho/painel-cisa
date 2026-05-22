import { useMemo, useState } from 'react'
import { FiltrosContext } from './filtrosContextValue'

const FILTROS_INICIAIS = {
  componente:           [],
  uf:                   [],
  municipio:            [],
  novo_pac:             [],
  situacao_obra:        [],
  situacao_contratacao: [],
  fase_instrumento:     [],
  carteira_ativa:       [],
  ano_proposta:         [],
  tipo_instrumento:     [],
  acao_padronizada:     [],
  acao_orcamentaria:    [],
  nr_proposta:          [],
  nome_proponente:      [],
  termino_vigencia:     [],
  nr_proposta_selecao_pac: [],
  nr_instrumento:       []
}

function normalizarFiltros(filtros) {
  return Object.fromEntries(
    Object.keys(FILTROS_INICIAIS).map((campo) => {
      const valor = filtros?.[campo]

      if (!Array.isArray(valor)) {
        return [campo, []]
      }

      const valoresNormalizados = [...new Set(
        valor
          .map((item) => String(item).trim())
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, 'pt-BR'))

      return [campo, valoresNormalizados]
    })
  )
}

export function FiltrosProvider({ children }) {
  const [filtros, setFiltros] = useState(() => normalizarFiltros(FILTROS_INICIAIS))

  const aplicarFiltros = (novosFiltros) => {
    setFiltros(normalizarFiltros(novosFiltros))
  }

  const limparFiltros = () => {
    setFiltros(normalizarFiltros(FILTROS_INICIAIS))
  }

  const qtdeFiltrosAtivos = Object.values(filtros).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null
  ).length

  const contextValue = useMemo(() => ({
    filtros,
    aplicarFiltros,
    limparFiltros,
    qtdeFiltrosAtivos,
  }), [filtros, qtdeFiltrosAtivos])

  return (
    <FiltrosContext.Provider value={contextValue}>
      {children}
    </FiltrosContext.Provider>
  )
}

