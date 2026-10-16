import estilos from './CamadasSection.module.css';
import { X } from "lucide-react";


export default function CamadasSection({ layers, toggleLayer, alterarVariavel, setPainelCamadas }) {
    
    return(
        <div className={estilos.camadas}>
            <div className={estilos.camadaCabecalho}>
                    <div className={estilos.titulo}>
                        <p>Camadas</p>
                    </div>
                    <button 
                        className={estilos.botaoX}
                        onClick={() => {setPainelCamadas(false)}}>
                        <X className={estilos.XFechar} />
                    </button>
            </div>
            <div className={estilos.conteudo}>
                {layers
                    .filter(layer => layer.mostrarPainel !== false)
                    .map(layer => (
                    <div key={layer.id}>

                        <label>
                            <input
                                type="checkbox"
                                checked={layer.visivel}
                                onChange={() => toggleLayer(layer.id)}/>

                            {layer.nome}
                        </label>

                                                
                        {layer.variaveis?.length > 0 && (
                            <select className={estilos.seletorVariavel}
                                value={layer.variavelSel}
                                onChange={(e) => alterarVariavel(layer.id, e.target.value)}>
                                <option value="">
                                    Selecione uma variável
                                </option>
                                {layer.variaveis.map(v => (
                                    <option 
                                        key={v.atributo} value={v.atributo}>
                                            {v.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
