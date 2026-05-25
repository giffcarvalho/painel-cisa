import { useMemo, useState } from 'react'
import { X, Filter, AlertCircle, ChevronDown } from 'lucide-react'
import { useFiltros } from '@/context/carteira-Dsr/useFiltros'
import { useBuscaFiltroQuery, useOpcoesFiltrosQuery } from '@/hooks/useCarteiraDsr'

const CONFIG_FILTROS = [
  { id: 'tipo_instrumento', label: 'Tipo de Instrumento', optionsKey: 'tipos_instrumento' },
  { id: 'acao_padronizada', label: 'Ação Padronizada', optionsKey: 'acoes_padronizadas' },
  { id: 'acao_orcamentaria', label: 'Ação Orçamentária', optionsKey: 'acoes_orcamentarias' },
  { id: 'componente', label: 'Componente', optionsKey: 'componentes' },
  { id: 'uf', label: 'UF', optionsKey: 'ufs' },
  { id: 'municipio', label: 'Município', optionsKey: 'municipios', remoteSearch: true },
  { id: 'novo_pac', label: 'Novo PAC', optionsKey: 'novo_pac' },
  { id: 'situacao_obra', label: 'Situação da Obra', optionsKey: 'situacoes_obra' },
  { id: 'situacao_contratacao', label: 'Situação da Contratação', optionsKey: 'situacoes_contratacao' },
  { id: 'nr_proposta', label: 'Número da Proposta', optionsKey: 'nr_proposta', remoteSearch: true },
  { id: 'nr_instrumento', label: 'Número do Instrumento', optionsKey: 'nr_instrumento', remoteSearch: true },
  { id: 'ano_proposta', label: 'Ano da Proposta', optionsKey: 'anos_proposta' },
  { id: 'nome_proponente', label: 'Proponente', optionsKey: 'nome_proponente', remoteSearch: true },
  { id: 'termino_vigencia', label: 'Término da Vigência', optionsKey: 'termino_vigencia' },
  { id: 'nr_proposta_selecao_pac', label: 'Proposta Seleção PAC', optionsKey: 'nr_proposta_selecao_pac', remoteSearch: true },
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
                    remoteSearch={config.remoteSearch}
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

// 5. O COMPONENTE REUTILIZÁVEL
function FiltroSelectGenerico({ id, label, valorAtual, opcoes, onChange, remoteSearch }) {
  const [termoBusca, setTermoBusca] = useState(valorAtual)
  const [aberto, setAberto] = useState(false)
  const termoNormalizado = termoBusca.trim().toLocaleLowerCase('pt-BR')

  const { data: opcoesBusca = [], isFetching } = useBuscaFiltroQuery(
  remoteSearch ? id : null,
  termoBusca
  )

  const opcoesFiltradas = useMemo(() => {
    const opcoesBase = remoteSearch && termoBusca.trim().length >= 2
    ? [...opcoesBusca, ...opcoes]
    : opcoes

    const opcoesUnicas = [...new Set(opcoesBase.filter(Boolean))]

    if (!termoNormalizado) {
      return opcoesUnicas.slice(0,200)
    }

    return opcoesUnicas
      .filter((item) => String(item).toLocaleLowerCase('pt-BR').includes(termoNormalizado))
      .slice(0,200)
  }, [opcoes, opcoesBusca, remoteSearch, termoBusca, termoNormalizado])

  const handleInputChange = (valor) => {
    setTermoBusca(valor)
    onChange(valor)
    setAberto(true)
  }

  const handleSelecionar = (valor) => {
    setTermoBusca(valor)
    onChange(valor)
    setAberto(false)
  }

  return (
    <div className="relative flex flex-col gap-1">
      <label htmlFor={`filtro-${id}`} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input 
          id={`filtro-${id}`}
          className="w-full p-2 pr-9 border rounded-md text-sm outline-none focus:border-blue-500 bg-white"
          value={termoBusca}
          placeholder={isFetching ? 'Buscando...' : 'Digite para filtrar...'}
          autoComplete="off"
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 120)}
          onChange={(e) => handleInputChange(e.target.value)}
        />

        <button 
        type="button"
        className="absolute inset-y-0 right-1 flex w-8 items-center justify-center text-gray-500 hover:text-gray-700"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setAberto((atual) => !atual)}
        aria-label={aberto ? 'Recolher Opções' : 'Mostrar Opções'}>
          <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </button>
      </div>
     
      {aberto && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
          <button
            type="button"
            className="w-full px-3 py-2 text-left font-medium text-gray-600 hover:bg-blue-50"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSelecionar('')}
          >
            Todos
          </button>

          {opcoesFiltradas.map((item) => (
            <button
              type="button"
              key={item}
              className="w-full px-3 py-2 text-left text-gray-700 hover:bg-blue-50"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelecionar(item)}
            >
              {item}
            </button>
          ))}

          {!isFetching && opcoesFiltradas.length === 0 && (
            <div className="px-3 py-2 text-gray-500">
              Nenhuma opção encontrada
            </div>
          )}
        </div>
      )}
    </div>
  )
}
