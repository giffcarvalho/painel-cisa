import { useQuery } from '@tanstack/react-query'
//import { carteiraDsrApi } from '@/api/carteiraDsr'
import { useFiltros } from '@/context/mapa/useFiltrosMapa'


// 1. Filtros
export function useOpcoesFiltrosQuery() {
  return useQuery({
    queryKey: ['mapa', 'opcoes-filtros'],
    queryFn: async () => (await mapaApi.getFiltros()).data,
    staleTime: Infinity,
  })
}

export function useBuscaFiltroQuery(campo, termo) {
  const termoNormalizado = termo?.trim() || ''

  return useQuery({
    queryKey: ['mapa', 'busca-filtro', campo, termoNormalizado],
    queryFn: async () => (
      await mapaApi.buscarFiltro(campo, termoNormalizado)
    ).data.data,
    enabled: Boolean(campo) && termoNormalizado.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}

// 2. Valores por UF
export function useValoresUfQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['mapa', 'valores-uf', filtros],
    queryFn: async () => (await mapaApi.getLocalidade(filtros)).data.data,
  })
}


// 3. Fases de Execução
export function useFasesQuery() {
  const { filtros } = useFiltros()
  return useQuery({
    queryKey: ['mapa', 'fases-execucao', filtros],
    queryFn: async () => (await mapaApi.getFaseSituacao(filtros)).data.data,
  })
}


