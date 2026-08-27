import api from './axios'

export const aplicacaoRevisoesApi = {
  listarPendentes: async () => {
    const { data } = await api.get('/aplicacao-revisoes/pendentes')
    return data
  },

  listarHistorico: async ({ page = 1, pageSize = 10, busca = '', status = '' } = {}) => {
    const { data } = await api.get('/aplicacao-revisoes/historico', {
      params: { page, page_size: pageSize, busca: busca || undefined, status: status || undefined },
    })
    return data
  },

  listarSolicitacoesCancelamento: async ({ page = 1, pageSize = 20, status = '' } = {}) => {
    const { data } = await api.get('/aplicacao-revisoes/solicitacoes-cancelamento', {
      params: { page, page_size: pageSize, status: status || undefined },
    })
    return data
  },

  aprovarSolicitacaoCancelamento: async (idSolicitacao, observacaoResposta = '') => {
    const { data } = await api.post(
      `/aplicacao-revisoes/solicitacoes-cancelamento/${idSolicitacao}/aprovar`,
      { observacao_resposta: observacaoResposta || null },
    )
    return data
  },

  rejeitarSolicitacaoCancelamento: async (idSolicitacao, observacaoResposta) => {
    const { data } = await api.post(
      `/aplicacao-revisoes/solicitacoes-cancelamento/${idSolicitacao}/rejeitar`,
      { observacao_resposta: observacaoResposta },
    )
    return data
  },

  obterExecucao: async (idExecucao) => {
    const { data } = await api.get(`/aplicacao-revisoes/execucoes/${idExecucao}`)
    return data
  },

  validarCancelamento: async (idExecucao) => {
    const { data } = await api.post(`/aplicacao-revisoes/execucoes/${idExecucao}/validar-cancelamento`)
    return data
  },

  cancelar: async (idExecucao, motivo) => {
    const { data } = await api.post(`/aplicacao-revisoes/execucoes/${idExecucao}/cancelar`, { motivo })
    return data
  },

  obterDetalhe: async (idRevisao) => {
    const { data } = await api.get(`/aplicacao-revisoes/${idRevisao}`)
    return data
  },

  validar: async (idRevisao) => {
    const { data } = await api.post(`/aplicacao-revisoes/${idRevisao}/validar`)
    return data
  },

  aplicar: async (idRevisao) => {
    const { data } = await api.post(`/aplicacao-revisoes/${idRevisao}/aplicar`)
    return data
  },
}
