import { Link } from 'react-router-dom'
import { LayoutDashboard, FileWarning, CheckSquare, Map } from 'lucide-react'
import styles from './Home.module.css'

export default function Home() {
  return(
    <div className={styles.container}>
       {/* Cabeçalho Alinhado à Esquerda */}
       <div className={styles.header}>
        <span className={styles.eyebrow}>Visão Geral</span>
        <h1 className={styles.title}>
          Departamento de Saneamento Rural e de Pequenos Municípios
        </h1>
        <p className={styles.subtitle}>Selecione um módulo para explorar os painéis analíticos.</p>
       </div>

       {/* Grid Bento / Horizontal */}
       <div className={styles.grid}>

          {/* Card 1: Carteira DSR - ATIVO */}
          <Link to="/carteira-dsr" className={styles.cardActive}>
              <div className={styles.iconWrapperActive}>
                <LayoutDashboard className={styles.iconActive} />
              </div>
              <div>
                <h2 className={styles.cardTitleActive}>Carteira DSR</h2>
                <p className={styles.cardDescription}>Visão consolidada e financeira dos instrumentos de repasse.</p>
              </div>
          </Link>

          {/* Card 2: Mapa Interativo - ATIVO */}
          <Link to="/mapa" className={styles.cardActive}>
              <div className={styles.iconWrapperActive}>
                <Map className={styles.iconActive} />
              </div>
              <div>
                <h2 className={styles.cardTitleActive}>Mapa Interativo</h2>
                <p className={styles.cardDescription}>Exploração geoespacial de investimentos e municípios.</p>
              </div>
          </Link>

          {/* Card 3: Suspensiva (Em Breve) */}
          <div className={styles.cardDisabled}>
            <div className={styles.iconWrapperDisabled}>
              <FileWarning className={styles.iconDisabled} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className={styles.cardTitleDisabled}>Suspensiva</h2>
                <span className={styles.badgeDisabled}>Em breve</span>
              </div>
              <p className={styles.cardDescriptionDisabled}>Acompanhamento de restrições e paralisações.</p>
            </div>
          </div>

          {/* Card 4: Seleção PAC (Em Breve) */}
          <div className={styles.cardDisabled}>
            <div className={styles.iconWrapperDisabled}>
              <CheckSquare className={styles.iconDisabled} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className={styles.cardTitleDisabled}>Seleção PAC</h2>
                <span className={styles.badgeDisabled}>Em breve</span>
              </div>
              <p className={styles.cardDescriptionDisabled}>Gestão de propostas e seleções do Novo PAC.</p>
            </div>
          </div>        
       </div>
    </div>
  )
}