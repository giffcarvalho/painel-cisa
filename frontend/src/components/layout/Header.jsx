import logoMcid from '../../assets/logo-mcid.png';

export function Header() {
  return (
    <header className="h-[var(--header-height)] w-full bg-[#f8f7f5]/95 border-b border-black/[0.06] flex items-center px-6 justify-between shrink-0 z-30 relative backdrop-blur-md shadow-[2px_0_18px_-10px_rgba(15,23,42,0.22)] hover:shadow-[2px_0_24px_-10px_rgba(15,23,42,0.28)]">      
      <div className="flex items-center">
        {/* Logo Institucional */}
        <img
          src={logoMcid}
          alt="Ministério das Cidades"
          className="h-9 w-auto object-contain"
        />

        {/* Divisor Visual Suave */}
        <div className="w-px h-6 bg-black/[0.06] mx-5" />

        {/* Nome do Sistema */}
        <div className="flex flex-col justify-center">
          <span className="font-semibold text-[#25221d] text-[17px] tracking-tight leading-tight">
            Portal DSR
          </span>
          <span className="text-[11.5px] font-medium text-[#7b7265]">
            Departamento de Saneamento Rural e de Pequenos Municípios
          </span>
        </div>
      </div>
    </header>
  );
}