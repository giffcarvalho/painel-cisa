import { useState } from "react"
import { useFiltros } from '@/context/useFiltros'
import KpisSection from '@/components/carteira-dsr/KpisSection'
import GraficosSection from '@/components/carteira-dsr/GraficosSection'
import TabelaSection from '@/components/carteira-dsr/TabelaSection'
import FiltrosDrawer from "@/components/carteira-dsr/FiltrosDrawer"

export default function CarteiraDsr() {
  const [mostrarTabela, setMostrarTabela] = useState(false)
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  const { qtdeFiltrosAtivos } = useFiltros()

  return (
    <div className="relative flex flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Carteira DSR</h1>
          <p className="text-gray-500">Visão consolidada dos instrumentos de repasse</p>
        </div>
        
        {/* O botão altera o estado local */}
        <button 
          onClick={() => setIsDrawerOpen(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded shadow-sm hover:bg-gray-50"
        >
          Filtrar Dados
          {qtdeFiltrosAtivos > 0 && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {qtdeFiltrosAtivos}
            </span>
          )}
        </button>
      </div>

      <KpisSection />
      <GraficosSection />

      <div className="flex flex-col gap-4 border-t pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Detalhamento dos Instrumentos</h2>
          <button 
            onClick={() => setMostrarTabela(!mostrarTabela)} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {mostrarTabela ? 'Ocultar Tabela' : 'Carregar Dados Detalhados'}
          </button>
        </div>
        {mostrarTabela && <TabelaSection />}
      </div>
      
      {isDrawerOpen && (
        <FiltrosDrawer onClose={() => setIsDrawerOpen(false)} />
      )}
    </div>
  )
}
