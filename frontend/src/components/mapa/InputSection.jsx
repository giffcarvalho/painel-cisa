import estilos from "./InputSection.module.css";
import Input from "./Input";
import { Navigation } from "lucide-react";


export default function InputSection({ coord = { lat: "", long: "" }, setCoord = () => {}, irParaCoordenada }) {

    return (
        <div className={estilos.inputSection}>
            <Input
                place_holder = "Latitude"
                value = {coord.lat}
                onChange={val => setCoord(prev => ({ ...prev, lat: val }))}
            />

            <Input
                place_holder = "Longitude"
                value = {coord.long}
                onChange={val => setCoord(prev => ({ ...prev, long: val }))}
            />

            <button className={estilos.botaoCoordenadas} onClick={() => irParaCoordenada()}> <Navigation className={estilos.IrIcon}/> </button>

            
        </div>


    )
}