import { Link } from 'react-router-dom'
import { Info, Wallet, Sprout, Map, Activity, FileSearch, PackageSearch, ClipboardCheck } from 'lucide-react'
import AuthMenu from '@/components/auth/AuthMenu'
import styles from './Home.module.css'
import marcaMcid from '../../assets/marca-mcid-atz.png'

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#FAFAFA] px-6 py-6 lg:py-10 overflow-hidden font-sans">
      
      <div className={styles.heroBackground} />
      
      <img
        src={marcaMcid}
        alt="Ministério das Cidades"
        className={styles.fixedMcidLogo}
      />

      <div className={styles.authActions}>
        <AuthMenu />
      </div>

      
      <div className="relative z-10 w-full max-w-[1180px] mr-auto px-6 lg:pl-30 xl:pl-30 flex flex-col">
        
        <header className="flex flex-col items-start max-w-[600px]">
          <div className={styles.badgeLabel}>
            <Activity className="w-3.5 h-3.5 text-cisa-primary" />
            <span>Painel de Informações</span>
          </div>
          
          <h1 className={styles.title}>
            Departamento de Saneamento Rural <br />
            <span className="text-gray-400 font-medium tracking-normal">& de Pequenos Municípios</span>
          </h1>
        </header>

        <div className="mt-20 flex flex-col w-full">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 pl-2">
            Módulos
          </h2>

          <p className="text-[12px] text-gray-400 font-bold mb-4 pl-2">
            Selecione a ferramenta desejada:
          </p>

          {/* GRID EM 2 COLUNAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-4">
            
            {/* Item 1: Carteira DSR */}
            <div className="flex flex-col justify-between">
              <Link to="/carteira-dsr" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-4">
                  <div className={styles.iconWrapperPrimary}>
                    <Wallet className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Painel da carteira DSR</span>
                    <span className={styles.rowDesc}>
                      Visão gerencial dos instrumentos de repasse.
                    </span>
                  </div>
                </div>
                
                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>
              <div className="h-px w-auto ml-18 mr-28 bg-black/[0.06] my-1 rounded-full" />
            </div>

            {/* Item 2: Mapa Interativo */}
            <div className="flex flex-col justify-between">
              <Link to="/mapa" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-4">
                  <div className={styles.iconWrapperSecondary}>
                    <Map className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Mapa Interativo</span>
                    <span className={styles.rowDesc}>
                      Visão geoespacial das principais informações do DSR.
                    </span>
                  </div>
                </div>

                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>
              <div className="h-px w-auto ml-18 mr-28 bg-black/[0.06] my-1 rounded-full" />
            </div>

            {/* Item 3: Pesquisa Instrumento */}
            <div className="flex flex-col justify-between">
              <Link to="/pesquisa-instrumento" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-4">
                  <div className={styles.iconWrapperSecondary}>
                    <FileSearch className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Pesquisa Instrumento</span>
                    <span className={styles.rowDesc}>
                      Consulte informações resumidas de um instrumento de repasse.
                    </span>
                  </div>
                </div>

                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>
              <div className="h-px w-auto ml-18 mr-28 bg-black/[0.06] my-1 rounded-full" />
            </div>

            {/* Item 4: Consulta Personalizada */}
            <div className="flex flex-col justify-between">
              <Link to="/consulta-personalizada" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-4">
                  <div className={styles.iconWrapperSecondary}>
                    <PackageSearch className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Consulta Personalizada</span>
                    <span className={styles.rowDesc}>
                      Faça downloads personalizados das bases do Painel DSR.
                    </span>
                  </div>
                </div>

                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>
              <div className="h-px w-auto ml-18 mr-28 bg-black/[0.06] my-1 rounded-full" />
            </div>

            {/* Item 5: Revisão Instrumento */}
            <div className="flex flex-col justify-between">
              <Link to="/revisao-instrumento" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-4">
                  <div className={styles.iconWrapperSecondary}>
                    <ClipboardCheck className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Revisão Instrumento</span>
                    <span className={styles.rowDesc}>
                      Registre análise e realize ajustes das informações cadastrais.
                    </span>
                  </div>
                </div>

                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>
              <div className="h-px w-auto ml-18 mr-28 bg-black/[0.06] my-1 rounded-full" />
            </div>

            {/* Item 6: Pontos de Controle */}
            <div className="flex flex-col justify-between">
              <Link to="/pontos-controle" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-4">
                  <div className={styles.iconWrapperSecondary}>
                    <ClipboardCheck className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.rowTitle}>Pontos de Controle</span>
                    <span className={styles.rowDesc}>
                      Visualize a situação dos Pontos de Controle e registre providências.
                    </span>
                  </div>
                </div>

                <div className={styles.customArrow}>
                  <div className={styles.arrowTop}></div>
                  <div className={styles.arrowBottom}></div>
                </div>
              </Link>
              <div className="h-px w-auto ml-18 mr-28 bg-black/[0.06] my-1 rounded-full" />
            </div>

            {/* Item 7: Manual do Usuário */}
            <div className="flex flex-col justify-between">
              <Link to="/manual" className={`group ${styles.editorialRow}`}>
                <div className="flex items-center gap-4">
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
              <div className="h-px w-auto ml-18 mr-28 bg-black/[0.06] my-1 rounded-full" />
            </div>

            {/* Itens Futuros (Em breve) */}
            <div className="flex flex-col justify-between">
              <div className="flex items-center justify-between p-3 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Sprout className="w-[18px] h-[18px] text-gray-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-semibold text-gray-500">Saneamento Rural</span>
                    <span className="text-[13px] text-gray-400">Módulo em desenvolvimento.</span>
                  </div>
                </div>
                <span className={styles.badgeSoon}>Em breve</span>
              </div>
              <div className="h-px w-auto ml-18 mr-28 bg-black/[0.06] my-1 rounded-full" />
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}