//função que associa as cores da camada
export function gerarMatch(simbologia, propriedade, valorPadrao) {

    if (!simbologia?.classes) {
        return valorPadrao;
    }

    const match = ["match", ["get", simbologia.atributo]];
    simbologia.classes.forEach(classe => {
        match.push(classe.valor);
        match.push(classe[propriedade]);
    });

    match.push(valorPadrao);
    return match;
}


//função que associa as cores da legenda
export function gerarMatchLegenda(atributo, legenda) {

    const match = ["match", ["get", atributo]];

    legenda.forEach(item => {
        match.push(item.valor);
        match.push(item.cor);
    });

    match.push("#e7e1e1");
    return match;
}


