import api from './axios'

export const revisaoInstrumentoApi = {
  buscarMeusInstrumentos: async () => {
    const { data } = await api.get('/revisao-instrumento/meus-instrumentos')
    return data
  },

  buscarInstrumento: async (identificador) => {
    const { data } = await api.get('/revisao-instrumento/instrumentos', {
      params: { identificador },
    })

    return data
  },

  buscarRevisaoEnviada: async (identificador, idRevisao) => {
    const { data } = await api.get(
      `/revisao-instrumento/instrumentos/${encodeURIComponent(identificador)}/revisoes/${idRevisao}`,
    )
    return data
  },

  buscarMinhasRevisoes: async ({ busca, page = 1, limit = 20 } = {}) => {
    const { data } = await api.get('/revisao-instrumento/revisoes/minhas', {
      params: { busca: busca || undefined, page, limit },
    })
    return data
  },

  buscarHistoricoInstrumento: async (identificador, { page = 1, limit = 20 } = {}) => {
    const { data } = await api.get(
      `/revisao-instrumento/instrumentos/${encodeURIComponent(identificador)}/revisoes`,
      { params: { page, limit } },
    )
    return data
  },

  buscarMunicipiosOficiais: async (q) => {
    const { data } = await api.get('/revisao-instrumento/municipios-oficiais', {
      params: { q },
    })
    return Array.isArray(data) ? data : data.data ?? []
  },

  salvarRevisao: async (payload) => {
    const { data } = await api.post('/revisao-instrumento/revisoes', payload)
    return data
  },

  salvarMunicipio: async (payload) => {
    const { data } = await api.patch('/revisao-instrumento/revisoes/municipio', payload)
    return data
  },
}
