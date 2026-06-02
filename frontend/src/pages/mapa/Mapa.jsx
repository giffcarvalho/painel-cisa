import MapaSection from "../../components/mapa/MapaSection";
import { FiltrosProvider } from "../../context/mapa/filtrosContext";


export default function Mapa() { 
    
    return ( 
        <FiltrosProvider>
            <MapaSection/>
        </FiltrosProvider>
    );
}