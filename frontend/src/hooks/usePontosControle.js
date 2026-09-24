import { keepPreviousData, useQuery } from '@tanstack/react-query';
import pontosControleApi from '../api/pontosControle';


//Esta função retira do objeto "filtros" os filtros que não tem valor, ou seja, que não tem valor filtrado
//Isso é necessário, senão a url da requisição teria um monte de params sem valor
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
    queryKey: [
      'pontos-controle',
      'filtros',
      'busca',
      campo,
      termoNormalizado,
      limit
    ],
    queryFn: () => 
      pontosControleApi.buscarFiltro(
        campo,
        termoNormalizado,
        limit
      ),
    enabled: Boolean(campo) && termoNormalizado.length >= 2,
    staleTime: 60 * 1000,
  });
}


//hook que chama a função que faz o get na rota get Instrumento.
//useQuery é o mecanismo do React Query que gerencia consulta ao backend
//ele traz propriedade como isLoading, isError
//queryKey é como se fosse uma identificação da consulta. Se cada um desses parametros mudar, é uma nova consulta. Os nomes 'pontos-controle' e 'instrumentos' são apenas para a pessoa que está lendo o código distinguir do que se trata a consulta
//queryFn é onde se coloca a função que de fato faz o get
//placeholderData: keepPreviousData diz ao React Query que enquanto uma consulta está sendo buscada, os dados da consulta anterior devem permanecer disponíveis
export function useInstrumentosPontosControleQuery(filtros = {}, pagina = 1, tamanhoPagina = 50) {
  
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



export function useDadosAdicionaisPontosControleQuery() {

  return useQuery({
    queryKey: [
      'pontos-controle',
      'dados_adicionais',
    ],
    queryFn: () =>
      pontosControleApi.getDadosAdicionais(),
    placeholderData: keepPreviousData,
  });
}