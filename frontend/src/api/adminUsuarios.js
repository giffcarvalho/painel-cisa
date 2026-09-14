import api from './axios'

export const adminUsuariosApi = {
  listar: async (params = {}) => (await api.get('/admin/usuarios', { params })).data,
  detalhe: async (id) => (await api.get(`/admin/usuarios/${id}`)).data,
  alterarStatus: async (id, ativo) => api.patch(`/admin/usuarios/${id}/status`, { ativo }),
  gerarCodigo: async (id) => (await api.post(`/admin/usuarios/${id}/codigo-acesso`)).data,
  buscarInstrumentos: async (q) => (await api.get('/admin/instrumentos/busca', { params: { q } })).data,
  vincularInstrumento: async (id, nr_instrumento) => (await api.post(`/admin/usuarios/${id}/instrumentos`, { nr_instrumento })).data,
  alterarVinculo: async (id, nr, ativo) => (await api.patch(`/admin/usuarios/${id}/instrumentos/${encodeURIComponent(nr)}`, { ativo })).data,
}
