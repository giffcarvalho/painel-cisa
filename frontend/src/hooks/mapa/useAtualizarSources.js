import { useEffect } from "react";
import { 
    urlDistritos2022,
    urlEnderecos2022,
    urlCidades,
    urlLocalidades2022,
    urlMunicipios2022,
    urlSetoresCensitarios2022,
    urlUfs,
    urlGeometriasCarteiraDsr,
    urlGeometriasCarteiraDrf,
} from "@/api/mapa";



//esse hook faz a atualização das sources a medida que o usuário atualiza os filtros

export function useAtualizarSources(mapRef, filtros) {
    
    const atualizarSource = (sourceId, url) => {
        const map = mapRef.current;
        if (!map) return;
        const source = map.getSource(sourceId);
        if (!source) return;
        source.setTiles([url]);
    };

    useEffect(()=>{
        atualizarSource("ufs", urlUfs({cod_uf: filtros.cod_uf}))
    }, [filtros.cod_uf]);

    useEffect(()=>{
        atualizarSource("municipios_2022", urlMunicipios2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
        atualizarSource("cidades", urlCidades({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
        atualizarSource("distritos_2022", urlDistritos2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
        atualizarSource("setores_censitarios_2022", urlSetoresCensitarios2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.cod_catmetropol, filtros.semiarido_2022, filtros.amazonia_legal, filtros.vale_jequetinhonha]);
    
    useEffect(()=>{
        atualizarSource("localidades_2022", urlLocalidades2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_localidade: filtros.cod_localidade, cod_catmetropol: filtros.cod_catmetropol}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.cod_localidade, filtros.cod_catmetropol]);

    useEffect(()=>{
        atualizarSource("enderecos_2022", urlEnderecos2022({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, cod_dsc_localidade: filtros.cod_dsc_localidade, cod_catmetropol: filtros.cod_catmetropol}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.cod_dsc_localidade, filtros.cod_catmetropol]);

    useEffect(()=>{
        atualizarSource("geometrias_carteira_dsr", urlGeometriasCarteiraDsr({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, nr_proposta: filtros.nr_proposta, nr_instrumento: filtros.nr_instrumento, cod_tci: filtros.cod_tci, modalidade: filtros.modalidade, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
        atualizarSource("geometrias_carteira_drf", urlGeometriasCarteiraDrf({cod_uf: filtros.cod_uf, cod_municipio: filtros.cod_municipio, nr_proposta: filtros.nr_proposta, nr_instrumento: filtros.nr_instrumento, cod_tci: filtros.cod_tci, modalidade: filtros.modalidade, cod_catmetropol: filtros.cod_catmetropol, semiarido_2022: filtros.semiarido_2022, amazonia_legal: filtros.amazonia_legal, vale_jequetinhonha: filtros.vale_jequetinhonha}))
    }, [filtros.cod_uf, filtros.cod_municipio, filtros.nr_proposta, filtros.nr_instrumento, filtros.cod_tci, filtros.modalidade, filtros.cod_catmetropol, filtros.semiarido_2022, filtros.amazonia_legal, filtros.vale_jequetinhonha]);
}