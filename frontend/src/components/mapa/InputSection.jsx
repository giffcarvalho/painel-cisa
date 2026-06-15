import estilos from "./InputSection.module.css";
import Input from "./Input";
import { Navigation, X } from "lucide-react";


export default function InputSection({ coord = { lat: "", long: "" }, setCoord = () => {}, irParaCoordenada, limparCoordenada }) {

    return (
        <form className={estilos.inputSection} onSubmit={(e) => {e.preventDefault(); irParaCoordenada();}}>
            <Input
                place_holder = "Lat"
                value = {coord.lat}
                onChange={val => setCoord(prev => ({ ...prev, lat: val }))}
            />

            <Input
                place_holder = "Long"
                value = {coord.long}
                onChange={val => setCoord(prev => ({ ...prev, long: val }))}
            />

            <button type="submit" className={estilos.botaoCoordenadas}> <Navigation className={estilos.IrIcon}/> </button>
            <button type="button" className={estilos.botaoCoordenadas} onClick={() => limparCoordenada()}> <X className={estilos.XIcon}/> </button>

            
        </form>


    )
}