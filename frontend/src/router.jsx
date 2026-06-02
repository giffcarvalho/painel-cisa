import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import Home from '@/pages/home/Home'
import CarteiraDsr from '@/pages/carteira-dsr/CarteiraDsr'
import ManualLayout from './pages/manual/ManualLayout'
import ManualHome from './pages/manual/ManualHome'
import ManualCarteiraDsr from './pages/manual/ManualCarteiraDsr'
import ManualMapaInterativo from './pages/manual/ManualMapaInterativo'
import ManualInformacoesGerais from './pages/manual/ManualInformacoesGerais'
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
        element: <ManualLayout />,
        children: [
          {
            index: true,
            element: <ManualHome />,
          },
          {
            path: 'carteira-dsr',
            element: <ManualCarteiraDsr />,
          },
          {
            path: 'mapa-interativo',
            element: <ManualMapaInterativo />,
          },
          {
            path: 'informacoes-gerais',
            element: <ManualInformacoesGerais />,
          },
        ],
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
