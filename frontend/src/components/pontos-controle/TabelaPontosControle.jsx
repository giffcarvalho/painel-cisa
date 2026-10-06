import { Fragment, useEffect, useState, useRef } from 'react';
import { emptyValue, formatDate } from '../../utils/formatters';
import { textosExplicativos } from '../../utils/pontoControleUtils';
import styles from './TabelaPontosControle.module.css';
import FiltroColuna from './FiltrosPontosControle';
import { useFiltrosPontosControle } from '../../context/pontos-controle/useFiltrosPontosControle';
import { useBuscaPlanoAcaoQuery } from "../../hooks/usePontosControle";
import { FormInput, SquarePen, Phone, ListChecks } from "lucide-react";
import { LinhaResumoInstrumento } from './LinhaResumoInstrumento';



//-----------------FUNÇÕES AUXILIARES-------------------//

//essa função extrai do objeto instrumentosQuery.data, o array com os instrumentos
//primeiro isArray testa se o objeto já é um array, se for, já retorna o proprio array
//se não for, procura por um array em várias propriedades possíveis, data, items, resultados, instrumentos, dados 
// (aqui daria para especificar a propriedade, pois pelo schema sabe-se que ela é data)
const getItens = (data) => {
  if (Array.isArray(data)) return data;
  return data?.data ?? data?.items ?? data?.resultados ?? data?.instrumentos ?? data?.dados ?? [];
};



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


//-----------------VARIÁVEIS AUXILIARES-------------------//

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



//-----------------COMPONENTES AUXILIARES-------------------//

//Pequeno componente da célula dos pontos de controle
const CelulaStatusPontoControle = ({ valor, abrirJanelaPlanoAcao, nrInstrumento, campo }) => {
  
  //Define os status que devem possui o botão para preencher o plano de ação
  const status_com_plano_acao = ['Atenção', 'Alerta', 'Crítico', 'Vencido', 'Atrasada'];
  const { data: planoAcaoData } = useBuscaPlanoAcaoQuery();
  
  const temPlanoAcao = planoAcaoData?.data?.some(
    (item) => item.nr_instrumento === nrInstrumento && item.ponto_controle === campo
  );
  
  const exibeBotaoPlanoAcao = status_com_plano_acao.includes(valor) || temPlanoAcao;

  return (
    <td className={`${styles.compactCell} ${classeStatusPontoControle(valor)}`}>
      <div className={styles.statusCellContainer}>
        <span>{emptyValue(valor)}</span>
        
        {exibeBotaoPlanoAcao && (
          <button
            type="button"
            className={styles.botao_plano_acao}
            title={temPlanoAcao ? "Visualizar/Registrar Ação" : "Registrar Ação"}
            onClick={(event) => {
              event.stopPropagation();
              abrirJanelaPlanoAcao?.(nrInstrumento, campo, valor);
            }}
          >
            {temPlanoAcao ? <SquarePen size={20} /> : <FormInput size={20} />}
          </button>
        )}
      </div>
    </td>
  );
};


const InformacaoColuna = ({ label, onClick }) => (
  <div className={styles.headerTitleWithInfo}>
    <span>{label}</span>
    <button
      type="button"
      className={styles.headerInfoButton}
      onClick={(event) => {
        event.stopPropagation();
        onClick(label);
      }}
      aria-label={`Informações sobre ${label}`}
      title={`Informações sobre ${label}`}
    >
      ?
    </button>
  </div>
);



//-----------------COMPONENTE PRINCIPAL-------------------//

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
  abrirJanelaPlanoAcao,
  abrirJanelaContato,
  abrirJanelaHistoricoAcao,
}) {
  
  const [resumoAberto, setResumoAberto] = useState(null);
  const [informacaoColunaAberta, setInformacaoColunaAberta] = useState(null);
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

 
  const abrirInformacaoColuna = (label) => {
    setInformacaoColunaAberta(label);
  };

  const fecharInformacaoColuna = () => {
    setInformacaoColunaAberta(null);
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
              <span key={idx} className={styles.cardHeaderDataDadosItem}>
                <strong>{formatarFonte(item.fonte)}:</strong>{' '}
                {formatDate(item.data_dados)}
              </span>
            ))}
        </div>


      </header>


      {informacaoColunaAberta && (
        <div
          className={styles.columnInfoOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="column-info-title"
          onClick={fecharInformacaoColuna}
        >
          <div
            className={styles.columnInfoWindow}
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const informacao = textosExplicativos[informacaoColunaAberta];

              return (
                <>
                  <div className={styles.columnInfoHeader}>
                    <h3 id="column-info-title">
                      {informacao?.titulo || informacaoColunaAberta}
                    </h3>

                    <button
                      type="button"
                      className={styles.columnInfoCloseButton}
                      onClick={fecharInformacaoColuna}
                      aria-label="Fechar explicação"
                      title="Fechar"
                    >
                      ×
                    </button>
                  </div>

                  {informacao ? (
                    <div className={styles.columnInfoContent}>
                      <div className={styles.columnInfoSection}>
                        <strong>Objetivo do controle:</strong>
                        <p>{informacao.objetivo}</p>
                      </div>

                      <div className={styles.columnInfoSection}>
                        <strong>Gatilhos operacionais:</strong>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Inicia controle:</strong>
                          <p>{informacao.gatilhos.inicia}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Finaliza controle:</strong>
                          <p>{informacao.gatilhos.finaliza}</p>
                        </div>
                      </div>

                      <div className={styles.columnInfoSection}>
                        <strong>Regra geral (aplicável):</strong>
                        <p>{informacao.regraGeral}</p>
                      </div>

                      <div className={styles.columnInfoSection}>
                        <strong>Exceção (não aplicável):</strong>
                        <p>{informacao.excecao}</p>
                      </div>

                      <div className={styles.columnInfoSection}>
                        <strong>Critérios de status e prazos:</strong>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status '-':</strong>
                          <p>{informacao.criteriosStatus['-']}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status 'OK':</strong>
                          <p>{informacao.criteriosStatus.OK}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status de 'Alerta':</strong>
                          <p>{informacao.criteriosStatus.Alerta}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status 'Vencido':</strong>
                          <p>{informacao.criteriosStatus.Vencido}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status 'Defeso Eleitoral':</strong>
                          <p>{informacao.criteriosStatus.DefesoEleitoral}</p>
                        </div>

                        <div className={styles.columnInfoSubsection}>
                          <strong>Status 'Crítico':</strong>
                          <p>{informacao.criteriosStatus.Critico}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.columnInfoContent}>
                      <p>Informações desta coluna ainda não cadastradas.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}



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
                  <th className={styles.colPequena}>Nº Instrumento</th>
                  <th className={styles.colMedia}>Informações adicionais</th>
                  <th className={styles.colGigante}>Proponente</th>
                  <th className={styles.colGigante}>Municípios beneficiados</th>
                  <th className={styles.colMini}>UF</th>
                  <th className={styles.colMini}>Carteira ativa</th>
                  <th className={styles.colMini}>Projeto aprovado</th>
                  <th className={styles.colMini}>Possui AIO</th>
                  <th className={styles.colMini}>Coordenação</th>
                  <th className={styles.colGigante}>Ação padronizada</th>
                  <th className={styles.colGigante}>Monitores</th>
                  <th className={styles.colMini}>Ações</th>
                  <th className={styles.colGrande}><InformacaoColuna label="Vencimento Suspensivas" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Emissão LAE" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Início Processo Licitatório" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Conclusão Processo Licitatório" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="VRPL" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Contratação" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Solicitação AIO" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Análise técnica AIO" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Análise GAB/SE AIO" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Registro AIO" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Emissão OS" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Início execução física" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Progresso físico" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Indícios de paralisação" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Obras paralisadas" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Vistorias parciais" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Vistoria final" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Obras próximas conclusão" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Registro conclusão" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Vigência" onClick={abrirInformacaoColuna} /></th>
                  <th className={styles.colGrande}><InformacaoColuna label="Inconsistências" onClick={abrirInformacaoColuna} /></th>
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
                  <th></th>
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
                  const temContato = instrumento?.tem_contato;

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
                                title="Abrir no Transferegov"
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
                              title="Visualizar informações adicionais"
                              onClick={(event) => toggleResumo(event, rowKey)}
                            >
                              Info {isResumoAberto ? '−' : '+'}
                            </button>

                            <span className={styles.actionDivider} aria-hidden="true" />

                            {instrumento?.cod_tci && (
                              <a 
                                href={`https://saci.cidades.gov.br/contratos/${instrumento.cod_tci}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.actionItem}
                                title="Abrir no Saci"
                              > 
                                Saci 
                              </a>
                            )}
                          </div>
                        </td>
                        <td className={styles.compactCell}>
                          <button
                            type="button"
                            className={`${styles.botao_proponente} ${instrumento?.tem_contato ? styles.proponente_com_contato : styles.proponente_sem_contato}`}
                            title={instrumento?.tem_contato ? "Ver/Editar contatos" : "Cadastrar contato"}
                            onClick={(event) => {
                              event.stopPropagation();
                              abrirJanelaContato?.(instrumento?.id_recebedor, instrumento?.proponente);
                            }}
                          >
                            <span>{emptyValue(instrumento.proponente)}</span>
                            <Phone size={13} className={styles.icone_phone} />
                          </button>
                        </td>
                        <td className={styles.colGigante}><span className={styles.truncateCell} title={emptyValue(instrumento.municipios_beneficiados)}>{emptyValue(instrumento.municipios_beneficiados)}</span></td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.uf)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.carteira_ativa)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.projeto_aprovado)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.possui_aio)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.coordenacao)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.acao)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.monitor)}</td>
                        <td className={styles.compactCell}>
                          <button
                            title="Ver ações realizadas"
                            onClick={(event) => {
                              event.stopPropagation();
                              abrirJanelaHistoricoAcao?.(instrumento?.nr_instrumento);
                            }}
                          >
                            <ListChecks className={styles.checkAcoes}/>
                          </button>
                        </td>
                        <CelulaStatusPontoControle valor={instrumento.prazo_clausulas_suspensivas} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_clausulas_suspensivas"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_emissao_lae} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_emissao_lae"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_inicio_licitacao} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_inicio_licitacao"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_conclusao_licitacao} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_conclusao_licitacao"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_vrpl} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_vrpl"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_contratacao} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_contratacao"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_solicitacao_aio} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_solicitacao_aio"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_analise_tecnica_aio} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_analise_tecnica_aio"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_analise_executiva_aio} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_analise_executiva_aio"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_registro_aio} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_registro_aio"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_emissao_os} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_emissao_os"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_inicio_execucao_fisica} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_inicio_execucao_fisica"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_progresso_fisico} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_progresso_fisico"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_indicio_paralisacao} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_indicio_paralisacao"/>
                        <CelulaStatusPontoControle valor={instrumento.status_paralisacao_obra} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="status_paralisacao_obra"/>
                        <CelulaStatusPontoControle valor={instrumento.vistoria_in_loco_parciais} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="vistoria_in_loco_parciais"/>
                        <CelulaStatusPontoControle valor={instrumento.prazo_vistoria_final} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="prazo_vistoria_final"/>
                        <CelulaStatusPontoControle valor={instrumento.obras_proximas_conclusao} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="obras_proximas_conclusao"/>
                        <CelulaStatusPontoControle valor={instrumento.registro_conclusao} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="registro_conclusao"/>
                        <CelulaStatusPontoControle valor={instrumento.vigencia} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="vigencia"/>
                        <CelulaStatusPontoControle valor={instrumento.status_de_execucao_da_obra} abrirJanelaPlanoAcao={abrirJanelaPlanoAcao} nrInstrumento={instrumento.nr_instrumento} campo="status_de_execucao_da_obra"/>
                        
                      </tr>

                      {isResumoAberto && (<LinhaResumoInstrumento nrInstrumento={nrInstrumento} />)}

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