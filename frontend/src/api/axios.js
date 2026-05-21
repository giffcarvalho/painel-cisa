import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  /*paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams();
      for (const key of Object.keys(params)) {
        const value = params[key];
        if (Array.isArray(value)) {
          value.forEach((val) => searchParams.append(key, val));
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      }
      return searchParams.toString();
    },
  },*/
})

// Interceptor de resposta: trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
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