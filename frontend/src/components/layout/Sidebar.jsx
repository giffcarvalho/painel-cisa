import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Map } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { to: '/', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
    { to: '/carteira-dsr', label: 'Carteira DSR', icon: Wallet, exact: false },
    { to: '/mapa', label: 'Mapa Interativo', icon: Map, exact: false },
  ];

  return (
    <aside className="w-[var(--sidebar-width)] h-screen flex-shrink-0 bg-cisa-surface border-r border-cisa-border flex flex-col">
      {/* Área de espaçamento para alinhar com o Header */}
      <div className="h-[var(--header-height)] flex items-center px-6 border-b border-cisa-border">
        <span className="text-sm font-semibold text-cisa-text-muted uppercase tracking-wider">
          Menu Principal
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cisa-primary-light text-cisa-primary'
                  : 'text-cisa-text-secondary hover:bg-cisa-bg hover:text-cisa-text-primary'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      {/* Rodapé da Sidebar (ex: versão do sistema) */}
      <div className="p-4 border-t border-cisa-border text-xs text-cisa-text-muted text-center">
        Painel CISA v1.0.0
      </div>
    </aside>
  );
}