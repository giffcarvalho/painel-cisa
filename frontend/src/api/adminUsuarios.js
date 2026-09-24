import api from './axios'

export const adminUsuariosApi = {
  listar: async (params = {}) => (await api.get('/admin/usuarios', { params })).data,
  criar: async (payload) => (await api.post('/admin/usuarios', payload)).data,
  listarSetores: async () => (await api.get('/admin/setores')).data,
  detalhe: async (id) => (await api.get(`/admin/usuarios/${id}`)).data,
  instrumentosUsuario: async (id, params = {}) => (await api.get(`/admin/usuarios/${id}/instrumentos`, { params })).data,
  pendenciasUsuario: async (id, params = {}) => (await api.get(`/admin/usuarios/${id}/pendencias`, { params })).data,
  revisoesUsuario: async (id, params = {}) => (await api.get(`/admin/usuarios/${id}/revisoes`, { params })).data,
  rascunhosUsuario: async (id, params = {}) => (await api.get(`/admin/usuarios/${id}/rascunhos`, { params })).data,
  cancelarRascunho: async (id, idRevisao) => (await api.delete(`/admin/usuarios/${id}/rascunhos/${idRevisao}`)).data,
  detalharPendencias: async (id, instrumento) => (await api.get(`/admin/usuarios/${id}/pendencias/${encodeURIComponent(instrumento)}`)).data,
  alterarSetor: async (id, id_setor) => (await api.patch(`/admin/usuarios/${id}/setor`, { id_setor })).data,
  alterarStatus: async (id, ativo) => api.patch(`/admin/usuarios/${id}/status`, { ativo }),
  gerarCodigo: async (id) => (await api.post(`/admin/usuarios/${id}/codigo-acesso`)).data,
  buscarInstrumentos: async (q) => (await api.get('/admin/instrumentos/busca', { params: { q } })).data,
  vincularInstrumento: async (id, nr_instrumento) => (await api.post(`/admin/usuarios/${id}/instrumentos`, { nr_instrumento })).data,
  alterarVinculo: async (id, nr, ativo) => (await api.patch(`/admin/usuarios/${id}/instrumentos/${encodeURIComponent(nr)}`, { ativo })).data,
}
