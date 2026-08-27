import { useEffect, useMemo, useState } from 'react';
import { FiltrosPontosControleProvider } from '../../context/pontos-controle/filtrosContext';
import { useFiltrosPontosControle } from '../../context/pontos-controle/useFiltrosPontosControle';
import { useInstrumentosPontosControleQuery } from '../../hooks/usePontosControle';
import FiltrosPontosControle from '../../components/pontos-controle/FiltrosPontosControle';
import styles from './PontosControle.module.css';

const getItens = (data) => {
  if (Array.isArray(data)) return data;
  return data?.data ?? data?.items ?? data?.resultados ?? data?.instrumentos ?? data?.dados ?? [];
};

function PontosControleContent() {
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(50);
  const [nrInstrumentoSelecionado, setNrInstrumentoSelecionado] = useState(null);

  const { filtros } = useFiltrosPontosControle();
  const instrumentosQuery = useInstrumentosPontosControleQuery(
    filtros,
    pagina,
    tamanhoPagina
  );

  const instrumentos = useMemo(
    () => getItens(instrumentosQuery.data),
    [instrumentosQuery.data]
  );
  const total = instrumentosQuery.data?.total ?? instrumentos.length;

  useEffect(() => {
    setPagina(1);
    setNrInstrumentoSelecionado(null);
  }, [filtros]);

  useEffect(() => {
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
          <h1>Pontos de Controle</h1>
          <p>
            Consulte um instrumento, proposta, operação, proponente ou município beneficiado.
          </p>
        </div>
      </header>

      <FiltrosPontosControle />

      <section className={styles.contentGrid}>
        <TabelaPontosControle
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

        
      </section>
    </main>
  );
}

export default function PesquisaInstrumento() {
  return (
    <FiltrosPontosControleProvider>
      <PontosControleContent />
    </FiltrosPontosControleProvider>
  );
}
