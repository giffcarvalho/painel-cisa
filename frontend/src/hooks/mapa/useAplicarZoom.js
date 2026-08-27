import { useEffect, useRef } from "react";
import { 
    urlBboxUfs,
    urlBboxMunicipios,
    urlBboxCarteiraDsr,
    urlBboxLocalidades,
    urlBboxEnderecos,
    urlBboxCategoriasMetropolitanas,
} from "@/api/mapa";



//esse hook faz o fly e o fitbounds até a feição filtrada

export function useAplicarZoom(mapRef, filtros) {

    const ultimaRequisicaoZoom = useRef(0);
    
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
                
        async function aplicarZoom() {
            const requestId = ++ultimaRequisicaoZoom.current;
                        
            if (!filtros.cod_uf && !filtros.cod_municipio && !filtros.nr_proposta && !filtros.nr_instrumento && !filtros.cod_tci && !filtros.cod_localidade && !filtros.cod_dsc_localidade && !filtros.cod_catmetropol) {
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                map.flyTo({ center: [-47.9, -15.8], zoom: 3 });
                return;
            }
            if (filtros.nr_proposta || filtros.nr_instrumento || filtros.cod_tci) {
                const res = await fetch(urlBboxCarteiraDsr({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, nr_proposta: filtros.nr_proposta, nr_instrumento: filtros.nr_instrumento, cod_tci: filtros.cod_tci}));
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                const { xmin, ymin, xmax, ymax } = await res.json();
                if (xmin == null) 
                    return
                if (xmin === xmax && ymin === ymax) {
                    if (requestId !== ultimaRequisicaoZoom.current)
                        return;
                    map.flyTo({center:[xmin,ymin], zoom:11})
                    return
                }
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                map.fitBounds([[xmin,ymin],[xmax,ymax]], {padding:40, maxZoom:8})
                    return
            }


            if (filtros.cod_dsc_localidade) {
                const res = await fetch(urlBboxEnderecos({cod_uf:filtros.cod_uf, cod_municipio:filtros.cod_municipio, cod_dsc_localidade:filtros.cod_dsc_localidade}));
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                const { xmin, ymin, xmax, ymax } = await res.json();
                if (xmin == null) 
                    return
                if (xmin === xmax && ymin === ymax) {
                    if (requestId !== ultimaRequisicaoZoom.current)
                        return;
                    map.flyTo({center:[xmin,ymin], zoom:14})
                    return
                }
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                map.fitBounds([[xmin,ymin],[xmax,ymax]], {padding:40, maxZoom:13})
                return
            }


            if (filtros.cod_localidade) {
                const res = await fetch(urlBboxLocalidades({cod_uf:filtros.cod_uf, cod_municipio:filtros.cod_municipio, cod_localidade:filtros.cod_localidade}));
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                const { xmin, ymin, xmax, ymax } = await res.json();
                    if (xmin == null) 
                    return
                if (xmin === xmax && ymin === ymax) {
                    if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                    map.flyTo({center:[xmin,ymin], zoom:14})
                    return
                }
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                map.fitBounds([[xmin,ymin],[xmax,ymax]], {padding:40, maxZoom:13})
                return
                
            }


            if (filtros.cod_catmetropol) {
                const res = await fetch(urlBboxCategoriasMetropolitanas({cod_catmetropol: filtros.cod_catmetropol}));
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                const { xmin, ymin, xmax, ymax } = await res.json();
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                map.fitBounds([[xmin, ymin], [xmax, ymax]], { padding: 40 });
                return
            }

        
            if (filtros.cod_municipio) {
                const res = await fetch(urlBboxMunicipios({cod_municipio: filtros.cod_municipio}));
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                const { xmin, ymin, xmax, ymax } = await res.json();
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                map.fitBounds([[xmin, ymin], [xmax, ymax]], { padding: 40 });
                return
            }

            if (filtros.cod_uf) {
                const res = await fetch(urlBboxUfs({cod_uf: filtros.cod_uf}));
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                const { xmin, ymin, xmax, ymax } = await res.json();
                if (requestId !== ultimaRequisicaoZoom.current)
                    return;
                map.fitBounds([[xmin, ymin], [xmax, ymax]], { padding: 40 });
                return
            }
        }

        if (!mapRef.current)
        return;

        aplicarZoom();

    },
    [
        filtros.cod_uf,
        filtros.cod_municipio,
        filtros.nr_proposta,
        filtros.nr_instrumento,
        filtros.cod_tci,
        filtros.cod_localidade,
        filtros.cod_dsc_localidade,
        filtros.cod_catmetropol
    ]);
}