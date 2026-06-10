import estilos from './CamadasSection.module.css';


export default function CamadasSection({ layers, toggleLayer, alterarVariavel }) {

    return(
        <div className={estilos.camadas}>
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

                    {layer.variaveis && (
                        <select className={estilos.seletorVariavel}
                            value={layer.variavelSel}
                            onChange={(e) => alterarVariavel(layer.id, e.target.value)}>
                            <option value="">
                                Selecione uma variável
                            </option>
                            {layer.variaveis.map(v => (
                                <option 
                                    key={v.value} value={v.value}>
                                        {v.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            ))}
        </div>
    );
}
