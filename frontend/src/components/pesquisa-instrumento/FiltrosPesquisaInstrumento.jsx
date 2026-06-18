import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, RotateCcw, X } from 'lucide-react';
import { useOpcoesPesquisaInstrumentoQuery } from '../../hooks/usePesquisaInstrumento';
import { useFiltrosPesquisaInstrumento } from '../../context/pesquisa-instrumento/useFiltrosPesquisaInstrumento';
import styles from '../../pages/pesquisa-instrumento/PesquisaInstrumento.module.css';

const FILTROS = [
  {
    campo: 'nome_proponente',
    label: 'Proponente',
  },
  {
    campo: 'municipios_beneficiados',
    label: 'Município beneficiado',
  },
  {
    campo: 'nr_instrumento',
    label: 'Nº instrumento',
  },
  {
    campo: 'nr_proposta',
    label: 'Nº proposta',
  },
  {
    campo: 'operacao',
    label: 'Operação',
  },
];

const normalizarOpcoes = (opcoes) => {
  if (!Array.isArray(opcoes)) return [];

  return opcoes
    .filter((opcao) => opcao !== null && opcao !== undefined && String(opcao).trim() !== '')
    .map((opcao) => ({
      value: String(opcao),
      label: String(opcao),
    }));
};

const incluirValorSelecionado = (opcoes, valor) => {
  if (!valor) return opcoes;

  if (opcoes.some((opcao) => String(opcao.value) === String(valor))) {
    return opcoes;
  }

  return [
    {
      value: String(valor),
      label: String(valor),
    },
    ...opcoes,
  ];
};

const normalizarMunicipiosBeneficiados = (opcoes) => {
  if (!Array.isArray(opcoes)) return [];

  return opcoes
    .filter((opcao) => opcao?.municipio && opcao?.uf)
    .map((opcao) => {
      const municipio = String(opcao.municipio).trim();
      const uf = String(opcao.uf).trim();

      return {
        value: `${municipio}|${uf}`,
        label: `${municipio} - ${uf}`,
      };
    });
};

const normalizarBusca = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const filtrarOpcoesPorPrefixo = (opcoes, termoBusca) => {
  const termoNormalizado = normalizarBusca(termoBusca);
  if (!termoNormalizado) {return opcoes};
  return opcoes.filter((opcao) => normalizarBusca(opcao.label ?? opcao.value).startsWith(termoNormalizado));
};

function SelectPesquisavel({
  label,
  value,
  options,
  disabled,
  placeholder = 'Selecione...',
  onChange,
}) {
  const [aberto, setAberto] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const containerRef = useRef(null);

  const opcaoSelecionada = options.find(
    (opcao) => String(opcao.value) === String(value)
  );

  const opcoesFiltradas = useMemo(
    () => filtrarOpcoesPorPrefixo(options, termoBusca),
    [options, termoBusca]
  );

  useEffect(() => {
    if(!aberto) return;

    const fecharAoClicarFora = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setAberto(false);
      }
    };

    document.addEventListener('mousedown', fecharAoClicarFora);

    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora)
    };
  }, [aberto]);

  const selecionarOpcao = (novoValor) => {
    onChange(novoValor);
    setAberto(false);
    setTermoBusca('');
  };

  return (
    <div className={styles.searchableSelect} ref={containerRef}>
      <button type="button"
        className={`${styles.searchableSelectTrigger} ${
          aberto ? styles.searchableSelectTriggerOpen : ''
        }`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => {
          setAberto((atual) => !atual);
          setTermoBusca('');
        }}>
          <span className={`${styles.searchableSelectValue} ${
            !opcaoSelecionada ? styles.searchableSelectPlaceholder : ''
            }`}>
              {opcaoSelecionada?.label || placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`${styles.searchableSelectChevron} ${
              aberto ? styles.searchableSelectChevronOpen : ''
            }`}
          />
        </button>
        {aberto && !disabled && (
        <div className={styles.searchableSelectMenu}>
          <div className={styles.searchableSelectSearchWrap}>
            <input
              className={styles.searchableSelectSearch}
              value={termoBusca}
              autoFocus
              autoComplete="off"
              placeholder={`Buscar ${label.toLowerCase()}...`}
              onChange={(event) => setTermoBusca(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setAberto(false);
                  setTermoBusca('');
                }
              }}
            />
          </div>

          <div className={styles.searchableSelectOptions} role="listbox">
            {opcoesFiltradas.length > 0 ? (
              opcoesFiltradas.map((opcao) => {
                const selecionada = String(opcao.value) === String(value);

                return (
                  <button
                    type="button"
                    key={opcao.value}
                    role="option"
                    aria-selected={selecionada}
                    className={`${styles.searchableSelectOption} ${
                      selecionada ? styles.searchableSelectOptionSelected : ''
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selecionarOpcao(opcao.value)}
                  >
                    {selecionada ? (
                      <Check size={14} className={styles.searchableSelectCheck} />
                    ) : (
                      <span className={styles.searchableSelectCheckPlaceholder} />
                    )}

                    <span>{opcao.label}</span>
                  </button>
                );
              })
            ) : (
              <div className={styles.searchableSelectEmpty}>
                Nenhuma opção encontrada.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FiltrosPesquisaInstrumento() {
  const {
    filtros,
    filtroPrincipal,
    setFiltro,
    limparFiltro,
    limparTodosFiltros,
    totalFiltrosAtivos,
  } = useFiltrosPesquisaInstrumento();

  const { data, isLoading, isError } = useOpcoesPesquisaInstrumentoQuery(filtros);

  return (
    <section className={styles.filtersPanel} aria-label="Filtros da pesquisa instrumento">
      <header className={styles.filtersHeader}>
        <div>
          <h2>Pesquisar instrumento</h2>
          <p>Selecione um campo para iniciar a pesquisa.</p>
        </div>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={limparTodosFiltros}
          disabled={totalFiltrosAtivos === 0}
        >
          <RotateCcw size={16} />
          Limpar tudo
        </button>
      </header>

      {isError && (
        <div className={`${styles.state} ${styles.error}`}>
          Não foi possível carregar as opções dos filtros.
        </div>
      )}

      <div className={styles.filtersGrid}>
        {FILTROS.map((filtro) => {
          const opcoesBase = 
            filtro.campo === 'municipios_beneficiados'
              ? normalizarMunicipiosBeneficiados(data?.[filtro.campo])
              : normalizarOpcoes(data?.[filtro.campo]);

          const opcoes = incluirValorSelecionado (
            opcoesBase,
            filtros[filtro.campo]
          );

          const isPrincipal = filtroPrincipal === filtro.campo;

          return (
            <div key={filtro.campo} className={styles.filterField}>
              <div className={styles.filterLabelRow}>
                <label>{filtro.label}</label>

                {isPrincipal && (
                  <span className={styles.primaryFilterBadge}>Principal</span>
                )}

                {filtros[filtro.campo] && (
                  <button
                    type="button"
                    className={styles.clearFieldButton}
                    onClick={() => limparFiltro(filtro.campo)}
                    aria-label={`Limpar ${filtro.label}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <SelectPesquisavel
                label={filtro.label}
                value={filtros[filtro.campo]}
                options={opcoes}
                disabled={isLoading}
                placeholder={isLoading ? 'Carregando...' : 'Selecione...'}
                onChange={(valor) => setFiltro(filtro.campo, valor)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
