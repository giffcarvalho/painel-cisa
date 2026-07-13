import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";


//esse hook faz apenas a criação do mapa básico com o mapa de fundo

export function useCriarMapa(mapContainerRef) {

    const mapRef = useRef(null);

    useEffect(() => {

        if (mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: {
                version: 8,
                sources: {
                    satellite: {
                        type: "raster",
                        tiles: [
                            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        ],
                        tileSize: 256,
                        attribution: "Esri"
                    }
                },
                layers: [
                    {
                        id: "satellite",
                        type: "raster",
                        source: "satellite"
                    }
                ]
            },
            center: [-47.9, -15.8],
            zoom: 3
        });

        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(new maplibregl.ScaleControl({maxWidth: 120, unit: "metric"}), "top-left");

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };

    }, []);

    return mapRef;
}