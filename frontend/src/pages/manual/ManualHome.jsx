import { BookOpen } from 'lucide-react'
import { manualIntro } from './manualContent'
import styles from './Manual.module.css'

export default function ManualHome() {
  return (
    <main className={styles.homeStack}>
      <section className={styles.helpIntro}>
        <div id="sobre-este-manual" className={styles.introBlock}>
          <BookOpen className={styles.sectionIcon} aria-hidden="true" />
          <h2>Sobre este Portal</h2>
          <p>{manualIntro.apresentacao}</p>
        </div>

        <div id="navegacao-no-portal" className={styles.introBlock}>
          <h2>Navegação no Portal</h2>
          <p>{manualIntro.navegacao}</p>
        </div>
      </section>
    </main>
  )
}