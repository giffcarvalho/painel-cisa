import { carteiraTopics } from './manualContent'
import styles from './Manual.module.css'

export default function ManualCarteiraDsr() {
  return (
    <main className={styles.detailPage}>
      <section className={styles.contentCard}>
        <h2>Carteira DSR</h2>
        <p>
          Esta página reunirá as orientações específicas sobre a ferramenta
          Carteira DSR.
        </p>

        <div className={styles.topicGrid}>
          {carteiraTopics.map((topic) => (
            <article key={topic} className={styles.topicCard}>
              <h3>{topic}</h3>
              <p>Conteúdo em elaboração.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}