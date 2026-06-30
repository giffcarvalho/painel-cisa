import { createContext, useState, useEffect } from 'react'
import { 
  listarMunicipios,
  listarUfs,
  listarNrPropostas,
  listarNrInstrumentos,
  listarCodTci,
  listarModalidade,
  listarLocalidades,
  listarLocalidadeEnderecos,
  listarCategoriasMetropolitanas
} from "../../api/mapa"


export const FiltrosContext = createContext();

export function FiltrosProvider({ children }) {

  const filtrosIniciais = {
    cod_municipio: null,
    cod_uf: null,
    nr_proposta: null,
    nr_instrumento: null,
    cod_tci: null,
    modalidade: null,
    cod_localidade: null,
    cod_dsc_localidade: null,
    cod_catmetropol: null,
    semiarido_2022: null,
    amazonia_legal: null,
    vale_jequetinhonha: null,
  };
  

  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [listas, setListas] = useState({
    municipios: [],
    ufs: [],
    nrPropostas: [],
    nrInstrumentos: [],
    codTci: [],
    modalidade: [],
    localidades: [],
    localidadeEnderecos: [],
    categoriasMetropolitanas: [],
    semiarido_2022: [{semiarido_2022:true}, {semiarido_2022:false}],
    amazonia_legal: [{amazonia_legal:true}, {amazonia_legal:false}],
    vale_jequetinhonha: [{vale_jequetinhonha:true}, {vale_jequetinhonha:false}],
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
  async function buscarNrPropostas(q="", cod_uf = filtros.cod_uf, cod_municipio = filtros.cod_municipio, nr_instrumento = filtros.nr_instrumento, cod_tci = filtros.cod_tci, modalidade = filtros.modalidade) {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarNrPropostas(texto, cod_uf, cod_municipio, nr_instrumento, cod_tci, modalidade);
    setListas(prev => ({...prev, nrPropostas: data}));
  
  }


  //esta função busca a lista de nr_instrumento tendo como condição o texto digitado pelo usuário no filtro
  async function buscarNrInstrumentos(q="", cod_uf = filtros.cod_uf, cod_municipio = filtros.cod_municipio, nr_proposta = filtros.nr_proposta, cod_tci = filtros.cod_tci, modalidade = filtros.modalidade) {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarNrInstrumentos(texto, cod_uf, cod_municipio, nr_proposta, cod_tci, modalidade);
    setListas(prev => ({...prev, nrInstrumentos: data}));
  
  }


  //esta função busca a lista de cod_tci tendo como condição o texto digitado pelo usuário no filtro
  async function buscarCodTci(q="", cod_uf = filtros.cod_uf, cod_municipio = filtros.cod_municipio, nr_instrumento = filtros.nr_instrumento, nr_proposta = filtros.nr_proposta, modalidade = filtros.modalidade) {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarCodTci(texto, cod_uf, cod_municipio, nr_instrumento, nr_proposta, modalidade);
    setListas(prev => ({...prev, codTci: data}));
  
  }


  //esta função busca a lista de modalidade tendo como condição o texto digitado pelo usuário no filtro
  async function buscarModalidade(q="", cod_uf = filtros.cod_uf, cod_municipio = filtros.cod_municipio, nr_instrumento = filtros.nr_instrumento, nr_proposta = filtros.nr_proposta, cod_tci = filtros.cod_tci) {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarModalidade(texto, cod_uf, cod_municipio, nr_instrumento, nr_proposta, cod_tci);
    setListas(prev => ({...prev, modalidade: data}));

  
  }


  //esta função busca a lista de localidade tendo como condição o texto digitado pelo usuário no filtro
  async function buscarLocalidades(q="", cod_uf = filtros.cod_uf, cod_municipio = filtros.cod_municipio) {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarLocalidades(texto, cod_uf, cod_municipio);
    setListas(prev => ({...prev, localidades: data}));
  
  }


  //esta função busca a lista de localidades dos enderecos tendo como condição o texto digitado pelo usuário no filtro
  async function buscarLocalidadeEnderecos(q="", cod_uf = filtros.cod_uf, cod_municipio = filtros.cod_municipio) {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarLocalidadeEnderecos(texto, cod_uf, cod_municipio);
    setListas(prev => ({...prev, localidadeEnderecos: data}));
  
  }


  //esta função busca a lista das categorias metropolitanas tendo como condição o texto digitado pelo usuário no filtro
  async function buscarCategoriasMetropolitanas(q="") {
    
    const texto = String(q ?? "").trim();

    if (texto.length > 0 && texto.length < 2) {
      return;
    }

    const data = await listarCategoriasMetropolitanas(texto);
    setListas(prev => ({...prev, categoriasMetropolitanas: data}));
  
  }




  //essa função a chamada pelo onChange dos filtros, e chama setFiltros atualizando o estado filtros
  function atualizarFiltro(nome, valor) {

    setFiltros(prev => {
      
      const novosFiltros = {...prev, [nome]: valor};
      
      // regras de limpeza
      if (nome === "cod_uf") {
        novosFiltros.cod_municipio = null;
        novosFiltros.nr_proposta = null;
        novosFiltros.nr_instrumento = null;
        novosFiltros.cod_tci = null;
        novosFiltros.modalidade = null;
        novosFiltros.cod_localidade = null;
        novosFiltros.cod_dsc_localidade = null;
        novosFiltros.cod_catmetropol = null;
        novosFiltros.semiarido_2022 = null;
        novosFiltros.amazonia_legal = null;
        novosFiltros.vale_jequetinhonha = null;

      }

      if (nome === "cod_municipio") {
        novosFiltros.nr_proposta = null;
        novosFiltros.nr_instrumento = null;
        novosFiltros.cod_tci = null;
        novosFiltros.modalidade = null;
        novosFiltros.cod_localidade = null;
        novosFiltros.cod_dsc_localidade = null;
        novosFiltros.semiarido_2022 = null;
        novosFiltros.amazonia_legal = null;
        novosFiltros.vale_jequetinhonha = null;
      }

      //console.log(novosFiltros.subgrupo)
      //console.log(listas.modalidade)
      //console.log(novosFiltros.cod_municipio);

      // dispara buscas usando SEMPRE o estado novo
      if (nome === "cod_uf") {

        buscarMunicipios("", novosFiltros.cod_uf);
        buscarNrPropostas("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarNrInstrumentos("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_proposta, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarCodTci("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.modalidade);
        buscarModalidade("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.cod_tci);
        buscarLocalidades("", novosFiltros.cod_uf, novosFiltros.cod_municipio);
        buscarLocalidadeEnderecos("", novosFiltros.cod_uf, novosFiltros.cod_municipio);
        buscarCategoriasMetropolitanas("", novosFiltros.cod_uf);
      }


      if (nome === "cod_municipio") {

        buscarNrPropostas("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarNrInstrumentos("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_proposta, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarCodTci("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.modalidade);
        buscarModalidade("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.cod_tci);
        buscarLocalidades("", novosFiltros.cod_uf, novosFiltros.cod_municipio);
        buscarLocalidadeEnderecos("", novosFiltros.cod_uf, novosFiltros.cod_municipio);
      }


      if (nome === "nr_proposta") {

        buscarNrInstrumentos("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_proposta, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarCodTci("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.modalidade);
        buscarModalidade("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.cod_tci);
      }


      if (nome === "nr_instrumento") {

        buscarNrPropostas("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarCodTci("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.modalidade);
        buscarModalidade("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.cod_tci);
      }


      if (nome === "cod_tci") {

        buscarNrPropostas("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarNrInstrumentos("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_proposta, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarModalidade("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.cod_tci);
      }


      if (nome === "modalidade") {

        buscarNrPropostas("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarNrInstrumentos("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_proposta, novosFiltros.cod_tci, novosFiltros.modalidade);
        buscarCodTci("", novosFiltros.cod_uf, novosFiltros.cod_municipio, novosFiltros.nr_instrumento, novosFiltros.nr_proposta, novosFiltros.modalidade);
      }

      return novosFiltros;
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
        buscarCodTci,
        buscarModalidade,
        buscarLocalidades,
        buscarLocalidadeEnderecos,
        buscarCategoriasMetropolitanas,
      }}
    >
      {children}
    </FiltrosContext.Provider>
  );
}