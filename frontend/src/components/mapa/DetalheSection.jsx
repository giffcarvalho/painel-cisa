import estilos from "./DetalheSection.module.css";
import { useContext, useEffect, useState } from "react";
import { FiltrosContext } from "../../context/mapa/filtrosContext";
import { listarInvestimentoSaneamento } from "../../api/mapa";
import { X } from "lucide-react";




export default function DetalheSection ({ setPainelDetalhe }) {
   
    const {filtros} = useContext(FiltrosContext);
    const [investimentos, setInvestimentos] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        async function carregarDados() {

            if (!filtros.cod_municipio) {
                setInvestimentos([]);
                return;
            }

            try {
                setLoading(true);
                const dados = await listarInvestimentoSaneamento({cod_municipio: filtros.cod_municipio});
                setInvestimentos(dados);

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
                <h1>Código do Município: {filtros.cod_municipio}</h1>
                <button
                    className={estilos.botaoX}
                    onClick={() => setPainelDetalhe(false)}>
                    <X className={estilos.XFechar} />
                </button>
            </div>
            
            <div className={estilos.informacoesGerais}>
                <p>dadasdas adasd adas </p>
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