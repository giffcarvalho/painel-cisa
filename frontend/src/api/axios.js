import axios from 'axios'
import { identificarErro } from './erros'
import {
  clearAuthSession,
  getAuthToken,
  notifyAuthLogout,
  requestAuthLogin,
} from '@/context/auth/authStorage'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Impede que uma configuração local insegura provoque conteúdo misto quando o
// frontend estiver sendo servido por HTTPS.
if (window.location.protocol === 'https:' && API_BASE_URL.startsWith('http://')) {
  throw new Error('VITE_API_URL insegura em produção HTTPS. Use /api/v1 ou uma URL https://.')
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Centraliza a expiração da sessão: qualquer 401 fora do login limpa as
// credenciais e solicita o modal preservando a rota que deverá ser retomada.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    await identificarErro(error)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearAuthSession()
      notifyAuthLogout()

      const currentPath = `${window.location.pathname}${window.location.search}`

      requestAuthLogin(currentPath)
    }

    if (error.code === 'ECONNABORTED') {
      console.error('[API] Timeout: a consulta demorou mais de 30s')
      // toast.warning("A consulta demorou muito. Tente refinar seus filtros.")
    }
    
    return Promise.reject(error)
  }
)

export default api
