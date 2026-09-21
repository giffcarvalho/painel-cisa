import api from './axios';

const CAMPOS_FILTRO = [
  'nr_instrumento',
  'proponente',
  'municipios_beneficiados',
  'uf',
  'carteira_ativa',
  'projeto_aprovado',
  'possui_aio',
  'coordenacao',
  'acao',
  'monitor',
  'prazo_clausulas_suspensivas',
  'prazo_emissao_lae',
  'prazo_inicio_licitacao',
  'prazo_conclusao_licitacao',
  'prazo_vrpl',
  'prazo_contratacao',
  'prazo_solicitacao_aio',
  'prazo_analise_tecnica_aio',
  'prazo_analise_executiva_aio',
  'prazo_registro_aio',
  'prazo_emissao_os',
  'prazo_inicio_execucao_fisica',
  'prazo_progresso_fisico',
  'prazo_indicio_paralisacao',
  'status_paralisacao_obra',
  'vistoria_in_loco_parciais',
  'prazo_vistoria_final',
  'obras_proximas_conclusao',
  'registro_conclusao',
  'vigencia',
  'status_de_execucao_da_obra',
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
