import api from './axios'

const limparFiltros = (filtros = {}) =>
  Object.fromEntries(
    Object.entries(filtros).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined && String(value).trim() !== ''
    })
  )

const normalizarErroBlob = async (error) => {
  const blob = error?.response?.data

  if (blob instanceof Blob) {
    const text = await blob.text()

    try {
      const json = JSON.parse(text)
      throw new Error(json?.detail || 'Não foi possível exportar o Excel.')
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        throw new Error(text || 'Não foi possível exportar o Excel.')
      }

      throw parseError
    }
  }

  throw error
}

export const extratorDadosApi = {
  getTiposTabela: async () => {
    const { data } = await api.get('/extrator-dados/tipos-tabela')
    return data
  },

  getCatalogo: async (tipoTabela) => {
  const { data } = await api.get('/extrator-dados/catalogo', {
    params: { tipo_tabela: tipoTabela },
    headers: { 'Cache-Control': 'no-cache' },
  })
  return data
  },

  getFiltros: async (tipoTabela) => {
    const { data } = await api.get('/extrator-dados/filtros', {
      params: { tipo_tabela: tipoTabela },
      headers: { 'Cache-Control': 'no-cache' },
    })
    return data
  },

  buscarFiltro: async ({ tipoTabela, campo, q, limit = 50 }) => {
    const { data } = await api.get('/extrator-dados/filtros/busca', {
      params: {
        tipo_tabela: tipoTabela,
        campo,
        q,
        limit,
      },
    })
    return data
  },

  gerarPrevia: async (payload) => {
    const { data } = await api.post('/extrator-dados/previa', {
      ...payload,
      filtros: limparFiltros(payload.filtros),
    })
    return data
  },

  exportarExcel: async (payload) => {
    try {
      return await api.post(
        '/extrator-dados/exportar/excel',
        {
          ...payload,
          filtros: limparFiltros(payload.filtros),
        },
        { responseType: 'blob' }
      )
    } catch (error) {
      await normalizarErroBlob(error)
    }
  },
}