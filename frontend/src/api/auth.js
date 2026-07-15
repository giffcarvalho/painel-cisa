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
}
