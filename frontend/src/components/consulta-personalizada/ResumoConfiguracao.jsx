import styles from '../../pages/consulta-personalizada/ConsultaPersonalizada.module.css'

const BASE_LABELS = {
  'Por Município': 'Por município',
  'Por Setor Censitário': 'Por setor censitário',
  'Por Instrumento DSR': 'Por instrumento DSR',
}

const formatarQuantidade = (quantidade, singular, plural) =>
  `${quantidade} ${quantidade === 1 ? singular : plural}`

export default function ResumoConfiguracao({ base, filtrosAtivos, colunasSelecionadas }) {
  const baseLabel =
    BASE_LABELS[base] || (base && base !== 'Tipo de tabela' ? base : 'Base não selecionada')

  const itensResumo = [
    baseLabel,
    formatarQuantidade(filtrosAtivos, 'filtro', 'filtros'),
    formatarQuantidade(colunasSelecionadas, 'coluna', 'colunas'),
  ]

  return (
    <section className={styles.heroSummary} aria-label="Resumo da configuração atual">
      <span className={styles.configurationHeading}>Configuração Atual da Consulta</span>

      <p className={styles.configurationLine}>
        {itensResumo.map((item, index) => (
          <span key={item} className={styles.configurationText}>
            {index > 0 && <span className={styles.configurationSeparator}>|</span>}
            {item}
          </span>
        ))}
      </p>
    </section>
  )
}