import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import styles from '@/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.module.css'
import {
  CONFIRMACOES_OBRA,
  CORRECAO_SOLICITADA_PUBLICO_ALVO,
  RELACOES_OBRA,
  STATUS_PUBLICO_ALVO,
} from '@/utils/revisaoInstrumentoLabels'

const ACTION_LABELS = {
  adicionar: 'Adicionar', remover: 'Remover', corrigir: 'Corrigir', manter: 'Manter',
}

function ItemAlteracao({ item }) {
  const nome = item.entidade === 'municipio'
    ? `${item.municipio || item.cod_municipio}${item.uf ? ` — ${item.uf}` : ''}`
    : `${item.localidade || `Comunidade ${item.cod_comunidade_rural || ''}`} — ${item.municipio || item.cod_municipio}`
  return (
    <li className={styles.changeItem}>
      <span className={`${styles.actionBadge} ${styles[`action_${item.acao}`]}`}>
        {ACTION_LABELS[item.acao] || item.acao}
      </span>
      <span>
        <strong>{nome}</strong>
        {item.acao === 'corrigir' && (
          <small>Famílias beneficiadas: {item.valor_anterior ?? '—'} → {item.valor_sugerido ?? '—'}</small>
        )}
        {item.justificativa && <small>{item.justificativa}</small>}
      </span>
    </li>
  )
}

function Grupo({ titulo, itens }) {
  return (
    <section className={styles.changeGroup}>
      <h3>{titulo}</h3>
      {itens.length ? (
        <ul>{itens.map((item) => <ItemAlteracao key={`${item.entidade}-${item.id_item}`} item={item} />)}</ul>
      ) : <p>Nenhum registro nesta seção.</p>}
    </section>
  )
}

const labelOuPendente = (labels, valor) => labels[valor] || 'Não conferido'

function GrupoPublicoAlvo({ itens }) {
  return (
    <section className={styles.changeGroup}>
      <h3>Público-alvo</h3>
      {itens.length ? (
        <ul>{itens.map((item) => (
          <li className={`${styles.changeItem} ${styles.evaluationItem}`} key={`publico-${item.id_item}`}>
            <span>
              <strong>Projeto {item.id_projeto_investimento}</strong>
              <small>População: {labelOuPendente(STATUS_PUBLICO_ALVO, item.status_populacao_beneficiada)}</small>
              <small>Descrição: {labelOuPendente(STATUS_PUBLICO_ALVO, item.status_desc_populacao_beneficiada)}</small>
              <small>Correção: {labelOuPendente(CORRECAO_SOLICITADA_PUBLICO_ALVO, item.status_correcao_solicitada)}</small>
              {item.observacao_publico_alvo && <small>Observação: {item.observacao_publico_alvo}</small>}
            </span>
          </li>
        ))}</ul>
      ) : <p>Nenhum registro nesta seção.</p>}
    </section>
  )
}

function GrupoObras({ itens }) {
  return (
    <section className={styles.changeGroup}>
      <h3>Obras</h3>
      {itens.length ? (
        <ul>{itens.map((item) => {
          const municipio = item.municipio || item.cod_municipio
          return (
            <li className={`${styles.changeItem} ${styles.evaluationItem}`} key={`obra-${item.id_item}`}>
              <span>
                <strong>Obra {item.id_obra}</strong>
                <small>Município: {municipio}{item.uf ? `/${item.uf}` : ''}</small>
                <small>Relação: {RELACOES_OBRA[item.relacao_instrumento] || item.relacao_instrumento}</small>
                <small>Confirmação: {CONFIRMACOES_OBRA[item.confirmacao_status] || item.confirmacao_status}</small>
                {item.justificativa && <small>Justificativa: {item.justificativa}</small>}
              </span>
            </li>
          )
        })}</ul>
      ) : <p>Nenhum registro nesta seção.</p>}
    </section>
  )
}

export default function DetalhesRevisao({ detalhe, onAplicar }) {
  const { revisao, validacao } = detalhe
  return (
    <div className={styles.detailContent}>
      <div className={styles.detailHeader}>
        <div>
          <span className={styles.eyebrow}>Revisão nº {revisao.id_revisao}</span>
          <h2>{revisao.tipo_instrumento_label} {revisao.identificador_principal}</h2>
          <p>Responsável técnico: {revisao.tecnico_responsavel}</p>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!validacao.aplicavel}
          onClick={onAplicar}
        >
          Aplicar revisão
        </button>
      </div>

      <div className={`${styles.validation} ${validacao.aplicavel ? styles.validationOk : styles.validationBlocked}`}>
        {validacao.aplicavel ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
        <div>
          <strong>{validacao.aplicavel ? 'Pronta para aplicação' : 'Não pode ser aplicada'}</strong>
          {validacao.pendencias.map((item) => <p key={item}>{item}</p>)}
          {validacao.avisos.map((item) => <p key={item}>{item}</p>)}
        </div>
      </div>

      {revisao.observacao_geral && (
        <div className={styles.observation}>
          <strong>Observação geral</strong>
          <p>{revisao.observacao_geral}</p>
        </div>
      )}

      <div className={styles.changeColumns}>
        <Grupo titulo="Municípios" itens={detalhe.municipios} />
        <Grupo titulo="Localidades" itens={detalhe.localidades} />
        <GrupoPublicoAlvo itens={detalhe.publico_alvo} />
        <GrupoObras itens={detalhe.obras} />
      </div>
    </div>
  )
}
