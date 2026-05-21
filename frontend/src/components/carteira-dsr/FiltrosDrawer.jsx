import { useState } from 'react'
import { X, Filter, AlertCircle } from 'lucide-react'
import { useFiltros } from '@/context/filtrosContext'
import { useOpcoesFiltrosQuery } from '@/hooks/useCarteiraDsr'

const CONFIG_FILTROS = [
  { id: 'tipo_instrumento', label: 'Tipo de Instrumento', optionsKey: 'tipos_instrumento' },
  { id: 'acao_padronizada', label: 'Ação Padronizada', optionsKey: 'acoes_padronizadas' },
  { id: 'acao_orcamentaria', label: 'Ação Orçamentária', optionsKey: 'acoes_orcamentarias' },
  { id: 'componente', label: 'Componente', optionsKey: 'componentes' },
  { id: 'uf', label: 'UF', optionsKey: 'ufs' },
  { id: 'municipio', label: 'Município', optionsKey: 'municipios', isLargeList: true },
  { id: 'novo_pac', label: 'Novo PAC', optionsKey: 'novo_pac' },
  { id: 'situacao_obra', label: 'Situação da Obra', optionsKey: 'situacoes_obra' },
  { id: 'situacao_contratacao', label: 'Situação da Contratação', optionsKey: 'situacoes_contratacao' },
  { id: 'nr_proposta', label: 'Número da Proposta', optionsKey: 'nr_proposta', isLargeList: true },
  { id: 'nr_instrumento', label: 'Número do Instrumento', optionsKey: 'nr_instrumento', isLargeList: true },
  { id: 'ano_proposta', label: 'Ano da Proposta', optionsKey: 'anos_proposta' },
  { id: 'nome_proponente', label: 'Proponente', optionsKey: 'nome_proponente', isLargeList: true },
  { id: 'termino_vigencia', label: 'Término da Vigência', optionsKey: 'termino_vigencia' },
  { id: 'nr_proposta_selecao_pac', label: 'Proposta Seleção PAC', optionsKey: 'nr_proposta_selecao_pac' },
  { id: 'carteira_ativa', label: 'Carteira Ativa', optionsKey: 'carteira_ativa' },
  { id: 'fase_instrumento', label: 'Fase do Instrumento', optionsKey: 'fase_instrumento' }
]

export default function FiltrosDrawer({ onClose }) {
  const { filtros: filtrosGlobais, aplicarFiltros, limparFiltros } = useFiltros()
  const { data: opcoes, isLoading, isError } = useOpcoesFiltrosQuery()

 
  const [rascunho, setRascunho] = useState(filtrosGlobais)
  
  const handleChange = (campo, valor) => {
    // Trata tanto string vazia quanto nulo
    const valorTratado = (valor && valor.trim() !== '') ? [valor] : [] 
    setRascunho(prev => ({ ...prev, [campo]: valorTratado }))
  }

  const handleAplicar = () => {
    aplicarFiltros(rascunho)
    onClose() 
  }


  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm flex flex-col bg-white shadow-2xl animate-slide-in-right">
        
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filtros da Carteira</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <p className="text-sm text-gray-500 flex items-center gap-2 animate-pulse">
              Carregando opções...
            </p>
          )}

          {isError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm flex gap-2 items-start border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Não foi possível carregar as opções de filtro. Tente novamente mais tarde.</span>
            </div>
          )}

          {(!isLoading && !isError) && (
            <div className="space-y-4">
              {CONFIG_FILTROS.map((config) => {
                const listaOpcoes = opcoes?.[config.optionsKey] || []
                
                return (
                  <FiltroSelectGenerico
                    key={config.id}
                    id={config.id}
                    label={config.label}
                    valorAtual={rascunho[config.id]?.[0] || ''}
                    opcoes={listaOpcoes}
                    onChange={(valor) => handleChange(config.id, valor)}
                    isLargeList={config.isLargeList}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button 
            onClick={() => {
              limparFiltros()
              onClose()
            }}
            className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
          >
            Limpar Todos
          </button>
          
          <button 
            onClick={handleAplicar}
            className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm"
          >
            Aplicar Filtros
          </button>
        </div>

      </div>
    </>
  )
}

// 5. O COMPONENTE REUTILIZÁVEL (Agora com Autocomplete Nativo)
function FiltroSelectGenerico({ id, label, valorAtual, opcoes, onChange, isLargeList }) {
  // Se for uma lista gigante (ex: Municípios), renderiza um Autocomplete nativo
  if (isLargeList) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <input 
          list={`datalist-${id}`}
          className="p-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white"
          value={valorAtual}
          placeholder="Digite para buscar..."
          onChange={(e) => onChange(e.target.value)}
        />
        <datalist id={`datalist-${id}`}>
          {opcoes.map(item => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>
    )
  }

  // Se for uma lista normal, renderiza o select comum
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select 
        className="p-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white"
        value={valorAtual} 
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Todas</option>
        {opcoes.map(item => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </div>
  )
}