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

  salvarRevisao: async (payload) => {
    const { data } = await api.post('/revisao-instrumento/revisoes', payload)
    return data
  },

  salvarMunicipio: async (payload) => {
    const { data } = await api.patch('/revisao-instrumento/revisoes/municipio', payload)
    return data
  },
}
