import { SlidersHorizontal } from 'lucide-react'
import SecaoEtapa from './SecaoEtapa'
import styles from '../../pages/consulta-personalizada/ConsultaPersonalizada.module.css'

export default function ModelosCampos({ modelos, value, onChange, selectedCount, onAjustar }) {
  const totalSelecionado = Number(selectedCount || 0)

  return (
    <SecaoEtapa
      numero="3"
      titulo="Campos da tabela"
      descricao="Comece por um modelo de colunas e ajuste manualmente se precisar."
    >
      <div className={styles.tipoGrid}>
        {Object.entries(modelos).map(([id, modelo]) => (
          <button
            key={id}
            type="button"
            className={`${styles.tipoCard} ${value === id ? styles.tipoCardActive : ''}`}
            onClick={() => onChange(id)}
          >
            <span className={styles.tipoTitle}>{modelo.label}</span>
            <span className={styles.tipoDescription}>{modelo.descricao}</span>
          </button>
        ))}
      </div>

      {value !== 'personalizado' && totalSelecionado > 0 && (
        <div className={styles.buttonCluster} style={{ marginTop: 12, justifyContent: 'flex-start' }}>
          <button type="button" className={styles.secondaryButton} onClick={onAjustar}>
            <SlidersHorizontal size={16} />
            Ajustar campos selecionados
          </button>
        </div>
      )}
    </SecaoEtapa>
  )
}