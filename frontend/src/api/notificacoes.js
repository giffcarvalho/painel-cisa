import api from './axios'

export const notificacoesApi = {
  listar: async ({ page = 1, limit = 20 } = {}) => {
    const { data } = await api.get('/notificacoes', { params: { page, limit } })
    return data
  },
  contarNaoLidas: async () => {
    const { data } = await api.get('/notificacoes/nao-lidas')
    return data
  },
  marcarLida: async (idNotificacao) => {
    const { data } = await api.patch(`/notificacoes/${idNotificacao}/lida`)
    return data
  },
  marcarTodasLidas: async () => {
    const { data } = await api.patch('/notificacoes/lidas/todas')
    return data
  },
}
