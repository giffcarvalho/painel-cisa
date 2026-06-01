import { NavLink, Outlet } from 'react-router-dom'
import styles from './Manual.module.css'

const manualNavItems = [
  { to: '/manual', label: 'Início', end: true },
  { to: '/manual/carteira-dsr', label: 'Carteira DSR' },
  { to: '/manual/mapa-interativo', label: 'Mapa Interativo' },
  { to: '/manual/informacoes-gerais', label: 'Informações Gerais' },
]

export default function ManualLayout() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Portal DSR</span>
          <h1>Manual do Usuário</h1>
          <p>Central de ajuda para consulta rápida das ferramentas do portal.</p>
        </header>

        <nav className={styles.tabs} aria-label="Seções do manual">
          {manualNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${styles.tab} ${styles.activeTab}` : styles.tab
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </div>
  )
}