import api from './axios'

export const meuPainelApi = {
  buscar: async () => {
    const { data } = await api.get('/meu-painel')
    return data
  },
}
