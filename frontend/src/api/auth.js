import api from './axios'

export const authApi = {
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload)
    return data
  },

  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },

  validarPrimeiroAcesso: async (codigoPrimeiroAcesso) => {
    const { data } = await api.post('/auth/primeiro-acesso/validar', {
      codigo_primeiro_acesso: codigoPrimeiroAcesso,
    })
    return data
  },

  definirSenhaPrimeiroAcesso: async (payload) => {
    const { data } = await api.post('/auth/primeiro-acesso/definir-senha', payload)
    return data
  },

  validarCodigoRedefinicao: async (codigoAcesso) => {
    const { data } = await api.post('/auth/redefinicao-senha/validar', {
      codigo_acesso: codigoAcesso,
    })
    return data
  },

  definirSenhaRedefinicao: async (payload) => {
    const { data } = await api.post('/auth/redefinicao-senha/definir-senha', payload)
    return data
  },
}
