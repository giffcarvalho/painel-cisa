import { createContext, useState, useEffect } from 'react'
import { listarMunicipios, listarUfs } from "../../api/mapa"

export const FiltrosContext = createContext();


export function FiltrosProvider({ children }) {

  const filtrosIniciais = {
    cod_municipio: "",
    cod_uf: ""
  };
  

  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [listas, setListas] = useState({
    municipios: [],
    ufs: [],
  });

  
  //esse useEffect é quem ativa as funções de listar as quais fezem fetch no banco e trazem as lista, atualizando o estado ao chamar setListas
  //só tem uf porque isso puxa a lista inteira de uma vez só. P/ listas grandes como municipios, não recomenda-se fazer isso
  useEffect(() => {

    listarUfs().then((data) => setListas((prev) => ({ ...prev, ufs: data })));

  }, []);

  
  //essa função busca a lista de municípios, mas com condição:
  //com usuário começando a digitar (esse texto digitado é q), ou UF sendo selecionada (mas não traz a lista inteira porque endpoint tem cláusula limit no sql)
  async function buscarMunicipios(q="", cod_uf = filtros.cod_uf) {
    
    const texto = String(q ?? "").trim();

    // sem UF e menos de 2 letras -> limpa
    if (!cod_uf && texto.length < 2) {
      setListas(prev => ({ ...prev, municipios: [] }));
      return;
    }

    const data = await listarMunicipios(texto, cod_uf);
    setListas(prev => ({ ...prev, municipios: data }));
    
  }




  //essa função a chamada pelo onChange dos filtros, e chama setFiltros atualizando o estado filtros
  function atualizarFiltro(nome, valor) {
    setFiltros((prev) => {
      const novos = {...prev, [nome]: valor};

      if (nome === "cod_uf") {
        novos.cod_municipio = "";
        buscarMunicipios("", valor);
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
        buscarMunicipios
      }}
    >
      {children}
    </FiltrosContext.Provider>
  );
}