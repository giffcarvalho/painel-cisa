import estilos from "./Input.module.css";

export default function Input({ place_holder, value, onChange }) {
    
    return (
        <input className={estilos.input}
            type="text"
            placeholder={place_holder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}