import { keepPreviousData, useQuery } from '@tanstack/react-query';
import pesquisaInstrumentoApi from '../api/pesquisaInstrumento';

const normalizarFiltros = (filtros = {}) =>
  Object.fromEntries(
    Object.entries(filtros).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return String(value ?? '').trim() !== '';
    })
  );

export function useOpcoesPesquisaInstrumentoQuery(filtros = {}) {
  const filtrosNormalizados = normalizarFiltros(filtros);

  return useQuery({
    queryKey: ['pesquisa-instrumento', 'filtros', filtrosNormalizados],
    queryFn: () => pesquisaInstrumentoApi.getFiltros(filtrosNormalizados),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuscaFiltroPesquisaInstrumentoQuery(campo, termo, limit = 50) {
  const termoNormalizado = termo?.trim() ?? '';

  return useQuery({
    queryKey: ['pesquisa-instrumento', 'filtros', 'busca', campo, termoNormalizado, limit],
    queryFn: () => pesquisaInstrumentoApi.buscarFiltro(campo, termoNormalizado, limit),
    enabled: Boolean(campo) && termoNormalizado.length >= 2,
    staleTime: 60 * 1000,
  });
}

export function useInstrumentosPesquisaInstrumentoQuery(
  filtros = {},
  pagina = 1,
  tamanhoPagina = 50
) {
  const filtrosNormalizados = normalizarFiltros(filtros);

  return useQuery({
    queryKey: [
      'pesquisa-instrumento',
      'instrumentos',
      filtrosNormalizados,
      pagina,
      tamanhoPagina,
    ],
    queryFn: () =>
      pesquisaInstrumentoApi.getInstrumentos(
        filtrosNormalizados,
        pagina,
        tamanhoPagina
      ),
    placeholderData: keepPreviousData,
  });
}

export function useInstrumentoDetalheQuery(nrInstrumento) {
  return useQuery({
    queryKey: ['pesquisa-instrumento', 'detalhe', nrInstrumento],
    queryFn: () => pesquisaInstrumentoApi.getInstrumentoDetalhe(nrInstrumento),
    enabled: Boolean(nrInstrumento),
  });
}
