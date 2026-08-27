import styles from '@/pages/revisao-instrumento/RevisaoInstrumento.module.css'

export default function Tooltip({ text, children }) {
  return (
    <span className={styles.tooltipWrapper}>
      {children}
      <span className={styles.tooltip} role="tooltip">
        {text}
      </span>
    </span>
  )
}
