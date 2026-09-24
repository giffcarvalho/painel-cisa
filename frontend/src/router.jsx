import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import RotaProtegida from '@/components/auth/RotaProtegida'
import LayoutModalAcesso from '@/components/auth/LayoutModalAcesso'
import Home from '@/pages/home/Home'
import CarteiraDsr from '@/pages/carteira-dsr/CarteiraDsr'
import ManualLayout from './pages/manual/ManualLayout'
import ManualHome from './pages/manual/ManualHome'
import ManualCarteiraDsr from './pages/manual/ManualCarteiraDsr'
import ManualMapaInterativo from './pages/manual/ManualMapaInterativo'
import ManualInformacoesGerais from './pages/manual/ManualInformacoesGerais'
import MapLayout from './components/layout/MapLayout'
import PesquisaInstrumento from './pages/pesquisa-instrumento/PesquisaInstrumento'
import ConsultaPersonalizada from './pages/consulta-personalizada/ConsultaPersonalizada'
import RevisaoInstrumento from './pages/revisao-instrumento/RevisaoInstrumento'
import HistoricoRevisoes from './pages/revisao-instrumento/HistoricoRevisoes'
import VisualizarRevisao from './pages/revisao-instrumento/VisualizarRevisao'
import AplicacaoRevisoes from './pages/admin/aplicacao-revisoes/AplicacaoRevisoes'
import AdminUsuarios from './pages/admin/usuarios/AdminUsuarios'
import Login from './pages/login/Login'
import MeuPainel from './pages/meu-painel/MeuPainel'

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
    element: <LayoutModalAcesso />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        element: <AppLayout />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'carteira-dsr', element: <CarteiraDsr /> },
          { path: 'pesquisa-instrumento', element: <PesquisaInstrumento /> },
          { path: 'consulta-personalizada', element: <ConsultaPersonalizada /> },
          {
            path: 'revisao-instrumento',
            element: (
              <RotaProtegida>
                <RevisaoInstrumento />
              </RotaProtegida>
            ),
          },
          {
            path: 'revisao-instrumento/:numeroInstrumento',
            element: (
              <RotaProtegida>
                <RevisaoInstrumento />
              </RotaProtegida>
            ),
          },
          {
            path: 'minhas-revisoes',
            element: (
              <RotaProtegida>
                <MeuPainel />
              </RotaProtegida>
            ),
          },
          {
            path: 'meu-painel',
            element: (
              <RotaProtegida>
                <MeuPainel />
              </RotaProtegida>
            ),
          },
          {
            path: 'revisao-instrumento/:numeroInstrumento/revisoes',
            element: (
              <RotaProtegida>
                <HistoricoRevisoes escopo="instrumento" />
              </RotaProtegida>
            ),
          },
          {
            path: 'revisao-instrumento/:numeroInstrumento/revisoes/:idRevisao',
            element: (
              <RotaProtegida>
                <VisualizarRevisao />
              </RotaProtegida>
            ),
          },
          {
            path: 'admin',
            element: (
              <RotaProtegida requiredProfile="admin">
                <AdminUsuarios />
              </RotaProtegida>
            ),
          },
          {
            path: 'admin/aplicacao-revisoes',
            element: (
              <RotaProtegida requiredProfile="admin">
                <AplicacaoRevisoes />
              </RotaProtegida>
            ),
          },
          {
            path: 'manual',
            element: <ManualLayout />,
            children: [
              { index: true, element: <ManualHome /> },
              { path: 'carteira-dsr', element: <ManualCarteiraDsr /> },
              { path: 'mapa-interativo', element: <ManualMapaInterativo /> },
              { path: 'informacoes-gerais', element: <ManualInformacoesGerais /> },
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
    ],
  },
])
