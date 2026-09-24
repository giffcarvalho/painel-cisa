import api from './axios'

export const meuPainelApi = {
  buscar: async ({ rascunhosLimit = 5, rascunhosOffset = 0 } = {}) => {
    const { data } = await api.get('/meu-painel', {
      params: { rascunhos_limit: rascunhosLimit, rascunhos_offset: rascunhosOffset },
    })
    return data
  },
}
