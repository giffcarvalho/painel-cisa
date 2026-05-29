import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import Home from '@/pages/home/Home'
import CarteiraDsr from '@/pages/carteira-dsr/CarteiraDsr'
import Manual from './pages/manual/Manual'
import MapLayout from './components/layout/MapLayout'

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
    element: <Home />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: 'carteira-dsr',
        element: <CarteiraDsr />,
      },
      {
        path: 'manual',
        element: <Manual />,
      },
    ],
  },
  {
    element: <MapLayout />,
    children: [
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
