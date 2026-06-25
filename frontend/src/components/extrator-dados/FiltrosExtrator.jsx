import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, RotateCcw, Search, X } from 'lucide-react'
import { useBuscaFiltroExtrator } from '@/hooks/useExtratorDados'
import styles from '../../pages/consulta-personalizada/ConsultaPersonalizada.module.css'
import SecaoEtapa from './SecaoEtapa'


const formatBoolean = (value) => {
  if (value === true || String(value).toLowerCase() === 'true') return 'Sim'
  if (value === false || String(value).toLowerCase() === 'false') return 'Não'
  return String(value)
}

const normalizarOpcao = (opcao) => {
  if (typeof opcao === 'object' && opcao !== null && opcao.value !== undefined) {
    return {
      value: String(opcao.value),
      label: opcao.label || String(opcao.value),
    }
  }

  return {
    value: String(opcao),
    label: formatBoolean(opcao),
  }
}

function BooleanFilter({ value = [], onChange }) {
  const current = value[0]

  return (
    <div className={styles.booleanGroup}>
      <button
        type="button"
        className={value.length === 0 ? styles.booleanActive : ''}
        onClick={() => onChange([])}
      >
        Todos
      </button>
      <button
        type="button"
        className={String(current) === 'true' ? styles.booleanActive : ''}
        onClick={() => onChange([true])}
      >
        Sim
      </button>
      <button
        type="button"
        className={String(current) === 'false' ? styles.booleanActive : ''}
        onClick={() => onChange([false])}
      >
        Não
      </button>
    </div>
  )
}

function MultiFilter({ tipoTabela, filtro, selected = [], onChange }) {
  const [open, setOpen] = useState(false)
  const [termo, setTermo] = useState('')
  const ref = useRef(null)

  const buscaQuery = useBuscaFiltroExtrator(tipoTabela, filtro.campo, termo, filtro.busca)

  useEffect(() => {
    if (!open) return

    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const opcoes = useMemo(() => {
    const origem = filtro.busca ? buscaQuery.data?.data || [] : filtro.opcoes || []

    return origem
      .filter((opcao) => opcao !== null && opcao !== undefined && String(opcao).trim() !== '')
      .map(normalizarOpcao)
  }, [buscaQuery.data, filtro.busca, filtro.opcoes])

  const opcoesFiltradas = useMemo(() => {
    if (filtro.busca) return opcoes

    const q = termo.trim().toLocaleLowerCase('pt-BR')
    if (!q) return opcoes.slice(0, 80)

    return opcoes
      .filter((opcao) => opcao.label.toLocaleLowerCase('pt-BR').includes(q))
      .slice(0, 80)
  }, [filtro.busca, opcoes, termo])

  const toggle = (valor) => {
    if (selected.includes(valor)) {
      onChange(selected.filter((item) => item !== valor))
      return
    }

    onChange([...selected, valor])
  }

  return (
    <div className={styles.multiSelect} ref={ref}>
      <button
        type="button"
        className={`${styles.multiTrigger} ${open ? styles.multiTriggerOpen : ''}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected.length ? `${selected.length} selecionado(s)` : 'Selecionar...'}</span>
        <ChevronDown className={styles.chevron} />
      </button>

      {selected.length > 0 && (
        <div className={styles.chips}>
          {selected.slice(0, 4).map((item) => (
            <button key={item} type="button" className={styles.chip} onClick={() => toggle(item)}>
              {formatBoolean(item)}
              <X size={13} />
            </button>
          ))}
          {selected.length > 4 && <span className={styles.moreChip}>+{selected.length - 4}</span>}
        </div>
      )}

      {open && (
        <div className={styles.multiMenu}>
          <div className={styles.searchWrap}>
            <Search size={15} />
            <input
              value={termo}
              autoFocus
              placeholder={filtro.busca ? 'Digite para buscar...' : 'Filtrar opções...'}
              onChange={(event) => setTermo(event.target.value)}
            />
          </div>

          {filtro.busca && termo.trim().length < 2 ? (
            <div className={styles.menuState}>Digite ao menos 2 caracteres.</div>
          ) : buscaQuery.isFetching ? (
            <div className={styles.menuState}>Buscando opções...</div>
          ) : opcoesFiltradas.length === 0 ? (
            <div className={styles.menuState}>Nenhuma opção encontrada.</div>
          ) : (
            <div className={styles.optionList}>
              {opcoesFiltradas.map((opcao) => {
                const checked = selected.includes(opcao.value)

                return (
                  <button
                    type="button"
                    key={opcao.value}
                    className={`${styles.optionItem} ${checked ? styles.optionItemSelected : ''}`}
                    onClick={() => toggle(opcao.value)}
                  >
                    <span className={styles.optionCheck}>{checked && <Check size={13} />}</span>
                    <span>{opcao.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FILTROS_PRINCIPAIS = {
  municipio: ['sigla_uf', 'cod_municipio', 'regiao', 'semiarido_2022', 'amazonia_legal', 'vale_jequetinhonha'],
  setor_censitario: ['sigla_uf', 'cod_municipio', 'regiao', 'situacao', 'situacao_detalhada', 'tipo'],
  instrumento: ['uf', 'nome_proponente', 'nr_instrumento', 'nr_proposta', 'fase_instrumento', 'situacao_contratacao', 'tipo_instrumento'],
}

function FiltroItem({ tipoTabela, filtro, value, updateFiltro }) {
  return (
    <div key={filtro.campo} className={styles.filterField}>
      <label>{filtro.label}</label>

      {filtro.tipo_dado === 'boolean' ? (
        <BooleanFilter
          value={value[filtro.campo] || []}
          onChange={(next) => updateFiltro(filtro.campo, next)}
        />
      ) : (
        <MultiFilter
          tipoTabela={tipoTabela}
          filtro={filtro}
          selected={value[filtro.campo] || []}
          onChange={(next) => updateFiltro(filtro.campo, next)}
        />
      )}
    </div>
  )
}

export default function FiltrosExtrator({
  tipoTabela,
  filtrosDisponiveis,
  value,
  onChange,
  isLoading,
  isError,
  onClear,
  avancadosAbertos,
  onToggleAvancados,
}) {
  const filtrosAtivos = Object.entries(value).filter(([, values]) => Array.isArray(values) && values.length > 0)

  const updateFiltro = (campo, nextValue) => {
    const next = { ...value }

    if (!nextValue?.length) delete next[campo]
    else next[campo] = nextValue

    onChange(next)
  }

    const getFiltroLabel = (campo) =>
      filtrosDisponiveis.find((filtro) => filtro.campo === campo)?.label || campo

    const principaisIds = FILTROS_PRINCIPAIS[tipoTabela] || []
    const filtrosPrincipais = filtrosDisponiveis.filter((filtro) => principaisIds.includes(filtro.campo))
    const filtrosAvancados = filtrosDisponiveis.filter((filtro) => !principaisIds.includes(filtro.campo))

  return (
    <SecaoEtapa
      numero="2"
      titulo="Recorte dos dados"
      descricao="Aplique filtros para delimitar o universo da tabela.">
      <div className={`${styles.buttonCluster} ${styles.filterActionCluster}`}>
        <button
          type="button"
          className={styles.ghostButton}
          disabled={filtrosAtivos.length === 0}
          onClick={onClear}
        >
          <RotateCcw size={16} />
          Limpar filtros
        </button>
      </div>

      {isLoading && <div className={styles.stateLine}>Carregando filtros...</div>}
      {isError && <div className={styles.errorBox}>Não foi possível carregar os filtros.</div>}

      {filtrosAtivos.length > 0 && (
        <div className={styles.filterSummary}>
          <span className={styles.summaryTitle}>Filtros aplicados</span>
          <div className={styles.summaryChips}>
            {filtrosAtivos.flatMap(([campo, values]) =>
              values.map((item) => (
                <button
                  key={`${campo}-${item}`}
                  type="button"
                  className={styles.summaryChip}
                  onClick={() => updateFiltro(campo, values.filter((valueItem) => valueItem !== item))}
                >
                  {getFiltroLabel(campo)}: {formatBoolean(item)}
                  <X size={13} />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {filtrosPrincipais.length > 0 && (
        <div className={styles.filtersGrid}>
          {filtrosPrincipais.map((filtro) => (
            <FiltroItem
              key={filtro.campo}
              tipoTabela={tipoTabela}
              filtro={filtro}
              value={value}
              updateFiltro={updateFiltro}
            />
          ))}
        </div>
      )}

      {filtrosAvancados.length > 0 && (
        <div className={`${styles.buttonCluster} ${styles.advancedFiltersAction}`}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={onToggleAvancados}
          >
            {avancadosAbertos ? 'Ocultar filtros avançados' : 'Mostrar filtros avançados'}
          </button>
        </div>
      )}

      {avancadosAbertos && filtrosAvancados.length > 0 && (
        <div className={styles.filtersGrid}>
          {filtrosAvancados.map((filtro) => (
            <FiltroItem
              key={filtro.campo}
              tipoTabela={tipoTabela}
              filtro={filtro}
              value={value}
              updateFiltro={updateFiltro}
            />
          ))}
        </div>
      )}

      {!isLoading && filtrosDisponiveis.length === 0 && (
        <div className={styles.emptySoft}>Nenhum filtro disponível para este tipo de tabela.</div>
      )}
    </SecaoEtapa>
  )
}