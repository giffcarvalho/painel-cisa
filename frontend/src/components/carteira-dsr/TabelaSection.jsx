import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTabelaQuery } from '@/hooks/useCarteiraDsr'
import { useFiltros } from '@/context/useFiltros'
import { carteiraDsrApi } from '@/api/carteiraDsr'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportToExcel'


const CONFIG_COLUNAS = [
  // Identificação 
  { key: 'nr_instrumento', label: 'Nº Instrumento', fixed: true },
  { key: 'nr_proposta', label: 'Nº Proposta' },
  { key: 'operacao', label: 'Operação' },
  { key: 'nr_proposta_selecao_pac', label: 'Seleção PAC' },
  { key: 'ano_proposta', label: 'Ano Proposta' },
  { key: 'tipo_instrumento', label: 'Tipo Instrumento' },
  { key: 'novo_pac', label: 'Novo PAC' },
  { key: 'acao_orcamentaria', label: 'Ação Orçamentária' },
  { key: 'componente', label: 'Componente' },
  { key: 'acao_padronizada', label: 'Ação Padronizada' },
  
  // Proponente e Localização
  { key: 'nome_proponente', label: 'Proponente' },
  { key: 'uf', label: 'UF' },
  { key: 'qtde_municipios', label: 'Qtde Municípios' },
  { key: 'municipios_beneficiados', label: 'Municípios Beneficiados' },
  { key: 'comunidades_rurais_beneficiadas', label: 'Comunidades Rurais' },
  
  // Objeto e Status
  { key: 'objeto', label: 'Objeto' },
  { key: 'status', label: 'Status' },
  { key: 'situacao_contratacao', label: 'Situação Contratação' },
  { key: 'carteira_ativa', label: 'Carteira Ativa' },
  { key: 'situacao_atual', label: 'Situação Atual' },
  
  // Execução e Prazos
  { key: 'dia_assin_conv', label: 'Data Assinatura', isDate: true },
  { key: 'dias_termino_vigencia', label: 'Dias Término Vigência' },
  { key: 'termino_vigencia', label: 'Término Vigência' },
  { key: 'primeira_data_emissao_aio', label: '1ª Emissão AIO', isDate: true },
  { key: 'situacao_contrato', label: 'Situação Contrato' },
  { key: 'situacao_obra', label: 'Situação Obra' },
  { key: 'percentual_fisico_informado', label: '% Físico Informado' },
  { key: 'percentual_fisico_aferido', label: '% Físico Aferido' },
  { key: 'data_ultimo_bm', label: 'Último BM', isDate: true },
  { key: 'data_ultima_vistoria', label: 'Última Vistoria', isDate: true },
  { key: 'data_termino_obra', label: 'Término Obra', isDate: true },
  
  // Suspensivas e Paralisações
  { key: 'liminar_judicial', label: 'Liminar Judicial' },
  { key: 'motivo_suspensao', label: 'Motivo Suspensão' },
  { key: 'paralisada', label: 'Paralisada' },
  { key: 'principal_motivo_paralisacao', label: 'Principal Motivo Paralisação' },
  { key: 'dias_sem_evolucao', label: 'Dias Sem Evolução' },
  
  // Valores Financeiros
  { key: 'valor_global', label: 'Valor Global', isCurrency: true },
  { key: 'valor_repasse', label: 'Valor Repasse', isCurrency: true },
  { key: 'valor_contrapartida', label: 'Contrapartida', isCurrency: true },
  { key: 'valor_empenhado', label: 'Valor Empenhado', isCurrency: true },
  { key: 'valor_a_empenhar', label: 'Valor a Empenhar', isCurrency: true },
  { key: 'valor_desembolsado', label: 'Valor Desembolsado', isCurrency: true },
  { key: 'valor_empenhado_a_desembolsar', label: 'Empenhado a Desembolsar', isCurrency: true },
  { key: 'valor_a_desembolsar', label: 'Valor a Desembolsar', isCurrency: true },
  { key: 'valor_desbloqueado', label: 'Valor Desbloqueado', isCurrency: true }
]

export default function TabelaSection() {
  const [pagina, setPagina] = useState(1)
  const tamanhoPagina = 50 // Reduzido para 50 para equilibrar as 45 colunas
  const { filtros } = useFiltros()

  useEffect(() => {
    setPagina(1)
  }, [filtros])

  const { data, isLoading, isError, isFetching } = useTabelaQuery(pagina, tamanhoPagina)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      const response = await carteiraDsrApi.getTabela(filtros, 1, 500)
      const dadosBrutos = response.data.data || []

      const columnsConfig = CONFIG_COLUNAS.map(col => ({
        header: col.label,
        key: col.key,
        width: col.isDate ? 15 : col.isCurrency ? 20 : 30
      }))

      const formattedData = dadosBrutos.map((item) => {
        const row = { ...item }
        CONFIG_COLUNAS.forEach(col => {
          if (col.isCurrency) row[col.key] = formatCurrency(item[col.key])
          if (col.isDate) row[col.key] = formatDate(item[col.key])
        })
        return row
      })

      await exportToExcel({
        data: formattedData,
        columns: columnsConfig,
        fileName: 'Detalhamento_Instrumentos_DSR'
      })
    } catch (error) {
      console.error('Falha ao exportar excel:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Função auxiliar para formatar a célula da tabela na tela
  const renderCellContent = (item, col) => {
    const value = item[col.key]
    if (value === null || value === undefined || value === '') return '—'
    if (col.isCurrency) return formatCurrency(value)
    if (col.isDate) return formatDate(value)
    return String(value)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-sm font-medium text-gray-500">
          Carregando detalhamento dos instrumentos...
        </span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-64 w-full items-center justify-center bg-red-50 rounded-lg border border-red-200 mt-4">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <span className="ml-3 text-sm font-medium text-red-700">
          Falha ao carregar os dados detalhados.
        </span>
      </div>
    )
  }

  const tabelaData = data?.data || []
  const totalItems = data?.total || 0
  const totalPaginas = Math.ceil(totalItems / tamanhoPagina)

  return (
    <div className="flex flex-col overflow-hidden animate-fade-in">
      
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Registros Encontrados</h3>
          <p className="text-xs text-gray-500">
            Exibindo página {pagina} de {totalPaginas} ({totalItems} instrumentos)
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={isExporting || tabelaData.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          Exportar Excel
        </button>
      </div>

      <div className={`overflow-auto max-h-[600px] relative ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
        <table className="w-full text-left text-sm text-gray-600 border-collapse">
          <thead className="bg-white text-xs font-semibold text-gray-500 sticky top-0 z-20 shadow-[0_1px_0_0_#f3f4f6]">
            <tr>
              {CONFIG_COLUNAS.map((col) => (
                <th 
                  key={col.key} 
                  className={`px-4 py-3 whitespace-nowrap tracking-wide 
                    ${col.fixed ? 'sticky left-0 bg-white shadow-[1px_0_0_0_#f3f4f6] z-30' : ''}
                    ${col.isCurrency ? 'text-right' : ''}
                  `}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            {tabelaData.length === 0 ? (
              <tr>
                <td colSpan={CONFIG_COLUNAS.length} className="px-4 py-12 text-center text-gray-500">
                  Nenhum instrumento encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              tabelaData.map((item) => (
                <tr key={item.nr_instrumento} className="hover:bg-cisa-bg transition-colors group">
                  {CONFIG_COLUNAS.map((col) => (
                    <td 
                      key={`${item.nr_instrumento}-${col.key}`} 
                      className={`px-4 py-3 whitespace-nowrap 
                        ${col.fixed ? 'sticky left-0 bg-white group-hover:bg-cisa-bg shadow-[1px_0_0_0_#f3f4f6] font-medium text-gray-900 z-10 transition-colors' : ''}
                        ${col.isCurrency ? 'text-right tabular-nums' : ''}
                      `}
                    >
                      {renderCellContent(item, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between py-4 border-t border-gray-100 mt-2">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          
          <span className="text-sm text-gray-600">
            Página <strong className="font-semibold text-gray-900">{pagina}</strong> de {totalPaginas}
          </span>
          
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Próxima <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}