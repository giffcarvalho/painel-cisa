import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import Home from '@/pages/Home'
import CarteiraDsr from '@/pages/carteira-dsr/CarteiraDsr'

// Lazy loading para o Mapa
const Mapa = lazy(() => import('@/pages/mapa/Mapa'))

function MapaLoading() {
  return (
    <div className="flex h-full w-full min-h-[400px] flex-col items-center justify-center gap-3 bg-cisa-bg animate-fade-in">
      <Loader2 className="h-8 w-8 animate-spin text-cisa-primary" />
      <span className="text-sm font-medium text-cisa-text-secondary tracking-tight">
        Carregando dados geoespaciais...
      </span>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',                 
    element: <Home />,           // 1. Rota da página inicial
  },
  {
    element: <AppLayout />,        // 2. Rota de Layout - Serve apenas para injetar o <AppLayout /> em todos os módulos listados no childrenn
    children: [
      {
        path: 'carteira-dsr',
        element: <CarteiraDsr />,   
      },
      {
        path: 'mapa',
        element: (
          <Suspense fallback={<MapaLoading />}>
            <Mapa />
          </Suspense>
        ),
      },
    ],
  },
])
