import { Fragment, useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import styles from '../../pages/pesquisa-instrumento/PesquisaInstrumento.module.css';

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

export default function TabelaInstrumentos({
  data,
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

  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2>Instrumentos</h2>
        <p>{total ? `${total} registro(s) encontrado(s)` : 'Resultado da pesquisa'}</p>
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
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colInstrumento}>Nº Instrumento</th>
                  <th className={styles.colProposta}>Nº Proposta</th>
                  <th className={styles.colAcoes}>Ações</th>
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
                        <td className={styles.compactCell}>{emptyValue(instrumento.nr_instrumento)}</td>
                        <td className={styles.compactCell}>{emptyValue(instrumento.nr_proposta)}</td>
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
                      </tr>

                      {isResumoAberto && (
                        <tr className={styles.previewRow}>
                          <td colSpan={3}>
                            <dl className={styles.previewGrid}>
                              <PreviewField label="Operação" value={instrumento.operacao} />
                              <PreviewField label="UF" value={instrumento.uf} />
                              <PreviewField label="Proponente" value={instrumento.nome_proponente} />
                              <PreviewField label="Município(s)" value={instrumento.municipios_beneficiados} />
                              <PreviewField label="Situação" value={instrumento.situacao_obra} />
                              <PreviewField label="Valor global" value={formatCurrency(instrumento.valor_global)} />
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
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
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