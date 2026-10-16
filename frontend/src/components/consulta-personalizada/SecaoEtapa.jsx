import styles from '../../pages/consulta-personalizada/ConsultaPersonalizada.module.css'

export default function SecaoEtapa({ numero, titulo, descricao, children }) {
  return (
    <section className={styles.stepBlock}>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber}>{numero}</span>
        <div>
          <h2>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
      </div>

      {children}
    </section>
  )
}