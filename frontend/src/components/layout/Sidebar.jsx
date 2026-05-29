import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Map, Menu, Info } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { to: '/', label: 'Menu Inicial', icon: LayoutDashboard, exact: true },
    { to: '/carteira-dsr', label: 'Carteira DSR', icon: Wallet, exact: false },
    { to: '/mapa', label: 'Mapa Interativo', icon: Map, exact: false },
    { to: '/manual', label: 'Manual do Usuário', icon: Info, exact: false }
  ];

  return (
    <aside className="group w-16 hover:w-60 h-screen flex-shrink-0 bg-[#f8f7f5]/95 border-r border-black/[0.06] flex flex-col transition-all duration-300 ease-in-out relative z-40 shadow-[2px_0_18px_-10px_rgba(15,23,42,0.22)] hover:shadow-[2px_0_24px_-10px_rgba(15,23,42,0.28)] backdrop-blur-md">
      
      {/* Área do topo - Ícone de Menu que revela o título no hover */}
      <div className="h-[var(--header-height)] flex items-center justify-center group-hover:justify-start group-hover:px-5 border-b border-black/[0.06] transition-all overflow-hidden">
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
              `flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-white text-cisa-primary shadow-[0_2px_4px_rgba(15,23,42,0.025),0_10px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.04]'
                  : 'text-cisa-text-secondary hover:bg-white/70 hover:text-cisa-text-primary hover:shadow-[0_2px_8px_rgba(15,23,42,0.035)]'
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
      <div className="p-4 border-t border-black/[0.06] text-xs text-cisa-text-muted text-center whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Painel CIS v1.0
      </div>
    </aside>
  );
}