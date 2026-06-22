import { Building2, Check, FileText, MapPinned } from 'lucide-react'
import SecaoEtapa from './SecaoEtapa'
import styles from './ExtratorDados.module.css'

const DETAILS = {
  municipio: {
    icon: Building2,
    titulo: 'Município',
    texto: 'Tabela territorial agregada.',
    linha: '1 município',
    ideal: 'indicadores territoriais',
  },
  setor_censitario: {
    icon: MapPinned,
    titulo: 'Setor censitário',
    texto: 'Tabela detalhada por setor.',
    linha: '1 setor censitário',
    ideal: 'análises censitárias e urbano/rural',
  },
  instrumento: {
    icon: FileText,
    titulo: 'Instrumento DSR',
    texto: 'Tabela por proposta, instrumento ou registro.',
    linha: '1 instrumento/proposta/registro',
    ideal: 'acompanhamento da Carteira DSR',
  },
}

export default function TipoTabelaCards({ tipos, value, onChange, isLoading, isError }) {
  return (
    <SecaoEtapa numero="1" titulo="Escolha a base da tabela" descricao="Defina o que cada linha da tabela vai representar.">
      {isError && <div className={styles.inlineError}>Não foi possível carregar os tipos pelo backend.</div>}
      {isLoading && <div className={styles.stateLine}>Carregando tipos de tabela...</div>}

      <div className={styles.tipoGridCompact}>
        {tipos.map((tipo) => {
          const detail = DETAILS[tipo.id] || DETAILS.municipio
          const Icon = detail.icon
          const active = tipo.id === value

          return (
            <button
              key={tipo.id}
              type="button"
              className={`${styles.tipoCardCompact} ${active ? styles.tipoCardCompactActive : ''}`}
              onClick={() => onChange(tipo.id)}
            >
              <span className={styles.tipoCardTop}>
                <Icon size={18} />
                <strong>{detail.titulo}</strong>
                {active && <Check size={16} />}
              </span>

              <span className={styles.tipoCardText}>{detail.texto}</span>
              <span className={styles.tipoCardLine}>Cada linha representa: {detail.linha}</span>

              {active && (
                <span className={styles.tipoCardDetails}>
                  <span>Ideal para: {detail.ideal}</span>
                  {tipo.view && <span>Fonte principal: {tipo.view}</span>}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </SecaoEtapa>
  )
}