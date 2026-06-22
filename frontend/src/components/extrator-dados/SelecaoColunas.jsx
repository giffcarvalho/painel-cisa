import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import styles from '../../pages/consulta-personalizada/ConsultaPersonalizada.module.css'

const DEFAULT_OPEN_GROUPS = new Set([
  'Identificação e localização',
  'Identificação do instrumento',
  'Localização',
  'Território',
])

const normalizar = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')

export default function SelecaoColunas({
  campos,
  selected,
  onChange,
  onSelectDefaults,
  onClear,
  isLoading,
  isError,
}) {
  const [openGroups, setOpenGroups] = useState({})
  const [termo, setTermo] = useState('')

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const selectedCampos = useMemo(
    () => selected.map((id) => campos.find((campo) => campo.id === id)).filter(Boolean),
    [campos, selected]
  )

  const grupos = useMemo(() => {
    const q = normalizar(termo)

    return campos.reduce((acc, campo) => {
      if (!campo.visivel) return acc
      if (q && !normalizar(`${campo.label} ${campo.grupo}`).includes(q)) return acc

      acc[campo.grupo] = acc[campo.grupo] || []
      acc[campo.grupo].push(campo)

      return acc
    }, {})
  }, [campos, termo])

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

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2>3. Colunas</h2>
          <p>{selected.length} coluna(s) selecionada(s).</p>
        </div>

        <div className={styles.buttonCluster}>
          <button type="button" className={styles.secondaryButton} onClick={onSelectDefaults}>
            Selecionar campos principais
          </button>
          <button type="button" className={styles.ghostButton} onClick={onSelectDefaults}>
            Restaurar padrão
          </button>
          <button type="button" className={styles.ghostButton} disabled={!selected.length} onClick={onClear}>
            Limpar seleção
          </button>
        </div>
      </div>

      {isLoading && <div className={styles.stateLine}>Carregando catálogo de colunas...</div>}
      {isError && <div className={styles.errorBox}>Não foi possível carregar o catálogo de colunas.</div>}

      <div className={styles.columnsToolbar}>
        <div className={styles.columnSearch}>
          <Search size={16} />
          <input
            value={termo}
            placeholder="Buscar coluna por nome ou grupo..."
            onChange={(event) => setTermo(event.target.value)}
          />
        </div>
      </div>

      {selectedCampos.length > 0 && (
        <div className={styles.selectedColumnsSummary}>
          {selectedCampos.slice(0, 12).map((campo) => (
            <button key={campo.id} type="button" onClick={() => toggleCampo(campo.id)}>
              {campo.label}
              <X size={13} />
            </button>
          ))}
          {selectedCampos.length > 12 && <span>+{selectedCampos.length - 12} coluna(s)</span>}
        </div>
      )}

      <div className={styles.groupList}>
        {Object.entries(grupos).map(([grupo, camposGrupo]) => {
          const isOpen = termo ? true : openGroups[grupo] ?? DEFAULT_OPEN_GROUPS.has(grupo)
          const selectedCount = camposGrupo.filter((campo) => selectedSet.has(campo.id)).length

          return (
            <section key={grupo} className={styles.groupBox}>
              <button
                type="button"
                className={styles.groupHeader}
                onClick={() => setOpenGroups((current) => ({ ...current, [grupo]: !isOpen }))}
              >
                <span className={styles.groupTitle}>{grupo}</span>
                <span className={styles.groupMeta}>{selectedCount}/{camposGrupo.length}</span>
                <ChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
              </button>

              {isOpen && (
                <div className={styles.groupBody}>
                  <button
                    type="button"
                    className={styles.groupAction}
                    onClick={() => toggleGrupo(camposGrupo)}
                  >
                    Selecionar grupo
                  </button>

                  <div className={styles.checkboxGrid}>
                    {camposGrupo.map((campo) => (
                      <label key={campo.id} className={styles.checkboxCard}>
                        <input
                          type="checkbox"
                          checked={selectedSet.has(campo.id)}
                          onChange={() => toggleCampo(campo.id)}
                        />
                        <span>{campo.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>

      {!isLoading && Object.keys(grupos).length === 0 && (
        <div className={styles.emptySoft}>Nenhuma coluna encontrada.</div>
      )}
    </section>
  )
}