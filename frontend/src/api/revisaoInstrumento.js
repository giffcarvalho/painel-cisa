import api from './axios'

export const revisaoInstrumentoApi = {
  buscarInstrumento: async (identificador) => {
    const { data } = await api.get('/revisao-instrumento/instrumentos', {
      params: { identificador },
    })

    return data
  },

  salvarRevisao: async (payload) => {
    const { data } = await api.post('/revisao-instrumento/revisoes', payload)
    return data
  },
}