import estilos from "./DetalheSection.module.css";
import { useContext, useEffect, useState } from "react";
import { FiltrosContext } from "../../context/mapa/filtrosContext";
import { listarInvestimentoSaneamento, listarDadosMunicipios } from "../../api/mapa";
import { X } from "lucide-react";




export default function DetalheSection ({ setPainelDetalhe }) {
   
    const {filtros} = useContext(FiltrosContext);
    const [investimentos, setInvestimentos] = useState([]);
    const [dadosMunicipios, setDadosMunicipios] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        async function carregarDados() {

            if (!filtros.cod_municipio) {
                setInvestimentos([]);
                setDadosMunicipios(null);
                return;
            }

            try {
                setLoading(true);
                const [dadosInvestimentos, dadosMunicipios] = await Promise.all([
                    listarInvestimentoSaneamento({cod_municipio: filtros.cod_municipio}),
                    listarDadosMunicipios({cod_municipio: filtros.cod_municipio})
                ]);
                setInvestimentos(dadosInvestimentos);
                setDadosMunicipios(dadosMunicipios[0] || null)

            } catch (erro) {
                console.error(erro);
            } finally {
                setLoading(false);
            }
        }

        carregarDados();

    }, [filtros.cod_municipio]);


    return(
        <div className={estilos.painelDetalhes} >
            <div className={estilos.cabecalho}>
                <h1>{dadosMunicipios?.nome}</h1>
                <button
                    className={estilos.botaoX}
                    onClick={() => setPainelDetalhe(false)}>
                    <X className={estilos.XFechar} />
                </button>
            </div>
            
            <div className={estilos.informacoesGerais}>
                <p>População (2022): <strong>{dadosMunicipios?.populacao_total_censo_2022}</strong></p>
                <p>Categoria Metropolitana: <strong>{dadosMunicipios?.label_catmetropol}</strong></p>
                <p>RM prioritária: <strong>{dadosMunicipios?.rm_prioritaria}</strong></p>
                <p>Subgrupo PAC: <strong>{dadosMunicipios?.subgrupo}</strong></p>
            </div>

            {loading && <p>Carregando...</p>}

            <h2>Instrumentos de Saneamento (experimental): </h2>
            
            {investimentos.map(item => (
                <div key={item.id} className={estilos.itemInvestimento}>
                    <h3>{item.orgao}</h3>
                    <p>{item.descricao}</p>
                    {item.link_transferegov && (<a href={item.link_transferegov} target="_blank" rel="noopener noreferrer"> Transferegov </a>)}
                    {item.link_obrasgov && (<a href={item.link_obrasgov} target="_blank" rel="noopener noreferrer"> Obrasgov </a>)}
                    <br/>   
                </div>
            ))}

        </div>
    )
}