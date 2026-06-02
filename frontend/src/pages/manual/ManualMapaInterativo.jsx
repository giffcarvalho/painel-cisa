import { mapaTopics } from './manualContent'
import styles from './Manual.module.css'

const topicIds = {
  'Objetivo da ferramenta': 'objetivo-da-ferramenta',
  'Navegação no mapa': 'navegacao-no-mapa',
  Filtros: 'filtros',
  Camadas: 'camadas',
  Legenda: 'legenda',
  'Interpretação dos dados': 'interpretacao-dos-dados',
}

export default function ManualMapaInterativo() {
  return (
    <main className={styles.detailPage}>
      <section className={styles.contentCard}>
        <h2>Mapa Interativo</h2>
        <p>
          Esta página reunirá as orientações específicas sobre o uso do mapa,
          suas camadas e formas de interpretação territorial.
        </p>

        <div className={styles.topicGrid}>
          {mapaTopics.map((topic) => (
            <article key={topic} id={topicIds[topic]} className={styles.topicCard}>
              <h3>{topic}</h3>
              <p>Conteúdo em elaboração.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}