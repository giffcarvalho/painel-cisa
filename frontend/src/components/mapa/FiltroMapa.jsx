import "./FiltroMapa.css";
import { useContext } from "react";
import { FiltrosContext } from "../../context/mapa/filtrosContext";
import Select from "react-select";

export default function FiltroMapa({ nome, label, options, valueField, labelField, className }) {

  const { filtros, atualizarFiltro, buscarMunicipios } = useContext(FiltrosContext);

  const lista = options.map((op) => ({
    value: String(op[valueField]),
    label: op[labelField]
  }));

  const valorSelecionado = lista.find(
    (op) => op.value === String(filtros[nome])
  ) || null;

  const filterOption = (option, inputValue) => {
    if (!inputValue) return true;

    return option.label
      .toLowerCase()
      .includes(inputValue.toLowerCase());
  };

  return (
    <div className={ `filtro_container ${className}`}>
      <label className="filtro_label">{label}</label>

      <Select
        classNamePrefix="filtro"
        options={lista}
        value={valorSelecionado}
        placeholder="Todos..."
        isClearable
        filterOption={filterOption}
        maxMenuHeight={200}
        onInputChange={(texto, meta) => {
          if (nome !== "cod_municipio") return;
          if (meta.action === "input-change") {buscarMunicipios(texto);}
        }}
        onChange={(op) => atualizarFiltro(nome, op ? op.value : "")}
      />

    </div>
  );
}