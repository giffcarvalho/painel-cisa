// import { useState } from "react"
// import KpisSection from '@/components/carteira-dsr/KpisSection'
// import GraficosSection from '@/components/carteira-dsr/GraficosSection'
// import TabelaSection from '@/components/carteira-dsr/TabelaSection'

// export default function CarteiraDsr() {
//   const [mostrarTabela, setMostrarTabela] = useState(false)

//   return (
//     <div className="flex flex-col gap-8 p-6">
//       {/*Título do Dashboard*/}
//       <div>
//         <h1 className="text-2xl font-bold text-gray-800">Carteira DSR</h1>
//         <p className="text-gray-500">Visão consolidada dos instrumentos de repasse</p>
//       </div>

//       {/*1ª camada: KPIs*/}
//       <KpisSection />
      
//       {/*2ª camada: Gráficos e Mapas*/}
//       <GraficosSection />

//       {/*3ª camada: tabela*/}
//       <div className="flex flex-col gap-4 border-t pt-8">
//         <div className="flex items-center justify-between">
//           <h2 className="text-xl font-semibold">Detalhamento dos Instrumentos</h2>

//           <button onClick={() => setMostrarTabela(!mostrarTabela)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
//             {mostrarTabela ? 'Ocultar Tabela' : 'Carregar Dados Detalhados'}
//           </button>
//         </div>
//         {mostrarTabela && <TabelaSection />}  {/*O componente tabelaSection só renderiza e chama a API se mostrarTabela = True */}
//       </div>
//     </div>
//   )
// }



export default function CarteiraDsr() { 
    return ( 
        <div>Em construção.</div>
    );
}