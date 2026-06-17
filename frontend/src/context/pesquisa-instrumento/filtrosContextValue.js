export const FILTROS_INICIAIS_PESQUISA_INSTRUMENTO = {
  nome_proponente: '',
  municipios_beneficiados: '',
  nr_instrumento: '',
  nr_proposta: '',
  operacao: '',
};

export const contarFiltrosAtivosPesquisaInstrumento = (filtros = {}) =>
  Object.values(filtros).filter((valor) => String(valor ?? '').trim() !== '').length;
