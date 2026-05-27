import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Map, Menu } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { to: '/', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
    { to: '/carteira-dsr', label: 'Carteira DSR', icon: Wallet, exact: false },
    { to: '/mapa', label: 'Mapa Interativo', icon: Map, exact: false },
  ];

  return (
    <aside className="group w-16 hover:w-60 h-screen flex-shrink-0 bg-cisa-surface border-r border-cisa-border flex flex-col transition-all duration-300 ease-in-out relative z-40 shadow-[2px_0_10px_-3px_rgba(0,0,0,0.0)] hover:shadow-[2px_0_15px_-3px_rgba(0,0,0,0.05)]">
      
      {/* Área do topo - Ícone de Menu que revela o título no hover */}
      <div className="h-[var(--header-height)] flex items-center justify-center group-hover:justify-start group-hover:px-5 border-b border-cisa-border transition-all overflow-hidden">
        <Menu className="w-5 h-5 text-cisa-text-muted shrink-0 group-hover:hidden" />
        <span className="hidden group-hover:block text-xs font-bold text-cisa-text-muted uppercase tracking-wider whitespace-nowrap">
          Navegação
        </span>
      </div>

      {/* Lista de Links */}
      <nav className="flex-1 py-4 px-2 group-hover:px-3 flex flex-col gap-2 overflow-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-cisa-primary-light text-cisa-primary'
                  : 'text-cisa-text-secondary hover:bg-cisa-bg hover:text-cisa-text-primary'
              }`
            }
          >
            <item.icon className="w-[22px] h-[22px] shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
      
      {/* Rodapé */}
      <div className="p-4 border-t border-cisa-border text-xs text-cisa-text-muted text-center whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Painel CISA v1.0
      </div>
    </aside>
  );
}