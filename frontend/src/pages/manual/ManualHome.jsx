import { BookOpen, HelpCircle, Map, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { manualCards, manualIntro } from './manualContent'
import styles from './Manual.module.css'

const icons = {
  'Carteira DSR': Wallet,
  'Mapa Interativo': Map,
  'Informações Gerais': HelpCircle,
}

export default function ManualHome() {
  return (
    <main className={styles.homeGrid}>
      <section className={styles.introCard}>
        <BookOpen className={styles.sectionIcon} aria-hidden="true" />
        <h2>Apresentação do Portal DSR</h2>
        <p>{manualIntro.apresentacao}</p>
      </section>

      <section className={styles.introCard}>
        <h2>Como navegar pelo portal</h2>
        <p>{manualIntro.navegacao}</p>
      </section>

      <section className={styles.cardGrid} aria-label="Páginas do manual">
        {manualCards.map((card) => {
          const Icon = icons[card.title]

          return (
            <Link key={card.to} to={card.to} className={styles.navCard}>
              <Icon className={styles.cardIcon} aria-hidden="true" />
              <span>{card.title}</span>
              <p>{card.description}</p>
            </Link>
          )
        })}
      </section>
    </main>
  )
}