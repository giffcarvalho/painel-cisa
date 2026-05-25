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

export const mapaApi = {
  getFiltros:       ()        => api.get('/mapa/filtros'),
  getLocalidade:    (filtros) => api.get('/mapa/graficos/localidade', { params: toParams(filtros) }),
  getFaseSituacao:  (filtros) => api.get('/mapa/graficos/fase-situacao', { params: toParams(filtros) }),
  buscarFiltro: (campo, q, limit = 50) => api.get('/mapa/filtros/busca', { params: { campo, q, limit }, }),
}