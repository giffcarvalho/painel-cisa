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


export async function listarMunicipios(q="", cod_uf, limit = 20) {
  
  const res = await api.get("/mapa/filtros/municipios", {params: { q, cod_uf, limit }});

  return res.data.data;
}


const API_URL = "http://localhost:8000/api/v1"

export function urlBboxUfs(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/bbox_ufs?${params}`
}


export function urlBboxMunicipios(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/bbox_municipios?${params}`
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


export function urlMunicipios2022(filtros={}) {
  const params = toParams(filtros);
  return `${API_URL}/mapa/municipios_2022/{z}/{x}/{y}.pbf?${params}`
}