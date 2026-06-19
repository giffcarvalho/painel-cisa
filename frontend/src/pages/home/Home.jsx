import { Link } from 'react-router-dom'
import { Info , Wallet, Sprout, Map, Activity, FileSearch, PackageSearch } from 'lucide-react'
import styles from './Home.module.css'
import marcaMcid from '../../assets/marca-mcid.png'

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#FAFAFA] px-6 py-8 lg:py-14 overflow-hidden font-sans">
      
      <div className={styles.heroBackground} />
      
      <img
        src={marcaMcid}
        alt="Ministério das Cidades"
        className={styles.fixedMcidLogo}
      />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto flex lg:-translate-x-8 xl:-translate-x-14 2xl:-translate-x-20">
        
        <div className="flex flex-col w-full max-w-[550px] xl:max-w-[600px]">
          
          <header className="flex flex-col items-start">
            <div className={styles.badgeLabel}>
              <Activity className="w-3.5 h-3.5 text-cisa-primary" />
              <span>Painel de Informações</span>
            </div>
            
            <h1 className={styles.title}>
              Departamento de Saneamento Rural <br />
              <span className="text-gray-400 font-medium tracking-normal">& de Pequenos Municípios</span>
            </h1>

          </header>

          <div className="mt-12 flex flex-col w-full">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 pl-2">
              Módulos Analíticos
            </h2>

            <p className="text-[12px] text-gray-400 font-bold mb-4 pl-2">
              Selecione a ferramenta desejada:
            </p>

            <div className="flex flex-col gap-1">
              
              {/* Item 1: Carteira DSR */}
              <Link to="/carteira-dsr" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-5">
                  <div className={styles.iconWrapperPrimary}>
                    <Wallet className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Carteira DSR</span>
                    <span className={styles.rowDesc}>
                      Visão analítica e financeira dos repasses e status das obras.
                    </span>
                  </div>
                </div>
                
                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>

              <div className="h-px w-5/12 ml-[76px] bg-black/[0.06] my-0.5 rounded-full" />

              {/* Item 2: Mapa Interativo */}
              <Link to="/mapa" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-5">
                  <div className={styles.iconWrapperSecondary}>
                    <Map className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Mapa Interativo</span>
                    <span className={styles.rowDesc}>
                      Visão geoespacial para análise de investimentos por localidade.
                    </span>
                  </div>
                </div>

                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>

              <div className="h-px w-5/12 ml-[76px] bg-black/[0.06] my-0.5 rounded-full" />

              {/* Item 3: Pesquisa Instrumento */}
              <Link to="/pesquisa-instrumento" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-5">
                  <div className={styles.iconWrapperSecondary}>
                    <FileSearch className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Pesquisa Instrumento</span>
                    <span className={styles.rowDesc}>
                      Consulte instrumentos, propostas, valores e situação de execução.
                    </span>
                  </div>
                </div>

                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>

              <div className="h-px w-5/12 ml-[76px] bg-black/[0.06] my-0.5 rounded-full" />

              {/* Item 4: Consulta Personalizada */}
              <Link to="/consulta-personalizada" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-5">
                  <div className={styles.iconWrapperSecondary}>
                    <PackageSearch className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Consulta Personalizada</span>
                    <span className={styles.rowDesc}>
                      Extração de dados.
                    </span>
                  </div>
                  <span className={styles.badgeSoon}>Em desenvolvimento</span>
                </div>

                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>

              <div className="h-px w-5/12 ml-[76px] bg-black/[0.06] my-0.5 rounded-full" />

              {/* Item 5: Manual do Usuário */}
              <Link to="/manual" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-5">
                  <div className={styles.iconWrapperSecondary}>
                    <Info className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Manual do Usuário</span>
                    <span className={styles.rowDesc}>
                      Aprenda a explorar os módulos, aplicar filtros e exportar relatórios.
                    </span>
                  </div>
                </div>

                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>

              <div className="h-px w-full bg-gradient-to-r from-gray-200/60 to-transparent my-4" />

              {/* Itens Futuros */}
              <div className="flex flex-col gap-2 pl-2">
                <div className="flex items-center justify-between py-2 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <Sprout className="w-4 h-4 text-gray-400" />
                    <span className="text-[14px] font-medium text-gray-500">Saneamento Rural</span>
                  </div>
                  <span className={styles.badgeSoon}>Em breve</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
