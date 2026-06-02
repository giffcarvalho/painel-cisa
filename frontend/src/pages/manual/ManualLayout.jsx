import { ChevronDown, Map, Wallet } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import styles from './Manual.module.css'

const toolItems = [
  {
    to: '/manual/carteira-dsr',
    label: 'Carteira DSR',
    description: 'Indicadores, filtros, gráficos e tabela detalhada.',
    icon: Wallet,
  },
  {
    to: '/manual/mapa-interativo',
    label: 'Mapa Interativo',
    description: 'Mapa, camadas, filtros, legenda e leitura territorial dos dados.',
    icon: Map,
  },
]

const summaryByPath = {
  '/manual': [
    { href: '#sobre-este-manual', label: 'Sobre este manual' },
    { href: '#navegacao-no-portal', label: 'Como navegar pelo portal' },
  ],
  '/manual/carteira-dsr': [
    { href: '#objetivo-da-ferramenta', label: 'Objetivo da ferramenta' },
    { href: '#indicadores', label: 'Indicadores' },
    { href: '#filtros', label: 'Filtros' },
    { href: '#graficos', label: 'Gráficos' },
    { href: '#tabela-detalhada', label: 'Tabela detalhada' },
    { href: '#exportacao', label: 'Exportação' },
  ],
  '/manual/mapa-interativo': [
    { href: '#objetivo-da-ferramenta', label: 'Objetivo da ferramenta' },
    { href: '#navegacao-no-mapa', label: 'Navegação no mapa' },
    { href: '#filtros', label: 'Filtros' },
    { href: '#camadas', label: 'Camadas' },
    { href: '#legenda', label: 'Legenda' },
    { href: '#interpretacao-dos-dados', label: 'Interpretação dos dados' },
  ],
  '/manual/informacoes-gerais': [
    { href: '#duvidas-frequentes', label: 'Dúvidas frequentes' },
    { href: '#glossario-basico', label: 'Glossário básico' },
    { href: '#orientacoes-gerais', label: 'Orientações gerais' },
  ],
}

export default function ManualLayout() {
  const { pathname } = useLocation()
  const currentSummary = summaryByPath[pathname] ?? summaryByPath['/manual']
  const isToolsActive = pathname === '/manual/carteira-dsr' || pathname === '/manual/mapa-interativo'
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false)

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Portal DSR</span>
          <h1>Manual do Usuário</h1>
          <p>Central de ajuda para consulta rápida das ferramentas do portal.</p>
        </header>

        <nav className={styles.tabs} aria-label="Seções do manual">
          <NavLink
          to="/manual"
          end
          className={({ isActive }) => 
            isActive ? `${styles.tab} ${styles.activeTab}` : styles.tab
          }
          >Início</NavLink>

          <div className={`${styles.toolsMenu} ${isToolsMenuOpen ? styles.toolsMenuOpen : ''}`}
            onMouseEnter={() => setIsToolsMenuOpen(true)}
            onMouseLeave={() => setIsToolsMenuOpen(false)}>
            <button 
              type="button"
              className={isToolsActive ? `${styles.tab} ${styles.activeTab}` : styles.tab}
              aria-haspopup="menu"
              aria-expanded={isToolsMenuOpen}
              onClick={() => setIsToolsMenuOpen((open) => !open)}>
                Ferramentas <ChevronDown className={styles.tabIcon} aria-hidden="true" />
              </button>

              <div className={styles.toolsDropdown} role="menu">
                {toolItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={styles.toolDropdownItem}
                      role="menuitem"
                      onClick={() => setIsToolsMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                      <span className={styles.toolTooltip}>
                        <Icon className={styles.toolTooltipIcon} aria-hidden="true" />
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                    </NavLink>
                  )
                })}
              </div>
          </div>

          <NavLink
            to="/manual/informacoes-gerais"
            className={({ isActive }) =>
              isActive ? `${styles.tab} ${styles.activeTab}` : styles.tab
            }
          >Informações Gerais</NavLink>
        </nav>

        <div className={styles.manualLayout}>
          <div className={styles.manualContent}>
            <Outlet />
          </div>

          <aside className={styles.pageSummary} aria-label="Sumário da página">
            <h2>Sumário</h2>
            <nav>
              {currentSummary.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>
        </div>
      </div>
    </div>
  )
}