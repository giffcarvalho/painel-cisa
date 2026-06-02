import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { router } from './router'
import { FiltrosProvider } from './context/carteira-Dsr/filtrosContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        const status = error?.response?.status
        if(status === 400 || status === 401 || status === 403 || status === 404 || status === 422) return false
        if(status === 500) return false
        if(error?.code === 'ECONNABORTED') return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FiltrosProvider>
        <RouterProvider router={router} />
      </FiltrosProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </React.StrictMode>
)
