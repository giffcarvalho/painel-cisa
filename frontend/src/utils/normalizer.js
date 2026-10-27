export function normalizarTexto(texto) {
    return texto
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`´'-]/g, '')
        .replace(/\s+/g, '');
}