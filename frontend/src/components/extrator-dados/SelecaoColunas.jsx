import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import styles from '../../pages/consulta-personalizada/ConsultaPersonalizada.module.css'


const TIPO_DADO_LABEL = {
  text: 'Texto',
  integer: 'Número inteiro',
  decimal: 'Número decimal',
  currency: 'Valor monetário',
  percent: 'Percentual',
  date: 'Data',
  boolean: 'Sim/Não',
}

const normalizar = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')

const getCampoLabel = (campo) => campo.label || campo.column || campo.id

const getTipoDadoLabel = (tipoDado) => TIPO_DADO_LABEL[tipoDado] || 'Texto'

const getPapelCampo = (campo) => {
  const column = normalizar(campo.column)

  if (column.startsWith('cod_') || column.startsWith('nr_') || column.startsWith('ano_')) {
    return 'Dimensão'
  }

  if (['currency', 'percent', 'decimal', 'integer'].includes(campo.tipo_dado)) {
    return 'Métrica'
  }

  return 'Dimensão'
}

export default function SelecaoColunas({
  tipoTabela,
  campos,
  selected,
  onChange,
  onSelectDefaults,
  onClear,
  isLoading,
  isError,
  maxColumns = 80,
}) {
  const [openGroups, setOpenGroups] = useState({})
  const [termo, setTermo] = useState('')

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const camposVisiveis = useMemo(
    () => campos.filter((campo) => campo.visivel),
    [campos]
  )

  const selectedCampos = useMemo(
    () => selected.map((id) => campos.find((campo) => campo.id === id)).filter(Boolean),
    [campos, selected]
  )

  const grupos = useMemo(() => {
    const q = normalizar(termo)

    const agrupados = camposVisiveis.reduce((acc, campo) => {
      const textoBusca = normalizar(
        `${campo.label} ${campo.column} ${campo.grupo} ${campo.descricao}`
      )

      if (q && !textoBusca.includes(q)) return acc

      if (!campo.grupo) return acc

      const grupo = campo.grupo

      acc[grupo] = acc[grupo] || []
      acc[grupo].push(campo)

      return acc
      }, {})

      return Object.entries(agrupados)

  }, [camposVisiveis, termo])

  const toggleCampo = (id) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((item) => item !== id))
      return
    }

    onChange([...selected, id])
  }

  const toggleGrupo = (camposGrupo) => {
    const ids = camposGrupo.map((campo) => campo.id)
    const allSelected = ids.every((id) => selectedSet.has(id))

    if (allSelected) {
      onChange(selected.filter((id) => !ids.includes(id)))
      return
    }

    onChange(Array.from(new Set([...selected, ...ids])))
  }

  const acimaDoLimite = selected.length > maxColumns

  return (
    <section className={`${styles.panel} ${styles.selectionPanel}`}>
      <div className={styles.panelHeader}>
        <div>
          <h2>Seleção de colunas</h2>
          <p>
            Escolha as dimensões e métricas que formarão a tabela personalizada.
          </p>
        </div>

        <div className={styles.selectionCounter}>
          <strong>{selected.length}</strong>
          <span>de {maxColumns} colunas</span>
        </div>
      </div>

      {isLoading && <div className={styles.stateLine}>Carregando catálogo de colunas...</div>}
      {isError && <div className={styles.errorBox}>Não foi possível carregar o catálogo de colunas.</div>}

      <div className={styles.columnsToolbar}>
        <div className={styles.columnSearch}>
          <Search size={16} />
          <input
            value={termo}
            placeholder="Buscar por label, nome técnico ou grupo..."
            onChange={(event) => setTermo(event.target.value)}
          />
        </div>

        <div className={styles.buttonCluster}>
          <button type="button" className={styles.secondaryButton} onClick={onSelectDefaults}>
            Selecionar campos principais
          </button>
          <button type="button" className={styles.ghostButton} disabled={!selected.length} onClick={onClear}>
            Limpar seleção
          </button>
        </div>
      </div>

      {acimaDoLimite && (
        <div className={styles.inlineWarning}>
          O backend aceita no máximo {maxColumns} colunas por consulta. Remova {selected.length - maxColumns}
          {' '}coluna(s) para gerar a prévia.
        </div>
      )}

      <div className={styles.selectedSummaryBox}>
        <span className={styles.summaryTitle}>Resumo da seleção</span>

        {selectedCampos.length > 0 ? (
          <div className={styles.selectedColumnsSummary}>
            {selectedCampos.slice(0, 16).map((campo) => (
              <button key={campo.id} type="button" onClick={() => toggleCampo(campo.id)}>
                {getCampoLabel(campo)}
                <X size={13} />
              </button>
            ))}
            {selectedCampos.length > 16 && <span>+{selectedCampos.length - 16} coluna(s)</span>}
          </div>
        ) : (
          <p className={styles.emptySummary}>Nenhuma coluna selecionada.</p>
        )}
      </div>

      <div className={styles.groupList}>
        {grupos.map(([grupo, camposGrupo]) => {
          const isOpen = termo ? true : Boolean(openGroups[grupo])
          const selectedCount = camposGrupo.filter((campo) => selectedSet.has(campo.id)).length
          const allSelected = selectedCount === camposGrupo.length

          return (
            <section
              key={grupo}
              className={`${styles.groupBox} ${isOpen ? styles.groupBoxOpen : ''}`}
            >
              <button
                type="button"
                className={styles.groupHeader}
                onClick={() => setOpenGroups((current) => ({ ...current, [grupo]: !isOpen }))}
              >
                <span className={styles.groupTitle}>{grupo}</span>
                <span
                  className={`${styles.groupMeta} ${
                    selectedCount > 0 ? styles.groupMetaSelected : ''
                  }`}
                >
                  {selectedCount}/{camposGrupo.length}
                </span>
                <ChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
              </button>

              {isOpen && (
                <div className={styles.groupBody}>
                  <button
                    type="button"
                    className={styles.groupAction}
                    onClick={() => toggleGrupo(camposGrupo)}
                  >
                    {allSelected ? 'Limpar grupo' : 'Selecionar grupo'}
                  </button>

                  <div className={styles.checkboxGrid}>
                    {camposGrupo.map((campo) => {
                      const checked = selectedSet.has(campo.id)
                      const papel = getPapelCampo(campo)

                      return (
                        <label
                          key={campo.id}
                          className={`${styles.checkboxCard} ${checked ? styles.checkboxCardSelected : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCampo(campo.id)}
                          />

                          <span className={styles.checkboxContent}>
                            <span className={styles.checkboxTitleRow}>
                              <strong>{getCampoLabel(campo)}</strong>
                              <span className={styles.fieldBadge}>{papel}</span>
                              <span className={styles.fieldType}>{getTipoDadoLabel(campo.tipo_dado)}</span>
                            </span>

                            {campo.descricao && (
                              <span className={styles.checkboxDescription}>{campo.descricao}</span>
                            )}

                            {!campo.label && campo.column && (
                              <span className={styles.checkboxDescription}>{campo.column}</span>
                            )}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>

      {!isLoading && grupos.length === 0 && (
        <div className={styles.emptySoft}>
          {!tipoTabela
            ? 'Escolha uma base da tabela para carregar as colunas disponíveis.'
            : 'Nenhuma coluna encontrada para esse termo.'}
        </div>
      )}
    </section>
  )
}