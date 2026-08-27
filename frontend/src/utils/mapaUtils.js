//função que associa as cores da camada
export function gerarMatch(atributo, legenda, propriedade, valorPadrao) {

    const match = ["match", ["get", atributo]];

    legenda.forEach(item => {
        match.push(item.valor);
        match.push(item[propriedade]);
    });

    match.push(valorPadrao);

    return match;
}



export function gerarMatchComSituacaoTemporaria(atributo, legenda, propriedade, valorPadrao) {
    
    const matchFeature = ["match", ["get", atributo]];

    legenda.forEach(item => {
        matchFeature.push(item.valor);
        matchFeature.push(item[propriedade]);
    });

    matchFeature.push(valorPadrao);

    const matchFeatureState = ["match", ["feature-state", "situacaoAnalise"]];

    legenda.forEach(item => {
        matchFeatureState.push(item.valor);
        matchFeatureState.push(item[propriedade]);
    });

    matchFeatureState.push(valorPadrao);

    return [
        "case",
        ["has", "situacaoAnalise"],
        matchFeatureState,
        matchFeature
    ];
}


export function gerarMatchSituacaoAnalise(
    atributo,
    legenda,
    propriedade,
    valorPadrao
) {
    const match = [
        "match",
        [
            "coalesce",
            ["feature-state", "situacaoAnalise"],
            ["get", atributo]
        ]
    ];

    legenda.forEach(item => {
        match.push(item.valor);
        match.push(item[propriedade]);
    });

    match.push(valorPadrao);

    return match;
}