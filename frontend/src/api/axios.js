import axios from 'axios'
import {
  clearAuthSession,
  getAuthToken,
  notifyAuthLogout,
  requestAuthLogin,
} from '@/context/auth/authStorage'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

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

// Interceptor de resposta: trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearAuthSession()
      notifyAuthLogout()

      const currentPath = `${window.location.pathname}${window.location.search}`

      requestAuthLogin(currentPath)
    }

    // Futuramente, substituir os console.error por toasts da UI (ex: sonner / useToast)
    if (error.response?.status === 500) {
      console.error('[API] Erro interno do servidor:', error.response.data?.detail)
      // toast.error("Erro interno ao consultar a base de dados.")
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Timeout: a consulta demorou mais de 30s')
      // toast.warning("A consulta demorou muito. Tente refinar seus filtros.")
    }
    
    return Promise.reject(error)
  }
)

export default api
