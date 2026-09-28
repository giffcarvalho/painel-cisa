import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import styles from '@/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.module.css'
import {
  CONFIRMACOES_OBRA,
  CORRECAO_SOLICITADA_PUBLICO_ALVO,
  RELACOES_OBRA,
  STATUS_PUBLICO_ALVO,
} from '@/utils/revisaoInstrumentoLabels'

const ACOES_MUNICIPIO = {
  manter: 'Manter',
  remover: 'Remover',
  adicionar: 'Adicionar',
}

const ACOES_LOCALIDADE = { ...ACOES_MUNICIPIO, corrigir: 'Corrigir' }

const SITUACOES_ANALISE = [
  'Correta',
  'Município errado',
  'Local genérico - sede',
  'Local incoerente',
  'Incoerência urbano/rural',
  'Sem análise',
]

const SITUACOES_CORRECAO = ['Sim', 'Não', 'Sem necessidade']

const CAMPOS = {
  municipios: ['acao', 'justificativa'],
  localidades: ['acao', 'valor_sugerido', 'justificativa'],
  publico_alvo: [
    'status_populacao_beneficiada',
    'status_desc_populacao_beneficiada',
    'status_correcao_solicitada',
    'observacao_publico_alvo',
  ],
  obras: ['relacao_instrumento', 'confirmacao_status', 'justificativa'],
  coordenadas: ['situacao_analise', 'situacao_correcao', 'observacao_coordenada'],
}

const CONFIRMACOES_COMPATIVEIS = {
  nao_analisada: ['nao_confirmada'],
  sem_conflito_aparente: ['nao_confirmada', 'sem_conflito'],
  possivel_sobreposicao: ['nao_confirmada', 'sobreposicao_confirmada'],
}

function opcoes(labels, incluirVazio = false) {
  return (
    <>
      {incluirVazio && <option value="">Não conferido</option>}
      {Object.entries(labels).map(([valor, label]) => (
        <option key={valor} value={valor}>{label}</option>
      ))}
    </>
  )
}

function montarPayload(original, editado) {
  const payload = {}
  if ((original.revisao.observacao_geral || '') !== (editado.revisao.observacao_geral || '')) {
    payload.observacao_geral = editado.revisao.observacao_geral || null
  }

  Object.entries(CAMPOS).forEach(([secao, campos]) => {
    const originais = new Map((original[secao] || []).map((item) => [item.id_item, item]))
    const alterados = (editado[secao] || []).flatMap((item) => {
      const anterior = originais.get(item.id_item)
      const mudancas = { id_item: item.id_item }
      campos.forEach((campo) => {
        const campoApi = campo === 'valor_sugerido'
          ? 'qtde_familias_ben_sugerida'
          : campo === 'acao' ? 'acao_sugerida' : campo
        if (item[campo] !== anterior?.[campo]) mudancas[campoApi] = item[campo] ?? null
      })
      return Object.keys(mudancas).length > 1 ? [mudancas] : []
    })
    if (alterados.length) payload[secao] = alterados
  })
  return payload
}

export default function ModalEditarRevisao({ detalhe, salvando, erro, onFechar, onSalvar }) {
  const [editado, setEditado] = useState(() => JSON.parse(JSON.stringify(detalhe)))
  const payload = useMemo(() => montarPayload(detalhe, editado), [detalhe, editado])
  const possuiAlteracoes = Object.keys(payload).length > 0

  function alterarItem(secao, idItem, campo, valor) {
    setEditado((atual) => ({
      ...atual,
      [secao]: atual[secao].map((item) => (
        item.id_item === idItem ? { ...item, [campo]: valor } : item
      )),
    }))
  }

  function alterarRelacao(item, relacao) {
    const confirmacoes = CONFIRMACOES_COMPATIVEIS[relacao]
    const confirmacao = confirmacoes.includes(item.confirmacao_status)
      ? item.confirmacao_status
      : 'nao_confirmada'
    setEditado((atual) => ({
      ...atual,
      obras: atual.obras.map((obra) => obra.id_item === item.id_item
        ? { ...obra, relacao_instrumento: relacao, confirmacao_status: confirmacao }
        : obra),
    }))
  }

  return (
    <div className={styles.modalBackdrop} role="presentation">
      <section className={`${styles.modal} ${styles.editModal}`} role="dialog" aria-modal="true" aria-labelledby="editar-revisao-titulo">
        <button type="button" className={styles.closeButton} onClick={onFechar} disabled={salvando} aria-label="Fechar">
          <X aria-hidden="true" />
        </button>
        <header className={styles.editModalHeader}>
          <span className={styles.eyebrow}>Revisão nº {detalhe.revisao.id_revisao}</span>
          <h2 id="editar-revisao-titulo">Editar revisão enviada</h2>
          <p>{detalhe.revisao.tipo_instrumento_label} {detalhe.revisao.identificador_principal}. Somente os valores já registrados nesta revisão podem ser corrigidos.</p>
        </header>

        <div className={styles.editModalBody}>
          <label className={styles.editField}>
            <span>Observação geral</span>
            <textarea value={editado.revisao.observacao_geral || ''} onChange={(event) => setEditado((atual) => ({ ...atual, revisao: { ...atual.revisao, observacao_geral: event.target.value } }))} rows={3} />
          </label>

          {!!editado.municipios.length && <section className={styles.editSection}>
            <h3>Municípios</h3>
            {editado.municipios.map((item) => <article className={styles.editCard} key={item.id_item}>
              <strong>{item.municipio || item.cod_municipio}{item.uf ? `/${item.uf}` : ''}</strong>
              <div className={styles.editGrid}>
                <label className={styles.editField}><span>Ação</span><select value={item.acao || ''} onChange={(event) => alterarItem('municipios', item.id_item, 'acao', event.target.value)}>{opcoes(ACOES_MUNICIPIO)}</select></label>
                <label className={styles.editField}><span>Justificativa</span><textarea value={item.justificativa || ''} onChange={(event) => alterarItem('municipios', item.id_item, 'justificativa', event.target.value)} rows={2} /></label>
              </div>
            </article>)}
          </section>}

          {!!editado.localidades.length && <section className={styles.editSection}>
            <h3>Localidades</h3>
            {editado.localidades.map((item) => <article className={styles.editCard} key={item.id_item}>
              <strong>{item.localidade || `Comunidade ${item.cod_comunidade_rural || ''}`} — {item.municipio || item.cod_municipio}</strong>
              <div className={styles.editGrid}>
                <label className={styles.editField}><span>Ação</span><select value={item.acao || ''} onChange={(event) => alterarItem('localidades', item.id_item, 'acao', event.target.value)}>{opcoes(ACOES_LOCALIDADE)}</select></label>
                <label className={styles.editField}><span>Famílias sugeridas</span><input type="number" min="0" value={item.valor_sugerido ?? ''} onChange={(event) => alterarItem('localidades', item.id_item, 'valor_sugerido', event.target.value === '' ? null : Number(event.target.value))} /></label>
                <label className={`${styles.editField} ${styles.editFieldWide}`}><span>Justificativa</span><textarea value={item.justificativa || ''} onChange={(event) => alterarItem('localidades', item.id_item, 'justificativa', event.target.value)} rows={2} /></label>
              </div>
            </article>)}
          </section>}

          {!!editado.publico_alvo.length && <section className={styles.editSection}>
            <h3>Público-alvo</h3>
            {editado.publico_alvo.map((item) => <article className={styles.editCard} key={item.id_item}>
              <strong>Projeto {item.id_projeto_investimento}</strong>
              <div className={styles.editGrid}>
                <label className={styles.editField}><span>População</span><select value={item.status_populacao_beneficiada || ''} onChange={(event) => alterarItem('publico_alvo', item.id_item, 'status_populacao_beneficiada', event.target.value || null)}>{opcoes(STATUS_PUBLICO_ALVO, true)}</select></label>
                <label className={styles.editField}><span>Descrição</span><select value={item.status_desc_populacao_beneficiada || ''} onChange={(event) => alterarItem('publico_alvo', item.id_item, 'status_desc_populacao_beneficiada', event.target.value || null)}>{opcoes(STATUS_PUBLICO_ALVO, true)}</select></label>
                <label className={styles.editField}><span>Correção</span><select value={item.status_correcao_solicitada || ''} onChange={(event) => alterarItem('publico_alvo', item.id_item, 'status_correcao_solicitada', event.target.value || null)}>{opcoes(CORRECAO_SOLICITADA_PUBLICO_ALVO, true)}</select></label>
                <label className={styles.editField}><span>Observação</span><textarea value={item.observacao_publico_alvo || ''} onChange={(event) => alterarItem('publico_alvo', item.id_item, 'observacao_publico_alvo', event.target.value)} rows={2} /></label>
              </div>
            </article>)}
          </section>}

          {!!editado.obras.length && <section className={styles.editSection}>
            <h3>Obras</h3>
            {editado.obras.map((item) => <article className={styles.editCard} key={item.id_item}>
              <strong>Obra {item.id_obra} — {item.municipio || item.cod_municipio}{item.uf ? `/${item.uf}` : ''}</strong>
              <div className={styles.editGrid}>
                <label className={styles.editField}><span>Relação</span><select value={item.relacao_instrumento} onChange={(event) => alterarRelacao(item, event.target.value)}>{opcoes(RELACOES_OBRA)}</select></label>
                <label className={styles.editField}><span>Confirmação</span><select value={item.confirmacao_status} onChange={(event) => alterarItem('obras', item.id_item, 'confirmacao_status', event.target.value)}>{CONFIRMACOES_COMPATIVEIS[item.relacao_instrumento].map((valor) => <option value={valor} key={valor}>{CONFIRMACOES_OBRA[valor]}</option>)}</select></label>
                <label className={`${styles.editField} ${styles.editFieldWide}`}><span>Justificativa</span><textarea value={item.justificativa || ''} onChange={(event) => alterarItem('obras', item.id_item, 'justificativa', event.target.value)} rows={2} /></label>
              </div>
            </article>)}
          </section>}

          {!!editado.coordenadas.length && <section className={styles.editSection}>
            <h3>Coordenadas</h3>
            {editado.coordenadas.map((item) => <article className={styles.editCard} key={item.id_item}>
              <strong>Coordenada {item.id_coordenada} — TCI {item.cod_tci}</strong>
              <div className={styles.editGrid}>
                <label className={styles.editField}><span>Situação da análise</span><select value={item.situacao_analise} onChange={(event) => alterarItem('coordenadas', item.id_item, 'situacao_analise', event.target.value)}>{SITUACOES_ANALISE.map((valor) => <option key={valor} value={valor}>{valor}</option>)}</select></label>
                <label className={styles.editField}><span>Situação da correção</span><select value={item.situacao_correcao || ''} onChange={(event) => alterarItem('coordenadas', item.id_item, 'situacao_correcao', event.target.value || null)}><option value="">Não informada</option>{SITUACOES_CORRECAO.map((valor) => <option key={valor} value={valor}>{valor}</option>)}</select></label>
                <label className={`${styles.editField} ${styles.editFieldWide}`}><span>Observação</span><textarea value={item.observacao_coordenada || ''} onChange={(event) => alterarItem('coordenadas', item.id_item, 'observacao_coordenada', event.target.value)} rows={2} /></label>
              </div>
            </article>)}
          </section>}
        </div>

        {erro && <div className={styles.errorMessage} role="alert">{erro}</div>}
        <footer className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onFechar} disabled={salvando}>Cancelar</button>
          <button type="button" className={styles.primaryButton} onClick={() => onSalvar(payload)} disabled={salvando || !possuiAlteracoes}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </footer>
      </section>
    </div>
  )
}
