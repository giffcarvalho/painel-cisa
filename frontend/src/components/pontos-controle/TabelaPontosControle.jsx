import { Fragment, useEffect, useState, useRef } from 'react';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../pages/pontos-controle/PontosControle.module.css';
import FiltroColuna from './FiltrosPontosControle';
import { useFiltrosPontosControle } from '../../context/pontos-controle/useFiltrosPontosControle';


const emptyValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return value;
};

const getItens = (data) => {
  if (Array.isArray(data)) return data;
  return data?.data ?? data?.items ?? data?.resultados ?? data?.instrumentos ?? data?.dados ?? [];
};

const PreviewField = ({ label, value, wide = false }) => (
  <div className={`${styles.previewItem} ${wide ? styles.previewItemWide : ''}`}>
    <dt>{label}</dt>
    <dd>{emptyValue(value)}</dd>
  </div>
);

const classeStatusPontoControle = (valor) => {
  switch (valor) {
    case 'Atenção':
      return styles.statusAtencao;
    case 'Alerta':
      return styles.statusAlerta;
    case 'Crítico':
      return styles.statusCritico;
    case 'Vencido':
      return styles.statusVencido;
    case 'Atrasada':
      return styles.statusAlerta;
    default:
      return '';
  }
};

const CelulaStatusPontoControle = ({ valor }) => (
  <td className={`${styles.compactCell} ${classeStatusPontoControle(valor)}`}>
    {emptyValue(valor)}
  </td>
);


const formatarFonte = (fonte) => {
  switch (fonte?.toLowerCase()) {
    case 'transferegov':
      return 'Transferegov';
    case 'caixa':
      return 'BDGestores Caixa';
    default:
      return fonte || '—';
  }
};

const formatarData = (dataStr) => {
  if (!dataStr) return '—';
  
  const [ano, mes, dia] = String(dataStr).split('T')[0].split('-');
  if (!ano || !mes || !dia) return dataStr;
  return `${dia}/${mes}/${ano}`;
};

export default function TabelaPontosControle({
  data,
  dataDados,
  isLoading,
  isError,
  pagina,
  tamanhoPagina,
  onPageChange,
  onPageSizeChange,
  nrInstrumentoSelecionado,
  onSelectInstrumento,
}) {
  
  const [resumoAberto, setResumoAberto] = useState(null);
  const { limparTodosFiltros, totalFiltrosAtivos } = useFiltrosPontosControle();
  const tableWrapperRef = useRef(null);
  const instrumentos = getItens(data);
  const total = data?.total ?? instrumentos.length;
  const paginaAtual = data?.pagina ?? pagina;
  const tamanhoAtual = data?.tamanho_pagina ?? tamanhoPagina;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanhoAtual));

  useEffect(() => {
    setResumoAberto(null);
  }, [paginaAtual, tamanhoAtual, total]);

  const toggleResumo = (event, rowKey) => {
    event.stopPropagation();
    setResumoAberto((atual) => (atual === rowKey ? null : rowKey));
  };

  const abrirFicha = (event, nrInstrumento) => {
    event.stopPropagation();
    if (!nrInstrumento) return;
    onSelectInstrumento(nrInstrumento);
  };

  const handleScrollLeft = () => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollBy({ left: -500, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollBy({ left: 500, behavior: 'smooth' });
    }
  };
  
  return (
    <section className={styles.card}>
      
      <header className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h2>Pontos de Controle</h2>
          <div className={styles.cardHeaderSubInfo}>
            <p>{total ? `${total} registro(s) encontrado(s)` : 'Resultado da pesquisa'}</p>
            
            {totalFiltrosAtivos > 0 && (
              <button 
                type="button" 
                className={styles.btnClearFilters} 
                onClick={limparTodosFiltros}
                title="Limpar todos os filtros aplicados"
              >
                Limpar filtros ({totalFiltrosAtivos})
              </button>
            )}
          </div>
        </div>
        <div className={styles.scrollButtonsGroup}>
          <button 
            type="button" 
            className={styles.scrollArrowButton} 
            onClick={handleScrollLeft}
            title="Rolar para esquerda"
          >
            &#9664;
          </button>
          <button 
            type="button" 
            className={styles.scrollArrowButton} 
            onClick={handleScrollRight}
            title="Rolar para direita"
          >
            &#9654;
          </button>
        </div>
        <div className={styles.cardHeaderDataDados}>
          {dataDados && getItens(dataDados).map((item, idx) => (
            <span key={idx} style={{ fontSize: '0.85rem', marginLeft: '10px' }}>
              <strong>{formatarFonte(item.fonte)}:</strong> {formatarData(item.data_dados)}
            </span>
          ))}
        </div>
      </header>

      {isLoading && <div className={styles.state}>Carregando instrumentos...</div>}

      {isError && (
        <div className={`${styles.state} ${styles.error}`}>
          Não foi possível carregar os instrumentos.
        </div>
      )}

      {!isLoading && !isError && instrumentos.length === 0 && (
        <div className={styles.state}>Nenhum instrumento encontrado.</div>
      )}

      {!isLoading && !isError && instrumentos.length > 0 && (
        <>
          <div className={styles.tableWrapper} ref={tableWrapperRef}>
            <table className={styles.table}>
              <thead>

                <tr className={styles.headerRow}>
                  <th className={styles.colInstrumento}>Nº Instrumento</th>
                  <th className={styles.colAcoes}>Ações</th>
                  <th className={styles.colProponente}>Proponente</th>
                  <th className={styles.colMunicipios}>Municípios beneficiados</th>
                  <th className={styles.colUf}>UF</th>
                  <th className={styles.colCarteiraAtiva}>Carteira ativa</th>
                  <th className={styles.colProjetoAprovado}>Projeto aprovado</th>
                  <th className={styles.colPossuiAio}>Possui AIO</th>
                  <th className={styles.colCoordenacao}>Coordenação</th>
                  <th className={styles.colAcao}>Ação</th>
                  <th className={styles.colMonitores}>Monitores</th>
                  <th className={styles.colPontosControle}>Vencimento Suspensivas</th>
                  <th className={styles.colPontosControle}>Emissão LAE</th>
                  <th className={styles.colPontosControle}>Início Processo Licitatório</th>
                  <th className={styles.colPontosControle}>Conclusão Processo Licitatório</th>
                  <th className={styles.colPontosControle}>VRPL</th>
                  <th className={styles.colPontosControle}>Contratação</th>
                  <th className={styles.colPontosControle}>Solicitação AIO</th>
                  <th className={styles.colPontosControle}>Análise técnica AIO</th>
                  <th className={styles.colPontosControle}>Análise GAB/SE AIO</th>
                  <th className={styles.colPontosControle}>Registro AIO</th>
                  <th className={styles.colPontosControle}>Emissão OS</th>
                  <th className={styles.colPontosControle}>Início execução física</th>
                  <th className={styles.colPontosControle}>Progresso físico</th>
                  <th className={styles.colPontosControle}>Indícios de paralisação</th>
                  <th className={styles.colPontosControle}>Obras paralisadas</th>
                  <th className={styles.colPontosControle}>Vistorias parciais</th>
                  <th className={styles.colPontosControle}>Vistoria final</th>
                  <th className={styles.colPontosControle}>Obras próximas conclusão</th>
                  <th className={styles.colPontosControle}>Registro conclusão</th>
                  <th className={styles.colPontosControle}>Vigência</th>
                  <th className={styles.colPontosControle}>Inconsistências</th>
                </tr>

                <tr className={styles.filterRow}>
                  <th><FiltroColuna campo="nr_instrumento" label="Nº Instrumento" /></th>
                  <th></th>
                  <th><FiltroColuna campo="proponente" label="proponente" /></th>
                  <th><FiltroColuna campo="municipios_beneficiados" label="Municípios beneficiados" /></th>
                  <th><FiltroColuna campo="uf" label="UF" /></th>
                  <th><FiltroColuna campo="carteira_ativa" label="Carteira ativa" /></th>
                  <th><FiltroColuna campo="projeto_aprovado" label="Projeto aprovado" /></th>
                  <th><FiltroColuna campo="possui_aio" label="Possui AIO" /></th>
                  <th><FiltroColuna campo="coordenacao" label="Coordenação" /></th>
                  <th><FiltroColuna campo="acao" label="Ação" /></th>
                  <th><FiltroColuna campo="monitor" label="Monitores" /></th>
                  <th><FiltroColuna campo="prazo_clausulas_suspensivas" label="Cláusulas Suspensivas" /></th>
                  <th><FiltroColuna campo="prazo_emissao_lae" label="Emissão LAE" /></th>
                  <th><FiltroColuna campo="prazo_inicio_licitacao" label="Início Processo Licitatório" /></th>
                  <th><FiltroColuna campo="prazo_conclusao_licitacao" label="Conclusão Processo Licitatório" /></th>
                  <th><FiltroColuna campo="prazo_vrpl" label="VRPL" /></th>
                  <th><FiltroColuna campo="prazo_contratacao" label="Contratação" /></th>
                  <th><FiltroColuna campo="prazo_solicitacao_aio" label="Solicitação AIO" /></th>
                  <th><FiltroColuna campo="prazo_analise_tecnica_aio" label="Análise técnica AIO" /></th>
                  <th><FiltroColuna campo="prazo_analise_executiva_aio" label="Análise GAB/SE AIO" /></th>
                  <th><FiltroColuna campo="prazo_registro_aio" label="Registro AIO" /></th>
                  <th><FiltroColuna campo="prazo_emissao_os" label="Emissão OS" /></th>
                  <th><FiltroColuna campo="prazo_inicio_execucao_fisica" label="Início execução física" /></th>
                  <th><FiltroColuna campo="prazo_progresso_fisico" label="Progresso físico" /></th>
                  <th><FiltroColuna campo="prazo_indicio_paralisacao" label="Indício de paralisação" /></th>
                  <th><FiltroColuna campo="status_paralisacao_obra" label="Obras paralisadas" /></th>
                  <th><FiltroColuna campo="vistoria_in_loco_parciais" label="Vistorias parciais" /></th>
                  <th><FiltroColuna campo="prazo_vistoria_final" label="Vistoria final" /></th>
                  <th><FiltroColuna campo="obras_proximas_conclusao" label="Obras próximas conclusão" /></th>
                  <th><FiltroColuna campo="registro_conclusao" label="Registro conclusão" /></th>
                  <th><FiltroColuna campo="vigencia" label="Vigência" /></th>
                  <th><FiltroColuna campo="status_de_execucao_da_obra" label="Inconsistências" /></th>
                </tr>

              </thead>
              
              <tbody>
                {instrumentos.map((instrumento, index) => {
                  const nrInstrumento = instrumento.nr_instrumento;
                  const rowKey = String(nrInstrumento ?? `${instrumento.nr_proposta ?? 'sem-id'}-${index}`);
                  const isSelected = String(nrInstrumentoSelecionado) === String(nrInstrumento);
                  const isResumoAberto = resumoAberto === rowKey;

                  return (
                    <Fragment key={rowKey}>
                      <tr className={`${styles.tableRow} ${isSelected ? styles.tableRowSelected : ''}`}>
                        <td className={styles.compactCell}>
                          {instrumento.nr_instrumento ? (instrumento.link_transferegov ? (
                              <a
                                href={instrumento.link_transferegov}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.detailLink}
                              >
                                {instrumento.nr_instrumento}
                              </a>
                            ) : (instrumento.nr_instrumento)) : ('—')
                          }
                        </td>
                        <td className={styles.actionCell}>
                          <div className={styles.actionGroup}>
                            <button
                              type="button"
                              className={styles.actionItem}
                              aria-expanded={isResumoAberto}
                              aria-label={isResumoAberto ? 'Recolher resumo' : 'Ver resumo'}
                              title="Pré-visualizar informações principais"
                              onClick={(event) => toggleResumo(event, rowKey)}
                            >
                              Resumo {isResumoAberto ? '−' : '+'}
                            </button>

                            <span className={styles.actionDivider} aria-hidden="true" />

                            <button
                              type="button"
                              className={styles.actionItem}
                              title="Abrir ficha detalhada"
                              disabled={!nrInstrumento}
                              onClick={(event) => abrirFicha(event, nrInstrumento)}
                            >
                              Ficha
                            </button>
                          </div>
                        </td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.proponente)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.municipios_beneficiados)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.uf)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.carteira_ativa)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.projeto_aprovado)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.possui_aio)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.coordenacao)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.acao)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.monitor)}</td>
                        <CelulaStatusPontoControle valor={instrumento.prazo_clausulas_suspensivas} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_emissao_lae} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_inicio_licitacao} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_conclusao_licitacao} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_vrpl} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_contratacao} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_solicitacao_aio} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_analise_tecnica_aio} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_analise_executiva_aio} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_registro_aio} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_emissao_os} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_inicio_execucao_fisica} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_progresso_fisico} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_indicio_paralisacao} />
                        <CelulaStatusPontoControle valor={instrumento.status_paralisacao_obra} />
                        <CelulaStatusPontoControle valor={instrumento.vistoria_in_loco_parciais} />
                        <CelulaStatusPontoControle valor={instrumento.prazo_vistoria_final} />
                        <CelulaStatusPontoControle valor={instrumento.obras_proximas_conclusao} />
                        <CelulaStatusPontoControle valor={instrumento.registro_conclusao} />
                        <CelulaStatusPontoControle valor={instrumento.vigencia} />
                        <CelulaStatusPontoControle valor={instrumento.status_de_execucao_da_obra} />
                        
                      </tr>

                      {isResumoAberto && (
                        <tr className={styles.previewRow}>
                          <td colSpan={3}>
                            <dl className={styles.previewGrid}>
                              <PreviewField label="UF" value={instrumento.uf} />
                              <PreviewField label="Ação" value={instrumento.acao} />
                              <PreviewField label="Monitor" value={instrumento.monitor} />
                              <PreviewField label="Município(s)" value={instrumento.municipios_beneficiados} />
                              <PreviewField label="Carteira ativa" value={instrumento.carteira_ativa} />
                              <PreviewField label="Projeto aprovado" value={instrumento.projeto_aprovado} />
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <footer className={styles.pagination}>
            <span>
              Página {paginaAtual} de {totalPaginas}
            </span>

            <div className={styles.paginationControls}>
              {onPageSizeChange && (
                <select
                  className={styles.pageSize}
                  value={tamanhoPagina}
                  onChange={(event) => onPageSizeChange(Number(event.target.value))}
                >
                  <option value={40}>40</option>
                  <option value={80}>80</option>
                  <option value={200}>200</option>
                </select>
              )}

              <button type="button" disabled={paginaAtual <= 1} onClick={() => onPageChange(paginaAtual - 1)}>
                Anterior
              </button>

              <button
                type="button"
                disabled={paginaAtual >= totalPaginas}
                onClick={() => onPageChange(paginaAtual + 1)}
              >
                Próxima
              </button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}