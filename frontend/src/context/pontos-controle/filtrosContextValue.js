export const FILTROS_INICIAIS_PONTOS_CONTROLE = {
  monitor: '',
  municipios_beneficiados: '',
  nr_instrumento: '',
  uf: '',
  acao: '',
};

export const contarFiltrosAtivosPontosControle = (filtros = {}) =>
  Object.values(filtros).filter((valor) => String(valor ?? '').trim() !== '').length;
