import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { House, Wallet, Map, Menu, Info, FileSearch, PackageSearch, ClipboardList, ClipboardCheck } from 'lucide-react'

export function Sidebar({ openOnClick = false }) {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { to: '/', label: 'Menu Inicial', icon: House, exact: true },
    { to: '/carteira-dsr', label: 'Carteira DSR', icon: Wallet, exact: false },
    { to: '/mapa', label: 'Mapa Interativo', icon: Map, exact: false },
    { to: '/pesquisa-instrumento', label: 'Pesquisa Instrumento', icon: FileSearch, exact: false },
    { to: '/consulta-personalizada', label: 'Consulta Personalizada', icon: PackageSearch, exact: false },
    { to: '/revisao-instrumento', label: 'Revisão Instrumento', icon: ClipboardCheck, exact: false },
    { to: '/teste-envios', label: 'Envios de Teste', icon: ClipboardList, exact: false },
    { to: '/manual', label: 'Manual do Usuário', icon: Info, exact: false },
  ]
  
  return (
    <aside
      className={`
        h-screen flex-shrink-0 bg-[#f8f7f5]/95
        border-r border-black/[0.06] flex flex-col
        transition-all duration-300 ease-in-out relative z-40
        shadow-[2px_0_18px_-10px_rgba(15,23,42,0.22)]
        backdrop-blur-md
        ${
          openOnClick
            ? isOpen
              ? 'w-60 shadow-[2px_0_24px_-10px_rgba(15,23,42,0.28)]'
              : 'w-16'
            : 'group w-16 hover:w-60 hover:shadow-[2px_0_24px_-10px_rgba(15,23,42,0.28)]'
        }
      `}
    >
      {openOnClick ? (
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          className={`
            h-[var(--header-height)] w-full flex items-center
            border-b border-black/[0.06] transition-all overflow-hidden
            ${isOpen ? 'justify-start px-5' : 'justify-center'}
          `}
        >
          {/* Área do topo - Ícone de Menu que revela o título no hover */}
          {isOpen ? (
            <span className="text-xs font-bold text-cisa-text-muted uppercase tracking-wider whitespace-nowrap">
              Navegação
            </span>
          ) : (
            <Menu className="w-5 h-5 text-cisa-text-muted shrink-0" />
          )}
        </button>
      ) : (
        <div className="h-[var(--header-height)] flex items-center justify-center group-hover:justify-start group-hover:px-5 border-b border-black/[0.06] transition-all overflow-hidden">
          <Menu className="w-5 h-5 text-cisa-text-muted shrink-0 group-hover:hidden" />

          <span className="hidden group-hover:block text-xs font-bold text-cisa-text-muted uppercase tracking-wider whitespace-nowrap">
            Navegação
          </span>
        </div>
      )}

      {/* Lista de Links */}
      <nav
        className={`
          flex-1 py-4 flex flex-col gap-2 overflow-hidden
          ${
            openOnClick
              ? isOpen
                ? 'px-3'
                : 'px-2'
              : 'px-2 group-hover:px-3'
          }
        `}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-white text-cisa-primary shadow-[0_2px_4px_rgba(15,23,42,0.025),0_10px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.04]'
                  : 'text-cisa-text-secondary hover:bg-white/70 hover:text-cisa-text-primary hover:shadow-[0_2px_8px_rgba(15,23,42,0.035)]'
              }`
            }
          >
            <item.icon className="w-[22px] h-[22px] shrink-0" />

            <span
              className={`
                transition-opacity duration-300 delay-75
                ${
                  openOnClick
                    ? isOpen
                      ? 'opacity-100'
                      : 'opacity-0'
                    : 'opacity-0 group-hover:opacity-100'
                }
              `}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
      
      {/* Rodapé */}
      <div
        className={`
          p-4 border-t border-black/[0.06] text-xs
          text-cisa-text-muted text-center whitespace-nowrap
          overflow-hidden transition-opacity duration-300
          ${
            openOnClick
              ? isOpen
                ? 'opacity-100'
                : 'opacity-0'
              : 'opacity-0 group-hover:opacity-100'
          }
        `}
      >
        Painel DSR v1.0
      </div>
    </aside>
  )
}
