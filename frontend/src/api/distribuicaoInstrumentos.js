import api from './axios'

const base = '/admin/distribuicao-instrumentos'

export const distribuicaoApi = {
  configuracao: async (signal) => (await api.get(`${base}/configuracao`, { signal })).data,
  catalogo: async (signal) => (await api.get(`${base}/catalogo`, { signal })).data,
  consultar: async (payload, signal) =>
    (await api.post(`${base}/consulta`, payload, { signal })).data,
  opcoesContextuais: async (filtros, signal) =>
    (await api.post(`${base}/opcoes`, filtros, { signal })).data,
  previa: async (payload, signal) =>
    (await api.post(`${base}/previa`, payload, { signal })).data,
  aplicar: async (payload) => (await api.post(`${base}/aplicar`, payload)).data,
}
