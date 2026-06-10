import { glossario, perguntasFrequentes } from './manualContent'
import sharedStyles from './Manual.module.css'
import styles from './ManualInformacoesGerais.module.css'

export default function ManualInformacoesGerais() {
  return (
    <main className={sharedStyles.detailPage}>
      <section className={sharedStyles.contentCard}>
        <h2>Informações Gerais</h2>

        <section id="duvidas-frequentes" className={styles.subsection}>
          <h3>Dúvidas frequentes</h3>

          {perguntasFrequentes.map((item) => (
            <article key={item.question} className={styles.textBlock}>
              <h4>{item.question}</h4>
              <p>{item.answer}</p>
            </article>
          ))}
        </section>

        <section id="glossario-basico" className={styles.subsection}>
          <h3>Glossário básico</h3>

          {glossario.map((item) => (
            <article key={item.term} className={styles.textBlock}>
              <h4>{item.term}</h4>
              <p>{item.description}</p>
            </article>
          ))}
        </section>

        <section id="orientacoes-gerais" className={styles.subsection}>
          <h3>Orientações gerais</h3>
          <div className={styles.notice}>
            As informações exibidas no portal dependem da atualização das bases
            utilizadas pelo Departamento. A data de referência deve ser confirmada
            com a área responsável.
          </div>
        </section>
      </section>
    </main>
  )
}
