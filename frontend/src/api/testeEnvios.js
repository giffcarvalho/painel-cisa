import api from './axios'

export const testeEnviosApi = {
  listarEnvios: async () => {
    const { data } = await api.get('/teste-envios/envios')
    return data
  },

  criarEnvio: async (payload) => {
    const { data } = await api.post('/teste-envios/envios', payload)
    return data
  },
}