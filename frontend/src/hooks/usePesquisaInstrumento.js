import { keepPreviousData, useQuery } from '@tanstack/react-query';
import pesquisaInstrumentoApi from '../api/pesquisaInstrumento';

// Mantém a chave de cache e a requisição livres de campos sem valor; isso evita
// caches distintos para consultas que são semanticamente equivalentes.
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
    // Evita buscas remotas amplas enquanto o usuário ainda está digitando.
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
    // Conserva a página anterior durante a troca para evitar que a tabela
    // desapareça enquanto a próxima página é carregada.
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
