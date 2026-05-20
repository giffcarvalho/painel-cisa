import estilos from "./MapaSection.module.css";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapaSection() { 
    
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    
    useEffect(() => {
        if (mapRef.current) return;

        const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
            version: 8,
            sources: {
            satellite: {type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "Esri"},
            labels: {type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"], tileSize: 256},
            },
            layers: [
            {id: "satellite", type: "raster", source: "satellite"},
            {id: "labels", type: "raster", source: "labels"}
            ]
        },
        center: [-47.9, -15.8], // Brasília
        zoom: 3
        });
        
        mapRef.current = map;

    }, []);
    
    
    
    return ( 
        <div className={estilos.mapa_box}>
            <button className={estilos.botaoFiltros}> ☰ </button>
            <button className={estilos.botaoCamadas}> ☰ </button>
            <div ref={mapContainer} className={estilos.mapContainer}/>
        </div>
    );
}