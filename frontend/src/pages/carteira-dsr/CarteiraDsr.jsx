import { useState } from "react"
import { useFiltros } from "@/context/carteira-Dsr/useFiltros"
import { Database, Table, SlidersHorizontal } from 'lucide-react'
import KpisSection from '@/components/carteira-dsr/KpisSection'
import GraficosSection from '@/components/carteira-dsr/GraficosSection'
import TabelaSection from '@/components/carteira-dsr/TabelaSection'
import FiltrosDrawer from "@/components/carteira-dsr/FiltrosDrawer"
import graficosStyles from '@/components/carteira-dsr/GraficosSection.module.css'
import styles from './CarteiraDsr.module.css'

export default function CarteiraDsr() {
  const [mostrarTabela, setMostrarTabela] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { filtros, qtdeFiltrosAtivos } = useFiltros()
  const tabelaKey = JSON.stringify(filtros)

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
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtrar Dados</span>
          {qtdeFiltrosAtivos > 0 && (
            <span className={styles.badge}>
              {qtdeFiltrosAtivos}
            </span>
          )}
        </button>
      </div>

      <KpisSection />
      <GraficosSection />

      <div className={`${graficosStyles.megaCard} ${styles.tableCard}`}>
        <div className={styles.detailsHeader}>
          <div>
            <h2 className={styles.detailsTitle}>
              Detalhamento dos Instrumentos
            </h2>
            <p className={styles.detailsSubtitle}>
              Relação detalhada de todos os instrumentos de repasse e seus indicadores.
            </p>
          </div>
          
          {mostrarTabela && (
            <button 
              onClick={() => setMostrarTabela(false)} 
              className={styles.toggleButton}
            >
              Ocultar Tabela
            </button>
          )}
        </div>

        {!mostrarTabela ? (
          <div className={styles.emptyState}>
            <Database className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Pronto para carregar</h3>
            <p className={styles.emptyText}>
              Clique no botão abaixo para processar e exibir a tabela completa de instrumentos.
            </p>
            <button 
              onClick={() => setMostrarTabela(true)} 
              className={styles.tableActionButton}
            >
              <Table className="w-4 h-4" />
              <span>Exibir Tabela</span>
            </button>
          </div>
        ) : (
          <TabelaSection key={tabelaKey} />
        )}
      </div>
      
      {isDrawerOpen && (
        <FiltrosDrawer onClose={() => setIsDrawerOpen(false)} />
      )}
    </div>
  )
}
