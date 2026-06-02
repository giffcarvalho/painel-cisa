import estilos from "./FiltrosMapaSection.module.css";
import FiltroMapa from "./FiltroMapa";
import { useContext } from "react";
import { FiltrosContext } from "../../context/mapa/filtrosContext";


export default function FiltrosMapaSection() {

    const { listas } = useContext(FiltrosContext);
    
        
    return(
        <div className={estilos.secao_filtro}>
            <FiltroMapa
                nome="cod_uf"
                label="UF"
                options={listas.ufs}
                valueField="cod_uf"
                labelField="sigla_uf"
                className="filtro_pequeno"
            />

            <FiltroMapa
                nome="cod_municipio"
                label="Município"
                options={listas.municipios}
                valueField="cod_municipio"
                labelField="nome_municipio"
                className="filtro_grande"
            />

            
            <button> ☰ </button>
        </div>
    )
}