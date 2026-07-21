import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth/useAuth';
import logoMcid from '../../assets/teste.png';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, usuario } = useAuth();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <header className="h-[var(--header-height)] w-full bg-[#f8f7f5]/95 border-b border-black/[0.06] flex items-center px-6 justify-between shrink-0 z-30 relative backdrop-blur-md shadow-[2px_0_18px_-10px_rgba(15,23,42,0.22)] hover:shadow-[2px_0_24px_-10px_rgba(15,23,42,0.28)]">      
      <div className="flex items-center">
        {/* Logo Institucional */}
        <img
          src={logoMcid}
          alt="Ministério das Cidades"
          className="h-13 w-auto object-contain"
        />

        {/* Divisor Visual Suave */}
        <div className="w-px h-6 bg-black/[0.06] mx-5" />

        {/* Nome do Sistema */}
        <div className="flex flex-col justify-center">
          <span className="font-semibold text-[#25221d] text-[17px] tracking-tight leading-tight">
            Painel DSR
          </span>
          <span className="text-[11.5px] font-medium text-[#7b7265]">
            Departamento de Saneamento Rural e de Pequenos Municípios
          </span>
        </div>
      </div>
      {isAuthenticated && (
        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden sm:block max-w-[220px] truncate text-sm font-semibold text-[#5a6476]">
            {usuario?.nome}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            title="Sair"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/[0.08] bg-white text-cisa-text-secondary transition hover:text-cisa-danger hover:shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sair</span>
          </button>
        </div>
      )}
    </header>
  );
}
