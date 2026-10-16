import { useEffect, useMemo, useState } from 'react';
import { FiltrosPesquisaInstrumentoProvider } from '../../context/pesquisa-instrumento/filtrosContext';
import { useFiltrosPesquisaInstrumento } from '../../context/pesquisa-instrumento/useFiltrosPesquisaInstrumento';
import { useInstrumentosPesquisaInstrumentoQuery } from '../../hooks/usePesquisaInstrumento';
import FiltrosPesquisaInstrumento from '../../components/pesquisa-instrumento/FiltrosPesquisaInstrumento';
import TabelaInstrumentos from '../../components/pesquisa-instrumento/TabelaInstrumentos';
import DetalheInstrumento from '../../components/pesquisa-instrumento/DetalheInstrumento';
import styles from './PesquisaInstrumento.module.css';

const getItens = (data) => {
  // Aceita os formatos históricos do endpoint enquanto a tabela trabalha com
  // uma coleção única e previsível.
  if (Array.isArray(data)) return data;
  return data?.data ?? data?.items ?? data?.resultados ?? data?.instrumentos ?? data?.dados ?? [];
};

function PesquisaInstrumentoContent() {
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(50);
  const [nrInstrumentoSelecionado, setNrInstrumentoSelecionado] = useState(null);

  const { filtros } = useFiltrosPesquisaInstrumento();
  const instrumentosQuery = useInstrumentosPesquisaInstrumentoQuery(
    filtros,
    pagina,
    tamanhoPagina
  );

  const instrumentos = useMemo(
    () => getItens(instrumentosQuery.data),
    [instrumentosQuery.data]
  );

  // Uma mudança de filtro inicia uma nova navegação de resultados; seleção e
  // página anteriores não são válidas nesse novo universo.
  useEffect(() => {
    setPagina(1);
    setNrInstrumentoSelecionado(null);
  }, [filtros]);

  useEffect(() => {
    // Mantém o painel de detalhe sincronizado com a página corrente, removendo
    // seleções que deixaram de existir após paginação ou atualização da consulta.
    if (instrumentosQuery.isLoading || instrumentosQuery.isFetching) return;
    if(
      nrInstrumentoSelecionado &&
      !instrumentos.some(
        (instrumento) => String(instrumento.nr_instrumento) === String(nrInstrumentoSelecionado)
      )
    ){
      setNrInstrumentoSelecionado(null);
    }
  }, [
    instrumentos,
    instrumentosQuery.isFetching,
    instrumentosQuery.isLoading,
    nrInstrumentoSelecionado,
  ]);

  const handlePageChange = (novaPagina) => {
    setPagina(novaPagina);
    setNrInstrumentoSelecionado(null);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Pesquisa Instrumento</h1>
          <p>
            Consulte um instrumento, proposta, operação, proponente ou município beneficiado.
          </p>
        </div>
      </header>

      <FiltrosPesquisaInstrumento />

      <section className={styles.contentGrid}>
        <TabelaInstrumentos
          data={instrumentosQuery.data}
          isLoading={instrumentosQuery.isLoading}
          isError={instrumentosQuery.isError}
          pagina={pagina}
          tamanhoPagina={tamanhoPagina}
          onPageChange={handlePageChange}
          onPageSizeChange={(novoTamanho) => {
            setTamanhoPagina(novoTamanho);
            setPagina(1);
            setNrInstrumentoSelecionado(null);
          }}
          nrInstrumentoSelecionado={nrInstrumentoSelecionado}
          onSelectInstrumento={setNrInstrumentoSelecionado}
        />

        <DetalheInstrumento nrInstrumentoSelecionado={nrInstrumentoSelecionado} />
      </section>
    </main>
  );
}

export default function PesquisaInstrumento() {
  return (
    <FiltrosPesquisaInstrumentoProvider>
      <PesquisaInstrumentoContent />
    </FiltrosPesquisaInstrumentoProvider>
  );
}
