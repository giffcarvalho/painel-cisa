import { useMutation, useQuery } from '@tanstack/react-query'
import { extratorDadosApi } from '@/api/extratorDados'

export function useTipoTabelaExtrator() {
  return useQuery({
    queryKey: ['extrator-dados', 'tipos-tabela'],
    queryFn: extratorDadosApi.getTiposTabela,
    staleTime: 60 * 60 * 1000,
  })
}

export function useCatalogoExtrator(tipoTabela) {
  return useQuery({
    queryKey: ['extrator-dados', 'catalogo', tipoTabela],
    queryFn: () => extratorDadosApi.getCatalogo(tipoTabela),
    enabled: Boolean(tipoTabela),
    staleTime: 60 * 60 * 1000,
  })
}

export function useFiltrosExtrator(tipoTabela) {
  return useQuery({
    queryKey: ['extrator-dados', 'filtros', tipoTabela],
    queryFn: () => extratorDadosApi.getFiltros(tipoTabela),
    enabled: Boolean(tipoTabela),
    staleTime: 30 * 60 * 1000,
  })
}

export function useBuscaFiltroExtrator(tipoTabela, campo, termo, enabled = true) {
  const q = termo?.trim() ?? ''

  return useQuery({
    queryKey: ['extrator-dados', 'filtros', 'busca', tipoTabela, campo, q],
    queryFn: () => extratorDadosApi.buscarFiltro({ tipoTabela, campo, q }),
    enabled: Boolean(enabled && tipoTabela && campo && q.length >= 2),
    staleTime: 60 * 1000,
  })
}

export function usePreviaExtrator() {
  return useMutation({
    mutationFn: extratorDadosApi.gerarPrevia,
  })
}

export function useExportarExcelExtrator() {
  return useMutation({
    mutationFn: extratorDadosApi.exportarExcel,
  })
}