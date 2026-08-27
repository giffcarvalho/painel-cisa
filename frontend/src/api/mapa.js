import api from './axios'

function toParams(filtros) {
  const params = new URLSearchParams()

  Object.entries(filtros || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value
        .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
        .forEach((v) => params.append(key, String(v).trim()))
    } else {
      params.append(key, String(value).trim())
    }
  })

  return params
}



export async function listarUfs(filtros = {}) {

  const res = await api.get("/mapa/filtros/ufs", {params: toParams(filtros)});
  
  return res.data.data;
}


export async function listarMunicipios(q="", cod_uf, limit = 100) {
  
  const params = { q, limit }
  const temUf = Array.isArray(cod_uf)? cod_uf.length > 0: cod_uf != null

  if (temUf) {
    params.cod_uf = Array.isArray(cod_uf)? cod_uf.join(","): cod_uf
  }
  
  const res = await api.get("/mapa/filtros/municipios", { params });
  
  return res.data.data;
}


export async function listarNrPropostas(q="", cod_uf, cod_municipio, nr_instrumento, cod_tci, modalidade, limit = 100) {
  
  const params = { q, limit }

  const temMunicipio = Array.isArray(cod_municipio)? cod_municipio.length > 0: cod_municipio != null && cod_municipio !== "";
  if (temMunicipio) {params.cod_municipio = cod_municipio;}

  const temUf = Array.isArray(cod_uf)? cod_uf.length > 0: cod_uf != null && cod_uf !== "";
  if (temUf) {params.cod_uf = cod_uf;}

  const temInstrumento = Array.isArray(nr_instrumento)? nr_instrumento.length > 0: nr_instrumento != null && nr_instrumento !== "";
  if (temInstrumento) {params.nr_instrumento = nr_instrumento;}

  const temTci = Array.isArray(cod_tci)? cod_tci.length > 0: cod_tci != null && cod_tci !== "";
  if (temTci) {params.cod_tci = cod_tci;}

  const temModalidade = Array.isArray(modalidade)? modalidade.length > 0: modalidade != null && modalidade !== "";
  if (temModalidade) {params.modalidade = modalidade;}

  const res = await api.get("/mapa/filtros/nr_propostas", { params });
  
  return res.data.data;
}


export async function listarNrInstrumentos(q="", cod_uf, cod_municipio, nr_proposta, cod_tci, modalidade, limit = 100) {
  
  const params = { q, limit }

  const temMunicipio = Array.isArray(cod_municipio)? cod_municipio.length > 0: cod_municipio != null && cod_municipio !== "";
  if (temMunicipio) {params.cod_municipio = cod_municipio;}

  const temUf = Array.isArray(cod_uf)? cod_uf.length > 0: cod_uf != null && cod_uf !== "";
  if (temUf) {params.cod_uf = cod_uf;}

  const temProposta = Array.isArray(nr_proposta)? nr_proposta.length > 0: nr_proposta != null && nr_proposta !== "";
  if (temProposta) {params.nr_proposta = nr_proposta;}

  const temTci = Array.isArray(cod_tci)? cod_tci.length > 0: cod_tci != null && cod_tci !== "";
  if (temTci) {params.cod_tci = cod_tci;}

  const temModalidade = Array.isArray(modalidade)? modalidade.length > 0: modalidade != null && modalidade !== "";
  if (temModalidade) {params.modalidade = modalidade;}

  const res = await api.get("/mapa/filtros/nr_instrumentos", { params });
  
  return res.data.data;
}


export async function listarCodTci(q="", cod_uf, cod_municipio, nr_instrumento, nr_proposta, modalidade, limit = 100) {
  
  const params = { q, limit }

  const temMunicipio = Array.isArray(cod_municipio)? cod_municipio.length > 0: cod_municipio != null && cod_municipio !== "";
  if (temMunicipio) {params.cod_municipio = cod_municipio;}

  const temUf = Array.isArray(cod_uf)? cod_uf.length > 0: cod_uf != null && cod_uf !== "";
  if (temUf) {params.cod_uf = cod_uf;}

  const temInstrumento = Array.isArray(nr_instrumento)? nr_instrumento.length > 0: nr_instrumento != null && nr_instrumento !== "";
  if (temInstrumento) {params.nr_instrumento = nr_instrumento;}
  
  const temProposta = Array.isArray(nr_proposta)? nr_proposta.length > 0: nr_proposta != null && nr_proposta !== "";
  if (temProposta) {params.nr_proposta = nr_proposta;}

  const temModalidade = Array.isArray(modalidade)? modalidade.length > 0: modalidade != null && modalidade !== "";
  if (temModalidade) {params.modalidade = modalidade;}

  const res = await api.get("/mapa/filtros/cod_tci", { params });
  
  return res.data.data;
}


export async function listarModalidade(q="", cod_uf, cod_municipio, nr_instrumento, nr_proposta, cod_tci, limit = 100) {
  
  const params = { q, limit }

  const temMunicipio = Array.isArray(cod_municipio)? cod_municipio.length > 0: cod_municipio != null && cod_municipio !== "";
  if (temMunicipio) {params.cod_municipio = cod_municipio;}

  const temUf = Array.isArray(cod_uf)? cod_uf.length > 0: cod_uf != null && cod_uf !== "";
  if (temUf) {params.cod_uf = cod_uf;}

  const temInstrumento = Array.isArray(nr_instrumento)? nr_instrumento.length > 0: nr_instrumento != null && nr_instrumento !== "";
  if (temInstrumento) {params.nr_instrumento = nr_instrumento;}
  
  const temProposta = Array.isArray(nr_proposta)? nr_proposta.length > 0: nr_proposta != null && nr_proposta !== "";
  if (temProposta) {params.nr_proposta = nr_proposta;}

  const temTci = Array.isArray(cod_tci)? cod_tci.length > 0: cod_tci != null && cod_tci !== "";
  if (temTci) {params.cod_tci = cod_tci;}

  const res = await api.get("/mapa/filtros/modalidade", { params });
  
  return res.data.data;
}



export async function listarLocalidades(q="", cod_uf, cod_municipio, limit = 50) {
  
  const params = { q, limit }

  const temMunicipio = Array.isArray(cod_municipio)? cod_municipio.length > 0: cod_municipio != null && cod_municipio !== "";
  if (temMunicipio) {params.cod_municipio = cod_municipio;}

  const temUf = Array.isArray(cod_uf)? cod_uf.length > 0: cod_uf != null && cod_uf !== "";
  if (temUf) {params.cod_uf = cod_uf;}

  const res = await api.get("/mapa/filtros/localidades", { params });
  
  return res.data.data;
}



export async function listarLocalidadeEnderecos(q="", cod_uf, cod_municipio, limit = 30) {
  
  const params = { q, limit }

  const temMunicipio = Array.isArray(cod_municipio)? cod_municipio.length > 0: cod_municipio != null && cod_municipio !== "";
  if (temMunicipio) {params.cod_municipio = cod_municipio;}

  const temUf = Array.isArray(cod_uf)? cod_uf.length > 0: cod_uf != null && cod_uf !== "";
  if (temUf) {params.cod_uf = cod_uf;}

  const res = await api.get("/mapa/filtros/localidade_enderecos", { params });
  
  return res.data.data;
}


export async function listarCategoriasMetropolitanas(q="", limit = 50) {
  
  const params = { q, limit }

  const res = await api.get("/mapa/filtros/categorias_metropolitanas", { params });
  
  return res.data.data;
}


export async function listarInvestimentoSaneamento(filtros = {}) {
  
  const res = await api.get("/mapa/investimento_saneamento", { params: toParams(filtros) });

  return res.data.data;
}


export async function listarDadosMunicipios(filtros = {}) {
  
  const res = await api.get("/mapa/dados_municipios", { params: toParams(filtros) });

  return res.data.data;
}


export async function listarDadosAnaliseCoordenadas(filtros = {}) {
  
  const res = await api.get("/mapa/dados_analise_coordenadas", { params: toParams(filtros) });

  return res.data.data;
}


export async function enviarAnaliseCoordenadas(payload) {
  
  const res = await api.post("/mapa/analise_coordenadas", payload);

  return res.data;
}


const API_URL = new URL(import.meta.env.VITE_API_URL ?? "/api/v1", window.location.origin).toString().replace(/\/$/, "");

export function urlBboxUfs(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/bbox_ufs?${params}`
}


export function urlBboxMunicipios(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/bbox_municipios?${params}`
}


export function urlBboxCarteiraDsr(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/bbox_carteira_dsr?${params}`
}


export function urlBboxLocalidades(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/bbox_localidades?${params}`
}


export function urlBboxEnderecos(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/bbox_enderecos?${params}`
}


export function urlBboxCategoriasMetropolitanas(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/bbox_categorias_metropolitanas?${params}`
}


export function urlUfs(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/ufs/{z}/{x}/{y}.pbf?${params}`
}


export function urlMunicipios2025(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/municipios_2025/{z}/{x}/{y}.pbf?${params}`
}


export function urlDistritos2022(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/distritos_2022/{z}/{x}/{y}.pbf?${params}`
}


export function urlSetoresCensitarios2022(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/setores_censitarios_2022/{z}/{x}/{y}.pbf?${params}`
}


export function urlLocalidades2022(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/localidades_2022/{z}/{x}/{y}.pbf?${params}`
}


export function urlEnderecos2022(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/enderecos_2022/{z}/{x}/{y}.pbf?${params}`
}


export function urlCidades(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/cidades/{z}/{x}/{y}.pbf?${params}`
}


export function urlMunicipios2022(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/municipios_2022/{z}/{x}/{y}.pbf?${params}`
}


export function urlBiomas(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/biomas/{z}/{x}/{y}.pbf?${params}`
}


export function urlGeometriasCarteiraDsr(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/geometrias_carteira_dsr/{z}/{x}/{y}.pbf?${params}`
}


export function urlGeometriasCarteiraDrf(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/geometrias_carteira_drf/{z}/{x}/{y}.pbf?${params}`
}