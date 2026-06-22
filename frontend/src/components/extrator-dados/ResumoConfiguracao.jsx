import { Database } from 'lucide-react'
import styles from '../../pages/consulta-personalizada/ConsultaPersonalizada.module.css'

export default function ResumoConfiguracao({ base, filtrosAtivos, colunasSelecionadas }) {
  return (
    <div className={styles.heroSummary} aria-label="Resumo da configuração">
      <Database size={18} />
      <span>
        Base: {base}
        <br />
        Filtros: {filtrosAtivos}
      </span>
      <strong>{colunasSelecionadas} col.</strong>
    </div>
  )
}