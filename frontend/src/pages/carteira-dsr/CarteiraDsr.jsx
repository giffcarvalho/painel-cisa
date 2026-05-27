import { useState } from "react"
import { useFiltros } from '@/context/useFiltros'
import { Database, Table } from 'lucide-react'
import KpisSection from '@/components/carteira-dsr/KpisSection'
import GraficosSection from '@/components/carteira-dsr/GraficosSection'
import TabelaSection from '@/components/carteira-dsr/TabelaSection'
import FiltrosDrawer from "@/components/carteira-dsr/FiltrosDrawer"
import styles from './CarteiraDsr.module.css'
import graficosStyles from '@/components/carteira-dsr/GraficosSection.module.css' // Reaproveitando o card

export default function CarteiraDsr() {
  const [mostrarTabela, setMostrarTabela] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { qtdeFiltrosAtivos } = useFiltros()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Carteira DSR</h1>
          <p className={styles.subtitle}>Visão consolidada dos instrumentos de repasse</p>
        </div>
        
        <button 
          onClick={() => setIsDrawerOpen(true)} 
          className={styles.filterButton}
        >
          Filtrar Dados
          {qtdeFiltrosAtivos > 0 && (
            <span className={styles.badge}>
              {qtdeFiltrosAtivos}
            </span>
          )}
        </button>
      </div>

      <KpisSection />
      <GraficosSection />

      <div className={graficosStyles.megaCard}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className={graficosStyles.sectionTitle} style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
              Detalhamento dos Instrumentos
            </h2>
            <p className="text-sm text-cisa-text-secondary mt-1">
              Relação detalhada de todos os instrumentos de repasse e seus indicadores.
            </p>
          </div>
          
          {mostrarTabela && (
            <button 
              onClick={() => setMostrarTabela(false)} 
              className="text-sm font-medium text-cisa-text-muted hover:text-cisa-text-primary transition-colors"
            >
              Ocultar Tabela
            </button>
          )}
        </div>

        {!mostrarTabela ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 transition-all">
            <Database className="w-10 h-10 text-gray-300 mb-4" />
            <h3 className="text-base font-medium text-gray-700 mb-1">Pronto para carregar</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
              Clique no botão abaixo para processar e exibir a tabela completa de instrumentos.
            </p>
            <button 
              onClick={() => setMostrarTabela(true)} 
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 shadow-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-cisa-primary hover:text-cisa-primary transition-all focus:ring-2 focus:ring-cisa-primary-light"
            >
              <Table className="w-4 h-4" />
              Exibir Tabela
            </button>
          </div>
        ) : (
          <TabelaSection />
        )}
      </div>
      
      {isDrawerOpen && (
        <FiltrosDrawer onClose={() => setIsDrawerOpen(false)} />
      )}
    </div>
  )
}
