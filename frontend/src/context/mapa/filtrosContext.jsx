import { createContext, useState, useEffect } from 'react'
import { listarMunicipios, listarUfs, listarNrPropostas, listarNrInstrumentos } from "../../api/mapa"

export const FiltrosContext = createContext();


export function FiltrosProvider({ children }) {

  const filtrosIniciais = {
    cod_municipio: null,
    cod_uf: null,
    nr_proposta: null,
    nr_instrumento: null,
  };
  

  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [listas, setListas] = useState({
    municipios: [],
    ufs: [],
    nrPropostas: [],
    nrInstrumentos: [],
  });

  
  //esse useEffect é quem ativa as funções de listar as quais fazem fetch no banco e trazem as lista, atualizando o estado ao chamar setListas
  //só tem uf porque isso puxa a lista inteira de uma vez só. P/ listas grandes como municipios, não recomenda-se fazer isso
  useEffect(() => {

    listarUfs().then((data) => setListas((prev) => ({ ...prev, ufs: data })));

  }, []);

  
  //essa função busca a lista de municípios, mas com condição:
  //com usuário começando a digitar (esse texto digitado é q), ou UF sendo selecionada (mas não traz a lista inteira porque endpoint tem cláusula limit no sql)
  async function buscarMunicipios(q="", cod_uf = filtros.cod_uf) {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarMunicipios(texto, cod_uf);
    setListas(prev => ({...prev, municipios: data}));
    
  }

  //esta função busca a lista de nr_propostas tendo como condição o texto digitado pelo usuário no filtro
  async function buscarNrPropostas(q="", cod_uf = filtros.cod_uf, cod_municipio = filtros.cod_municipio) {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarNrPropostas(texto, cod_uf, cod_municipio);
    setListas(prev => ({...prev, nrPropostas: data}));
  
  }


  //esta função busca a lista de nr_instrumento tendo como condição o texto digitado pelo usuário no filtro
  async function buscarNrInstrumentos(q="", cod_uf = filtros.cod_uf, cod_municipio = filtros.cod_municipio) {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarNrInstrumentos(texto, cod_uf, cod_municipio);
    setListas(prev => ({...prev, nrInstrumentos: data}));
  
  }





  //essa função a chamada pelo onChange dos filtros, e chama setFiltros atualizando o estado filtros
  function atualizarFiltro(nome, valor) {
    
    if (nome === "cod_uf") {
      buscarMunicipios("", valor);
      buscarNrPropostas("", valor, null);
      buscarNrInstrumentos("", valor, null);
    }

    if (nome === "cod_municipio") {
      buscarNrPropostas("", filtros.cod_uf, valor);
      buscarNrInstrumentos("", filtros.cod_uf, valor);
    }
    
       
    setFiltros((prev) => {const novos = {...prev, [nome]: valor};

      if (nome === "cod_uf") {
        novos.cod_municipio = null;
        novos.nr_proposta = null;
        novos.nr_instrumento = null;
      }

      if (nome === "cod_municipio") {
        novos.nr_proposta = null;
        novos.nr_instrumento = null;
      }

    return novos;
    });
  }


  //essa função limpa os filtros ao chamar setFiltros inserindo os valore em branco
  function limparFiltros() {
    setFiltros({ ...filtrosIniciais });
    setListas(prev => ({ ...prev, municipios: [] }));
  }


  return (
    <FiltrosContext.Provider
      value={{
        filtros,
        listas,
        atualizarFiltro,
        limparFiltros,
        buscarMunicipios,
        buscarNrPropostas,
        buscarNrInstrumentos,
      }}
    >
      {children}
    </FiltrosContext.Provider>
  );
}