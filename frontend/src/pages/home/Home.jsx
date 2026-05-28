import { Link } from 'react-router-dom'
import { Wallet, FileWarning, CheckSquare, Map, ArrowRight, Activity } from 'lucide-react'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#FAFAFA] px-6 py-12 lg:py-20 overflow-hidden font-sans">
      
      {/* O Background Mágico continua aqui */}
      <div className={styles.heroBackground} />

      {/* Container principal agora não centraliza tudo, ele alinha à esquerda */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto flex">
        
        {/* COLUNA ESQUERDA: Restringe a largura a 600px para deixar a direita livre */}
        <div className="flex flex-col w-full max-w-[600px] xl:max-w-[650px]">
          
          {/* === HERO SECTION === */}
          <header className="flex flex-col items-start gap-5">
            <div className={styles.badgeLabel}>
              <Activity className="w-3.5 h-3.5 text-cisa-primary" />
              {/* O novo nome sugerido */}
              <span>Centro de Informações em Saneamento</span>
            </div>
            
            <h1 className={styles.title}>
              Departamento de Saneamento Rural <br />
              <span className="text-gray-500 font-medium">& Pequenos Municípios</span>
            </h1>
            
            <p className={styles.subtitle}>
              Acompanhe a execução física, financeira e o panorama geoespacial dos instrumentos de repasse em tempo real.
            </p>

            {/* Micro-Overview (Quick Stats) */}
            <div className={styles.quickStats}>
               <div className={styles.statItem}>
                  <span className={styles.statValue}>R$ 9.8 Bi</span>
                  <span className={styles.statLabel}>Valor Global Ativo</span>
               </div>
               <div className={styles.divider} />
               <div className={styles.statItem}>
                  <span className={styles.statValue}>2.418</span>
                  <span className={styles.statLabel}>Municípios Beneficiados</span>
               </div>
               <div className={styles.divider} />
               <div className={styles.statItem}>
                  <span className={styles.statValue}>100%</span>
                  <span className={styles.statLabel}>Dados Sincronizados</span>
               </div>
            </div>
          </header>

          {/* === MÓDULOS (Agora em formato de Lista Elegante) === */}
          <div className="mt-14 mb-5">
            <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">
              Módulos Analíticos
            </h2>
          </div>

          <div className="flex flex-col gap-4 w-full pb-10">
            
            {/* Módulo 1: Carteira DSR */}
            <Link to="/carteira-dsr" className={`group ${styles.moduleCard}`}>
              <div className={styles.iconWrapperPrimary}>
                <Wallet className="w-5 h-5 text-[#1351B4]" />
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <h3 className={styles.cardTitle}>Carteira DSR</h3>
                <p className={styles.cardDescription}>
                  Visão financeira dos instrumentos.
                </p>
              </div>

              <div className="pl-4">
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-cisa-primary transition-all transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Módulo 2: Mapa Interativo */}
            <Link to="/mapa" className={`group ${styles.moduleCard}`}>
              <div className={styles.iconWrapperSecondary}>
                <Map className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <h3 className={styles.cardTitle}>Mapa Interativo</h3>
                <p className={styles.cardDescription}>
                  Visão geoespacial de investimentos por município e região.
                </p>
              </div>

              <div className="pl-4">
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-all transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Linha Divisória Sutil */}
            <div className="h-px w-full bg-gradient-to-r from-gray-200 to-transparent my-2" />

            {/* Módulos Inativos (Lado a Lado para economizar espaço) */}
            <div className="grid grid-cols-2 gap-4">
              <div className={styles.moduleCardDisabled}>
                <div className="flex items-center gap-3 mb-1">
                  <FileWarning className="w-4 h-4 text-gray-400" />
                  <h3 className={styles.cardTitleDisabled}>Suspensiva</h3>
                  <span className={styles.badgeSoon}>Em breve</span>
                </div>
                <p className={styles.cardDescriptionDisabled}>Gestão de paralisações.</p>
              </div>

              <div className={styles.moduleCardDisabled}>
                <div className="flex items-center gap-3 mb-1">
                  <CheckSquare className="w-4 h-4 text-gray-400" />
                  <h3 className={styles.cardTitleDisabled}>Seleção PAC</h3>
                  <span className={styles.badgeSoon}>Em breve</span>
                </div>
                <p className={styles.cardDescriptionDisabled}>Propostas Novo PAC.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}