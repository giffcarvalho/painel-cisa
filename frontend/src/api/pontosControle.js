import api from './axios';

const CAMPOS_FILTRO = [
  'monitor',
  'municipios_beneficiados',
  'nr_instrumento',
  'uf',
  'acao',
];

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

const buildInstrumentosParams = (filtros = {}, pagina = 1, tamanhoPagina = 50) => {
  const params = buildFiltrosParams(filtros);

  params.append('pagina', pagina);
  params.append('tamanho_pagina', tamanhoPagina);

  return params;
};

export const getFiltros = async (filtros = {}) => {
  const { data } = await api.get('/pontos-controle/filtros', {
    params: buildFiltrosParams(filtros),
  });

  return data;
};

export const buscarFiltro = async (campo, q, limit = 50) => {
  const { data } = await api.get('/pontos-controle/filtros/busca', {
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
  const { data } = await api.get('/pontos-controle/instrumentos', {
    params,
  });

  return data;
};



const pontosControleApi = {
  getFiltros,
  buscarFiltro,
  getInstrumentos,
};

export default pontosControleApi;
