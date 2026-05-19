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