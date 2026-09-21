import { useEffect, useMemo, useState } from 'react';
import { FiltrosPontosControleProvider } from '../../context/pontos-controle/filtrosContext';
import { useFiltrosPontosControle } from '../../context/pontos-controle/useFiltrosPontosControle';
import { useInstrumentosPontosControleQuery } from '../../hooks/usePontosControle';
import TabelaPontosControle from '../../components/pontos-controle/TabelaPontosControle';
import styles from './PontosControle.module.css';
import pontosControleApi from '../../api/pontosControle';

const getItens = (data) => {
  if (Array.isArray(data)) return data;
  return data?.data ?? data?.items ?? data?.resultados ?? data?.instrumentos ?? data?.dados ?? [];
};

function PontosControleContent() {
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(80);
  const [nrInstrumentoSelecionado, setNrInstrumentoSelecionado] = useState(null);
  const [dataDados, setDataDados] = useState(null);

  const { filtros } = useFiltrosPontosControle();
  const instrumentosQuery = useInstrumentosPontosControleQuery(
    filtros,
    pagina,
    tamanhoPagina
  );

  useEffect(() => {
    pontosControleApi.getDataDados()
      .then((res) => setDataDados(res))
      .catch((err) => console.error("Erro ao buscar data dos dados:", err));
  }, []);

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
      
            
      {<section className={styles.contentGrid}>
        <TabelaPontosControle
          data={instrumentosQuery.data}
          dataDados={dataDados}
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
      </section>}

    </main>
  );
}

export default function PontosControle() {
  return (
    <FiltrosPontosControleProvider>
      <PontosControleContent />
    </FiltrosPontosControleProvider>
  );
}
