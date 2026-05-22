import { useQuery } from '@tanstack/react-query'
import { carteiraDsrApi } from '@/api/carteiraDsr'
import { useFiltros } from '@/context/useFiltros'

// 1. KPIs
export function useKpisQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['carteira-dsr', 'kpis', filtros],
    queryFn: async () => (await carteiraDsrApi.getKpis(filtros)).data,
  })
}

// 2. Filtros
export function useOpcoesFiltrosQuery() {
  return useQuery({
    queryKey: ['carteira-dsr', 'opcoes-filtros'],
    queryFn: async () => (await carteiraDsrApi.getFiltros()).data,
    staleTime: 60 * 60 * 1000,
  })
}

export function useBuscaFiltroQuery(campo, termo) {
  const termoNormalizado = termo?.trim() || ''

  return useQuery({
    queryKey: ['carteira-dsr', 'busca-filtro', campo, termoNormalizado],
    queryFn: async () => (
      await carteiraDsrApi.buscarFiltro(campo, termoNormalizado)
    ).data.data,
    enabled: Boolean(campo) && termoNormalizado.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}

// 3. Valores por UF
export function useValoresUfQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['carteira-dsr', 'valores-uf', filtros],
    queryFn: async () => (await carteiraDsrApi.getLocalidade(filtros)).data.data,
  })
}

// 4. Valores por Ação
export function useValoresAcaoQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['carteira-dsr', 'valores-acao', filtros],
    queryFn: async () => (await carteiraDsrApi.getAcoesValores(filtros)).data.data,
  })
}

// 5. Quantidade de Instrumentos por Ação
export function useAcoesQtdeQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['carteira-dsr', 'acoes-qtde', filtros],
    queryFn: async () => (await carteiraDsrApi.getAcoesQtde(filtros)).data.data,
  })
}

// 6. Valor por Tipo de Instrumento
export function useTipoInstrumentoQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['carteira-dsr', 'tipo-instrumento', filtros],
    queryFn: async () => (await carteiraDsrApi.getTipoInstr(filtros)).data.data,
  })
}

// 7. Fases de Execução
export function useFasesQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['carteira-dsr', 'fases-execucao', filtros],
    queryFn: async () => (await carteiraDsrApi.getFaseSituacao(filtros)).data.data,
  })
}

// 8. Situação de Contratação
export function useSituacaoContratacaoQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['carteira-dsr', 'situacao-contratacao', filtros],
    queryFn: async () => (await carteiraDsrApi.getSituacaoCont(filtros)).data.data,
  })
}

// 9. Mapa Coroplético
export function useMapaCoropleticoQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['carteira-dsr', 'mapa-coropletico', filtros],
    queryFn: async () => (await carteiraDsrApi.getMapaCoropl(filtros)).data.data,
  })
}

// 10. Mapa de Pontos
export function useMapaPontosQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['carteira-dsr', 'mapa-pontos', filtros],
    queryFn: async () => (await carteiraDsrApi.getMapaPontos(filtros)).data.data,
  })
}
