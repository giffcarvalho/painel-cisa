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