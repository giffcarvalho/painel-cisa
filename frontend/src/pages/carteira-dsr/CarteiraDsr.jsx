import { useState } from "react"
import { useFiltros } from '@/context/useFiltros'
import KpisSection from '@/components/carteira-dsr/KpisSection'
import GraficosSection from '@/components/carteira-dsr/GraficosSection'
import TabelaSection from '@/components/carteira-dsr/TabelaSection'
import FiltrosDrawer from "@/components/carteira-dsr/FiltrosDrawer"
import styles from './CarteiraDsr.module.css'

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

      <div className={styles.detailsSection}>
        <div className={styles.detailsHeader}>
          <h2 className={styles.detailsTitle}>Detalhamento dos Instrumentos</h2>
          <button 
            onClick={() => setMostrarTabela(!mostrarTabela)} 
            className={styles.toggleButton}
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

