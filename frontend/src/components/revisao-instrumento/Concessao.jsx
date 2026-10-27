import { ANEXOS_CONCESSAO } from '@/utils/concessao'
import styles from './Concessao.module.css'

const CAMPOS_CGML = [
  ['Tipo', 'tipo_operacao'], ['Situação', 'situacao_concessao'],
  ['Serviços', 'servico_delegado'], ['Abrangência', 'abrangencia'],
  ['Prestador', 'nome_prestador'],
]

export function ConcessaoMunicipio({ dados }) {
  return (
    <section className={styles.municipio} aria-label="Concessão do município">
      <h3>Concessão</h3>
      <p className={styles.auxiliar}>Situação da prestação de acordo com dados CGML</p>
      {dados ? (
        <dl className={styles.dadosCgml}>
          {CAMPOS_CGML.map(([rotulo, campo]) => (
            <div key={campo}><dt>{rotulo}</dt><dd>{dados[campo]?.trim() ? dados[campo] : '-'}</dd></div>
          ))}
        </dl>
      ) : <p className={styles.auxiliar}>Nenhuma informação de concessão disponível na base CGML.</p>}
    </section>
  )
}

export function ConcessaoResumo({ dados }) {
  return (
    <div className={styles.resumo}>
      <p>Foi confirmado que o escopo do instrumento é de responsabilidade privada? <strong>{dados?.responsabilidade_privada === 'sim' ? 'Sim' : dados?.responsabilidade_privada === 'nao' ? 'Não' : 'Não respondido'}</strong></p>
      {dados?.observacao_concessao && <p><strong>Observação sobre a concessão:</strong> {dados.observacao_concessao}</p>}
      {dados?.responsabilidade_privada === 'sim' && <>
        <h3>Documentação da concessão</h3>
        <dl className={styles.anexos}>
          {ANEXOS_CONCESSAO.map(([campo, titulo]) => (
            <div key={campo}><dt>{titulo}</dt><dd>{dados[campo] === true ? 'Entregue' : dados[campo] === false ? 'Não entregue' : 'Não respondido'}</dd></div>
          ))}
        </dl>
        {dados.observacao_anexos && <p><strong>Observação sobre os anexos:</strong> {dados.observacao_anexos}</p>}
      </>}
    </div>
  )
}
