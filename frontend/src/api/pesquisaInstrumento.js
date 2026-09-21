import api from './axios';

const CAMPOS_FILTRO = [
  'nome_proponente',
  'municipios_beneficiados',
  'nr_instrumento',
  'nr_proposta',
  'operacao',
];

// A API aceita múltiplos valores para o mesmo campo como parâmetros repetidos;
// esta função também mantém compatibilidade com filtros ainda escalares.
const appendFiltroParam = (params, key, value) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  values
    .filter((item) => item !== null && item !== undefined && String(item).trim() !== '')
    .forEach((item) => {
      params.append(key, String(item).trim());
    });
};

const buildFiltrosParams = (filtros = {}) => {
  const params = new URLSearchParams();

  CAMPOS_FILTRO.forEach((campo) => {
    appendFiltroParam(params, campo, filtros[campo]);
  });

  return params;
};

// Paginação é adicionada apenas à consulta de resultados; o endpoint de opções
// recebe exatamente o mesmo conjunto normalizado de filtros encadeados.
const buildInstrumentosParams = (filtros = {}, pagina = 1, tamanhoPagina = 50) => {
  const params = buildFiltrosParams(filtros);

  params.append('pagina', pagina);
  params.append('tamanho_pagina', tamanhoPagina);

  return params;
};

export const getFiltros = async (filtros = {}) => {
  const { data } = await api.get('/pesquisa-instrumento/filtros', {
    params: buildFiltrosParams(filtros),
  });

  return data;
};

export const buscarFiltro = async (campo, q, limit = 50) => {
  const { data } = await api.get('/pesquisa-instrumento/filtros/busca', {
    params: {
      campo,
      q,
      limit,
    },
  });

  return data;
};

export const getInstrumentos = async (filtros = {}, pagina = 1, tamanhoPagina = 50) => {
  const params = buildInstrumentosParams(filtros, pagina, tamanhoPagina);
  const { data } = await api.get('/pesquisa-instrumento/instrumentos', {
    params,
  });

  return data;
};

export const getInstrumentoDetalhe = async (nrInstrumento) => {
  const { data } = await api.get(
    `/pesquisa-instrumento/instrumentos/${encodeURIComponent(nrInstrumento)}`
  );

  return data;
};

const pesquisaInstrumentoApi = {
  getFiltros,
  buscarFiltro,
  getInstrumentos,
  getInstrumentoDetalhe,
};

export default pesquisaInstrumentoApi;
