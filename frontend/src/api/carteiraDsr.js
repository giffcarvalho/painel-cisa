import api from './axios'

function toParams(filtros) {
  const params = new URLSearchParams()

  Object.entries(filtros || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v))
      } else {
        params.append(key, value)
      }
    }
  })

  return params
}

export const carteiraDsrApi = {
  getKpis:          (filtros) => api.get('/carteira-dsr/kpis', { params: toParams(filtros) }),
  getFiltros:       ()        => api.get('/carteira-dsr/filtros'),
  getLocalidade:    (filtros) => api.get('/carteira-dsr/graficos/localidade', { params: toParams(filtros) }),
  getAcoesValores:  (filtros) => api.get('/carteira-dsr/graficos/acoes', { params: toParams(filtros) }),
  getAcoesQtde:     (filtros) => api.get('/carteira-dsr/graficos/acoes-qtde', { params: toParams(filtros) }),
  getTipoInstr:     (filtros) => api.get('/carteira-dsr/graficos/tipo-instrumento', { params: toParams(filtros) }),
  getFaseSituacao:  (filtros) => api.get('/carteira-dsr/graficos/fase-situacao', { params: toParams(filtros) }),
  getSituacaoCont:  (filtros) => api.get('/carteira-dsr/graficos/situacao-contratacao', { params: toParams(filtros) }),
  getMapaCoropl:    (filtros) => api.get('/carteira-dsr/graficos/mapa-coropletico', { params: toParams(filtros) }),
  getMapaPontos:    (filtros) => api.get('/carteira-dsr/mapa-pontos', { params: toParams(filtros) }),
  getTabela: (filtros, pagina = 1, tamanho = 100) => {
    const params = toParams(filtros)
    params.append('pagina', pagina)
    params.append('tamanho_pagina', tamanho)
    
    return api.get('/carteira-dsr/tabela', { params })
  },
}