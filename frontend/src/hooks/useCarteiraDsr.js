import { useQuery } from '@tanstack/react-query'
import { carteiraDsrApi } from '@/api/carteiraDsr'
import { useFiltros } from '@/context/filtrosContext'

export function useKpis() {                 //hook para buscar os kpis
    const { filtros } = useFiltros()

    return useQuery({
        queryKey: ['carteira-dsr', 'kpis', filtros],

        queryFn: async () => {
            const response = await carteiraDsrApi.getKpis(filtros)
            return response.data
        },
    })
}

export function useOpcoesFiltros() {
    return useQuery({
        queryKey: ['carteira-dsr', 'opcoes-filtros'],
        queryFn: async () => {
            const response = await carteiraDsrApi.getFiltros()
            return response.data
        },
        staleTime: Infinity,
    })
}

export function useValoresPorAcao() {
    const { filtros } = useFiltros()

    return useQuery({
        queryKey: ['carteira-dsr', 'graficos-acoes', filtros],

        queryFn: async () => {
        const response = await carteiraDsrApi.getAcoesValores(filtros)
        return response.data.data 
        },
    })
}

export function useFasesESituacao () {
    const { filtros } = useFiltros()

    return useQuery({
        queryKey: ['carteira-dsr', 'graficos-fases', filtros],

        queryFn: async () => {
            const [fasesRes, situacaoRes] = await Promise.all([
                carteiraDsrApi.getFaseSituacao(filtros),
                carteiraDsrApi.getSituacaoCont(filtros)
            ])

            return {
                fases: fasesRes.data.data,
                situacoes: situacaoRes.data.data
            }
        },
    })
}

export function useGeografia() {
    const { filtros } = useFiltros()

    return useQuery({
    queryKey: ['carteira-dsr', 'geografia', filtros],
    queryFn: async () => {
      const [ufRes, coroplRes, pontosRes] = await Promise.all([
        carteiraDsrApi.getLocalidade(filtros),
        carteiraDsrApi.getMapaCoropl(filtros),
        carteiraDsrApi.getMapaPontos(filtros)
      ])
      return {
        valoresUf: ufRes.data.data,
        coropletico: coroplRes.data.data,
        pontos: pontosRes.data.data
      }
    },
  })
}

export function useAcoesETipos() {
  const { filtros } = useFiltros()

  return useQuery({
    queryKey: ['carteira-dsr', 'acoes-tipos', filtros],
    queryFn: async () => {
      const [acoesValRes, acoesQtdRes, tiposRes] = await Promise.all([
        carteiraDsrApi.getAcoesValores(filtros),
        carteiraDsrApi.getAcoesQtde(filtros),
        carteiraDsrApi.getTipoInstr(filtros)
      ])
      return {
        acoesValores: acoesValRes.data.data,
        acoesQtde: acoesQtdRes.data.data,
        tipos: tiposRes.data.data
      }
    },
  })
}

export function useExecucao() {
  const { filtros } = useFiltros()

  return useQuery({
    queryKey: ['carteira-dsr', 'execucao', filtros],
    queryFn: async () => {
      const [fasesRes, situacaoRes] = await Promise.all([
        carteiraDsrApi.getFasesSituacao(filtros),
        carteiraDsrApi.getSituacaoCont(filtros)
      ])
      return {
        fases: fasesRes.data.data,
        situacoes: situacaoRes.data.data
      }
    },
  })
}