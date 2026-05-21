import logoMcid from '../../assets/logo-mcid.png';

export function Header() {
  return (
    <header className="h-[var(--header-height)] w-full bg-cisa-surface border-b border-cisa-border flex items-center px-6 justify-between">
      <div className="flex items-center">
        {/* Logo Institucional */}
        <img 
          src={logoMcid} 
          alt="Governo Federal - Ministério das Cidades" 
          className="h-10 w-auto object-contain"
        />
        
        {/* Divisor Visual */}
        <div className="w-px h-8 bg-cisa-border mx-6" /> 
        
        {/* Nome do Sistema */}
        <div className="flex flex-col">
          <span className="font-bold text-cisa-text-primary text-lg leading-tight tracking-tight">
            Painel CISA
          </span>
          <span className="text-xs font-medium text-cisa-text-secondary">
            DEPARTAMENTO DE SANEAMENTO RURAL E DE PEQUENOS MUNICÍPIOS
          </span>
        </div>
      </div>
      
      {/* Menu de usuário / ações globais */}
      <div className="flex items-center gap-4">
        {/* Placeholder */}
      </div>
    </header>
  );
}