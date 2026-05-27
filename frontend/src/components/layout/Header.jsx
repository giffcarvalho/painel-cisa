import { Bell, ChevronDown, User } from 'lucide-react';
import logoMcid from '../../assets/logo-mcid.png';

export function Header() {
  return (
    <header className="h-[var(--header-height)] w-full bg-cisa-surface border-b border-cisa-border flex items-center px-6 justify-between shrink-0 z-30 relative shadow-sm">
      <div className="flex items-center">
        {/* Logo Institucional */}
        <img
          src={logoMcid}
          alt="Ministério das Cidades"
          className="h-9 w-auto object-contain"
        />

        {/* Divisor Visual Suave */}
        <div className="w-px h-6 bg-cisa-border mx-5" />

        {/* Nome do Sistema */}
        <div className="flex flex-col justify-center">
          <span className="font-semibold text-cisa-text-primary text-[17px] tracking-tight leading-tight">
            Painel CISA
          </span>
          <span className="text-[11.5px] font-medium text-cisa-text-muted">
            Departamento de Saneamento Rural e de Pequenos Municípios
          </span>
        </div>
      </div>
    </header>
  );
}