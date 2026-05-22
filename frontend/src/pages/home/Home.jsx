import { Link } from 'react-router-dom'
import { LayoutDashboard, FileWarning, CheckSquare, Map } from 'lucide-react'
import styles from './Home.module.css'

export default function Home() {
  return(
    <div className={styles.container}>
       {/* Cabeçalho */}
       <div className={styles.header}>
        <h1 className={styles.title}>
          Departamento de Saneamento Rural e de Pequenos Municípios
        </h1>
        <p className={styles.subtitle}>Selecione um módulo para acessar os painéis</p>
       </div>

       {/* Grid de Cards */}
       <div className={styles.grid}>

          {/* Card 1: Carteira DSR - ATIVO */}
          <Link 
            to="/carteira-dsr"
            className={styles.cardActive}>
              <div className={styles.iconWrapperActive}>
                <LayoutDashboard className={styles.iconActive} />
              </div>
              <h2 className={styles.cardTitleActive}>Carteira DSR</h2>
          </Link>

          {/* Card 2: Suspensiva (Placeholder) */}
          <div className={styles.cardDisabled}>
            <div className={styles.iconWrapperDisabled}>
              <FileWarning className={styles.iconDisabled} />
            </div>
            <h2 className={styles.cardTitleDisabled}>Suspensiva</h2>
            <span className={styles.badgeDisabled}>Em breve</span>
          </div>

          {/* Card 3: Seleção PAC (Placeholder) */}
          <div className={styles.cardDisabled}>
            <div className={styles.iconWrapperDisabled}>
              <CheckSquare className={styles.iconDisabled} />
            </div>
            <h2 className={styles.cardTitleDisabled}>Seleção PAC</h2>
            <span className={styles.badgeDisabled}>Em breve</span>
          </div>

          {/* Card 4: Mapa Interativo - ATIVO */}
          <Link 
            to="/mapa"
            className={styles.cardActive}>
              <div className={styles.iconWrapperActive}>
                <Map className={styles.iconActive} />
              </div>
              <h2 className={styles.cardTitleActive}>Mapa Interativo</h2>
          </Link>
        
       </div>
    </div>
  )
}