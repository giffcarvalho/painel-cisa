
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { useOpcoesPontosControleQuery } from '../../hooks/usePontosControle';
import { useFiltrosPontosControle } from '../../context/pontos-controle/useFiltrosPontosControle';
import styles from '../../pages/pontos-controle/PontosControle.module.css';

// --- Funções Auxiliares de Normalização ---

const normalizarOpcoes = (opcoes) => {
  if (!Array.isArray(opcoes)) return [];

  return opcoes
    .filter(
      (opcao) =>
        opcao !== null &&
        opcao !== undefined &&
        String(opcao).trim() !== ''
    )
    .map((opcao) => ({
      value: String(opcao),
      label: String(opcao),
    }));
};

const incluirValorSelecionado = (opcoes, valor) => {
  if (!valor) return opcoes;

  if (
    opcoes.some(
      (opcao) => String(opcao.value) === String(valor)
    )
  ) {
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
    .filter(
      (opcao) =>
        opcao &&
        opcao.cod_municipio !== null &&
        opcao.cod_municipio !== undefined &&
        String(opcao.cod_municipio).trim() !== '' &&
        opcao.municipio !== null &&
        opcao.municipio !== undefined &&
        String(opcao.municipio).trim() !== ''
    )
    .map((opcao) => ({
      value: String(opcao.cod_municipio).trim(),
      label: String(opcao.municipio).trim(),
    }));
};


const normalizarUf = (opcoes) => {
  if (!Array.isArray(opcoes)) return [];

  return opcoes
    .filter(
      (opcao) =>
        opcao &&
        opcao.cod_uf !== null &&
        opcao.cod_uf !== undefined &&
        String(opcao.cod_uf).trim() !== '' &&
        opcao.uf !== null &&
        opcao.uf !== undefined &&
        String(opcao.uf).trim() !== ''
    )
    .map((opcao) => ({
      value: String(opcao.cod_uf).trim(),
      label: String(opcao.uf).trim(),
    }));
};


const normalizarBusca = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const filtrarOpcoesPorPrefixo = (opcoes, termoBusca) => {
  const termoNormalizado = normalizarBusca(termoBusca);

  if (!termoNormalizado) return opcoes;

  return opcoes.filter((opcao) =>
    normalizarBusca(opcao.label ?? opcao.value).startsWith(
      termoNormalizado
    )
  );
};

// --- Componente Base do Select Pesquisável ---

export function SelectPesquisavel({
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
    if (!aberto) return;

    const fecharAoClicarFora = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setAberto(false);
      }
    };

    document.addEventListener('mousedown', fecharAoClicarFora);

    return () => {
      document.removeEventListener(
        'mousedown',
        fecharAoClicarFora
      );
    };
  }, [aberto]);

  const selecionarOpcao = (novoValor) => {
    onChange(novoValor);
    setAberto(false);
    setTermoBusca('');
  };

  return (
    <div
      className={styles.searchableSelect}
      ref={containerRef}
    >
      <button
        type="button"
        className={`${styles.searchableSelectTrigger} ${
          aberto
            ? styles.searchableSelectTriggerOpen
            : ''
        }`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => {
          setAberto((atual) => !atual);
          setTermoBusca('');
        }}
      >
        <span
          className={`${styles.searchableSelectValue} ${
            !opcaoSelecionada
              ? styles.searchableSelectPlaceholder
              : ''
          }`}
        >
          {opcaoSelecionada?.label || placeholder}
        </span>

        <ChevronDown
          size={14}
          className={`${styles.searchableSelectChevron} ${
            aberto
              ? styles.searchableSelectChevronOpen
              : ''
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
              placeholder="Buscar..."
              onChange={(e) =>
                setTermoBusca(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setAberto(false);
                  setTermoBusca('');
                }
              }}
            />
          </div>

          <div
            className={styles.searchableSelectOptions}
            role="listbox"
          >
            {opcoesFiltradas.length > 0 ? (
              opcoesFiltradas.map((opcao) => {
                const selecionada =
                  String(opcao.value) === String(value);

                return (
                  <button
                    type="button"
                    key={opcao.value}
                    role="option"
                    aria-selected={selecionada}
                    className={`${
                      styles.searchableSelectOption
                    } ${
                      selecionada
                        ? styles.searchableSelectOptionSelected
                        : ''
                    }`}
                    onMouseDown={(e) =>
                      e.preventDefault()
                    }
                    onClick={() =>
                      selecionarOpcao(opcao.value)
                    }
                  >
                    {selecionada ? (
                      <Check
                        size={14}
                        className={
                          styles.searchableSelectCheck
                        }
                      />
                    ) : (
                      <span
                        className={
                          styles.searchableSelectCheckPlaceholder
                        }
                      />
                    )}

                    <span>{opcao.label}</span>
                  </button>
                );
              })
            ) : (
              <div
                className={
                  styles.searchableSelectEmpty
                }
              >
                Nenhuma opção encontrada.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Componente Inteligente para uso em Linhas da Tabela ---

export default function FiltroColuna({ campo, label }) {
  const {
    filtros,
    setFiltro,
    limparFiltro,
  } = useFiltrosPontosControle();

  const {
    data,
    isLoading,
  } = useOpcoesPontosControleQuery(filtros);

  const valorAtual = filtros[campo];

  const opcoesBase = useMemo(() => {
    if (campo === 'municipios_beneficiados') {
      return normalizarMunicipiosBeneficiados(data?.[campo]);
    }

    if (campo === 'uf') {
      return normalizarUf(data?.[campo]);
    }

    return normalizarOpcoes(data?.[campo]);
  }, [campo, data]);

  const opcoes = useMemo(() => {
    return incluirValorSelecionado(
      opcoesBase,
      valorAtual
    );
  }, [opcoesBase, valorAtual]);

  return (
    <div
      className={
        styles.tableFilterHeaderCell
      }
    >
      <SelectPesquisavel
        label={label}
        value={valorAtual}
        options={opcoes}
        disabled={isLoading}
        placeholder={
          isLoading ? '...' : 'Todos'
        }
        onChange={(valor) =>
          setFiltro(campo, valor)
        }
      />

      {valorAtual && (
        <button
          type="button"
          className={
            styles.clearHeaderFilterButton
          }
          onClick={() =>
            limparFiltro(campo)
          }
          title={`Limpar filtro ${label}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}