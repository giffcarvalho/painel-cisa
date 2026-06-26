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
  getTabelaExportacao: (filtros) => {
    const params = toParams(filtros)
    params.append('exportacao', 'true')

    return api.get('/carteira-dsr/tabela', { params })
  },
  buscarFiltro: (campo, q, limit = 50) =>
    api.get('/carteira-dsr/filtros/busca', {
      params: { campo, q, limit },
    }),
}