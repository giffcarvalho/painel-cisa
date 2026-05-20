import { useState, useEffect } from 'react'
import { X, Filter } from 'lucide-react'
import { useFiltros } from '@/context/filtrosContext'
import { useOpcoesFiltros } from '@/hooks/useCarteiraDsr'

export default function FiltrosDrawer() {
  const { 
    filtros: filtrosGlobais, 
    aplicarFiltros, 
    limparFiltros, 
    isDrawerOpen, 
    setDrawerOpen 
  } = useFiltros()

  const { data: opcoes, isLoading } = useOpcoesFiltros()

  const [rascunho, setRascunho] = useState(filtrosGlobais)

  useEffect(() => {
    if (isDrawerOpen) {
      setRascunho(filtrosGlobais)
    }
  }, [isDrawerOpen, filtrosGlobais])

  const handleChange = (campo, valor) => {
    const valorTratado = valor ? [valor] : [] 
    setRascunho(prev => ({ ...prev, [campo]: valorTratado }))
  }

  const handleAplicar = () => {
    aplicarFiltros(rascunho)
    setDrawerOpen(false) 
  }

  if (!isDrawerOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm flex flex-col bg-white shadow-2xl animate-slide-in-right">
        
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filtros da Carteira</h2>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando opções...</p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Tipo de Instrumento</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.tipo_instrumento[0] || ''} 
                  onChange={(e) => handleChange('tipo_instrumento', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.tipos_instrumento?.map(tpi => (
                    <option key={tpi} value={tpi}>{tpi}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Ação Padronizada</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.acao_padronizada[0] || ''} 
                  onChange={(e) => handleChange('acao_padronizada', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.acoes_padronizadas?.map(acp => (
                    <option key={acp} value={acp}>{acp}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Ação Orçamentária</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.acao_orcamentaria[0] || ''} 
                  onChange={(e) => handleChange('acao_orcamentaria', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.acoes_orcamentarias?.map(aco => (
                    <option key={aco} value={aco}>{aco}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Componente</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.componente[0] || ''} 
                  onChange={(e) => handleChange('componente', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.componentes?.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">UF</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.uf[0] || ''} 
                  onChange={(e) => handleChange('uf', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.ufs?.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Município</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.municipio[0] || ''} 
                  onChange={(e) => handleChange('municipio', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.municipios?.map(mun => (
                    <option key={mun} value={mun}>{mun}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Novo PAC</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.novo_pac[0] || ''} 
                  onChange={(e) => handleChange('novo_pac', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.novo_pac?.map(nvp => (
                    <option key={nvp} value={nvp}>{nvp}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Situação da Obra</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.situacao_obra[0] || ''} 
                  onChange={(e) => handleChange('situacao_obra', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.situacoes_obra?.map(sito => (
                    <option key={sito} value={sito}>{sito}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Situação da Contratação</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.situacao_contratacao[0] || ''} 
                  onChange={(e) => handleChange('situacao_contratacao', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.situacoes_contratacao?.map(sitc => (
                    <option key={sitc} value={sitc}>{sitc}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Número da Proposta</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.nr_proposta[0] || ''} 
                  onChange={(e) => handleChange('nr_proposta', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.nr_proposta?.map(nrp => (
                    <option key={nrp} value={nrp}>{nrp}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Número do Instrumento</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.nr_instrumento[0] || ''} 
                  onChange={(e) => handleChange('nr_instrumento', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.nr_instrumento?.map(nri => (
                    <option key={nri} value={nri}>{nri}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Ano da Proposta</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.ano_proposta[0] || ''} 
                  onChange={(e) => handleChange('ano_proposta', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.anos_proposta?.map(anop => (
                    <option key={anop} value={anop}>{anop}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Proponente</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.nome_proponente[0] || ''} 
                  onChange={(e) => handleChange('nome_proponente', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.nome_proponente?.map(nomp => (
                    <option key={nomp} value={nomp}>{nomp}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Término da Vigência</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.termino_vigencia[0] || ''} 
                  onChange={(e) => handleChange('termino_vigencia', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.termino_vigencia?.map(terv => (
                    <option key={terv} value={terv}>{terv}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Proposta Seleção PAC</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.nr_proposta_selecao_pac[0] || ''} 
                  onChange={(e) => handleChange('nr_proposta_selecao_pac', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.nr_proposta_selecao_pac?.map(propac => (
                    <option key={propac} value={propac}>{propac}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Carteira Ativa</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.carteira_ativa[0] || ''} 
                  onChange={(e) => handleChange('carteira_ativa', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.carteira_ativa?.map(cart => (
                    <option key={cart} value={cart}>{cart}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Fase do Instrumento</label>
                <select 
                  className="p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                  value={rascunho.fase_instrumento[0] || ''} 
                  onChange={(e) => handleChange('fase_instrumento', e.target.value)}
                >
                  <option value="">Todas</option>
                  {opcoes?.fase_instrumento?.map(fsi => (
                    <option key={fsi} value={fsi}>{fsi}</option>
                  ))}
                </select>
              </div>

            </>
          )}
        </div>

        {/* Rodapé da Gaveta ; Botões de Ação */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button 
            onClick={() => {
              limparFiltros()
              setDrawerOpen(false)
            }}
            className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50">Limpar Todos</button>
          
          <button 
            onClick={handleAplicar}
            className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 shadow-sm">Aplicar Filtros</button>
        </div>

      </div>
    </>
  )
}