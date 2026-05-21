import { Link } from 'react-router-dom'
import { LayoutDashboard, FileWarning, CheckSquare, Map } from 'lucide-react'

export default function Home() {
  return(
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-10 font-sans">
       {/* Cabeçalho */}
       <div className="text-center mb-16">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          Departamento de Saneamento Rural e de Pequenos Municípios
        </h1>
        <p className="text-gray-500 mt-2">Selecione um módulo para acessar os painéis</p>
       </div>

       {/* Grid de Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">

          {/* Card 1: Carteira DSR - ÚNICO ATIVO */}
          <Link 
            to="/carteira-dsr"
            className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer transform hover:-translate-y-1">
              <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors mb-4">
                <LayoutDashboard className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Carteira DSR</h2>
            </Link>

            {/* Card 2: Suspensiva (Placeholder) */}
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
          <div className="p-4 bg-gray-200 rounded-full mb-4">
            <FileWarning className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-600">Suspensiva</h2>
          <span className="text-xs text-gray-400 mt-1">Em breve</span>
        </div>

        {/* Card 3: Seleção PAC (Placeholder) */}
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
          <div className="p-4 bg-gray-200 rounded-full mb-4">
            <CheckSquare className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-600">Seleção PAC</h2>
          <span className="text-xs text-gray-400 mt-1">Em breve</span>
        </div>

        {/* Card 4: Informações Municipais / Mapa (Placeholder) */}
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
          <div className="p-4 bg-gray-200 rounded-full mb-4">
            <Map className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-600">Mapa Interativo</h2>
          <span className="text-xs text-gray-400 mt-1">Em breve</span>
        </div>
        
       </div>
    </div>
  )
}