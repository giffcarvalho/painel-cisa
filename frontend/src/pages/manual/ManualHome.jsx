import { BookOpen } from 'lucide-react'
import { manualIntro } from './manualContent'
import styles from './ManualHome.module.css'
import navVideo from '../../assets/manual/navVideo.mp4'

export default function ManualHome() {
  return (
    <main className={styles.homeStack}>
      <section className={styles.helpIntro}>
        <div id="sobre-este-manual" className={styles.introBlock}>
          <BookOpen className={styles.sectionIcon} aria-hidden="true" />
          <h2>Sobre este Painel</h2>
          <p>{manualIntro.apresentacao}</p>
        </div>

        <div id="navegacao-no-painel" className={styles.introBlock}>
          <h2>Navegação no Painel</h2>
          <p>{manualIntro.navegacao}</p>
          <div className={styles.navigationDemo}>
            <video className={styles.navigationVideo}
              autoPlay
              muted
              loop
              playsInline
              aria-label="Demonstração da navegação pelo menu lateral">
                <source src={navVideo} type="video/mp4" />
                Seu navegador não suporta a reprodução de vídeo.
              </video>
              <p className="styles.videoCaption">
                Demonstração da expansão do menu lateral e do acesso aos módulos do Painel.
              </p>
          </div>
        </div>
      </section>
    </main>
  )
}
