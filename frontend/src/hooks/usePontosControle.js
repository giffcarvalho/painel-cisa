import { keepPreviousData, useQuery } from '@tanstack/react-query';
import pontosControleApi from '../api/pontosControle';

const normalizarFiltros = (filtros = {}) =>
  Object.fromEntries(
    Object.entries(filtros).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return String(value ?? '').trim() !== '';
    })
  );

export function useOpcoesPontosControleQuery(filtros = {}) {
  const filtrosNormalizados = normalizarFiltros(filtros);

  return useQuery({
    queryKey: ['pontos-controle', 'filtros', filtrosNormalizados],
    queryFn: () => pontosControleApi.getFiltros(filtrosNormalizados),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuscaFiltroPontosControleQuery(campo, termo, limit = 50) {
  const termoNormalizado = termo?.trim() ?? '';

  return useQuery({
    queryKey: ['pontos-controle', 'filtros', 'busca', campo, termoNormalizado, limit],
    queryFn: () => pontosControleApi.buscarFiltro(campo, termoNormalizado, limit),
    enabled: Boolean(campo) && termoNormalizado.length >= 2,
    staleTime: 60 * 1000,
  });
}

export function useInstrumentosPontosControleQuery(
  filtros = {},
  pagina = 1,
  tamanhoPagina = 50
) {
  const filtrosNormalizados = normalizarFiltros(filtros);

  return useQuery({
    queryKey: [
      'pontos-controle',
      'instrumentos',
      filtrosNormalizados,
      pagina,
      tamanhoPagina,
    ],
    queryFn: () =>
      pontosControleApi.getInstrumentos(
        filtrosNormalizados,
        pagina,
        tamanhoPagina
      ),
    placeholderData: keepPreviousData,
  });
}
