import { AlertCircle, CheckCircle2, Clock3, Undo2 } from 'lucide-react'
import styles from '@/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.module.css'
import {
  CONFIRMACOES_OBRA,
  CORRECAO_SOLICITADA_PUBLICO_ALVO,
  RELACOES_OBRA,
  STATUS_PUBLICO_ALVO,
} from '@/utils/revisaoInstrumentoLabels'

function formatarData(value) {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
}

function Resumo({ titulo, valores }) {
  const rotulo = (resultado, quantidade) => {
    if (resultado === 'incorporado' && titulo === 'Público-alvo') {
      return `${quantidade} ${quantidade === 1 ? 'avaliação incorporada' : 'avaliações incorporadas'}`
    }
    if (resultado === 'incorporado' && titulo === 'Obras') {
      return `${quantidade} ${quantidade === 1 ? 'relação incorporada' : 'relações incorporadas'}`
    }
    const labels = {
      adicionado: ['item adicionado', 'itens adicionados'],
      removido: ['item removido', 'itens removidos'],
      corrigido: ['item corrigido', 'itens corrigidos'],
      ja_existente: ['item já vinculado', 'itens já vinculados'],
      ja_ausente: ['item já ausente', 'itens já ausentes'],
      ja_atualizado: ['item já atualizado', 'itens já atualizados'],
    }
    const label = labels[resultado]
    return `${quantidade} ${label ? label[quantidade === 1 ? 0 : 1] : resultado.replaceAll('_', ' ')}`
  }
  return (
    <div className={styles.resultGroup}>
      <h3>{titulo}</h3>
      {Object.keys(valores).length
        ? <ul>{Object.entries(valores).map(([resultado, quantidade]) => <li key={resultado}>{rotulo(resultado, quantidade)}</li>)}</ul>
        : <p>Nenhuma alteração efetiva.</p>}
    </div>
  )
}

const valorStatus = (labels, value) => labels[value] || 'Não conferido'
const ACOES = { adicionar: 'Adicionada', remover: 'Removida', corrigir: 'Corrigida', incorporar_avaliacao: 'Avaliação incorporada', desfazer_adicao: 'Desfazer adição', desfazer_remocao: 'Desfazer remoção', desfazer_correcao: 'Desfazer correção', desfazer_incorporacao: 'Retirar vigência da avaliação' }
const RESULTADOS = { adicionado: 'Adicionado ao instrumento', removido: 'Removido do instrumento', corrigido: 'Quantidade corrigida', ja_existente: 'Já estava vinculado — nenhuma alteração necessária', ja_ausente: 'Já estava ausente — nenhuma alteração necessária', ja_atualizado: 'Já estava atualizado — nenhuma alteração necessária', incorporado: 'Avaliação incorporada', revertido: 'Revertido com sucesso' }
const TIPOS = { termo_compromisso: 'Termo de compromisso', contrato_repasse: 'Contrato de repasse', ted: 'TED' }

function DetalheResultado({ item, index }) {
  if (item.entidade === 'publico_alvo') {
    return (
      <li key={`publico-${index}`}>
        <strong>{item.mensagem || `Projeto ${item.chave.id_projeto_investimento}`}</strong>
        <span>População: {valorStatus(STATUS_PUBLICO_ALVO, item.valores_novos?.status_populacao_beneficiada)}</span>
        <span>Descrição: {valorStatus(STATUS_PUBLICO_ALVO, item.valores_novos?.status_desc_populacao_beneficiada)}</span>
        <span>Correção solicitada: {valorStatus(CORRECAO_SOLICITADA_PUBLICO_ALVO, item.valores_novos?.status_correcao_solicitada)}</span>
        {item.valores_novos?.observacao_publico_alvo && <span>Observação: {item.valores_novos.observacao_publico_alvo}</span>}
      </li>
    )
  }
  if (item.entidade === 'obra') {
    return (
      <li key={`obra-${index}`}>
        <strong>{item.mensagem || `Obra ${item.chave.id_obra}`}</strong>
        <span>Instrumento: {TIPOS[item.chave.tipo_instrumento] || item.chave.tipo_instrumento} {item.chave.identificador_instrumento}</span>
        {item.chave.cod_municipio && <span>Município: código {item.chave.cod_municipio}</span>}
        <span>Relação: {RELACOES_OBRA[item.valores_novos?.relacao_instrumento] || item.valores_novos?.relacao_instrumento}</span>
        <span>Confirmação: {CONFIRMACOES_OBRA[item.valores_novos?.confirmacao_status] || item.valores_novos?.confirmacao_status}</span>
        {item.valores_novos?.justificativa && <span>Justificativa: {item.valores_novos.justificativa}</span>}
      </li>
    )
  }
  if (item.entidade === 'localidade') {
    return (
      <li key={`localidade-${index}`}>
        <strong>{item.mensagem || item.chave.nome_comunidade_rural || `Localidade ${item.chave.cod_comunidade_rural}`}</strong>
        {item.chave.cod_municipio && <span>Município: código {item.chave.cod_municipio}</span>}
        {item.chave.cod_comunidade_rural && <span>Código da comunidade rural: {item.chave.cod_comunidade_rural}</span>}
        <span>Ação: {ACOES[item.acao] || item.acao}</span>
        <span>Resultado: {RESULTADOS[item.resultado] || item.resultado}</span>
        {item.valores_anteriores?.qtde_familias_ben != null && <span>Famílias anteriormente: {item.valores_anteriores.qtde_familias_ben}</span>}
        {item.valores_novos?.qtde_familias_ben != null && <span>Famílias beneficiadas: {item.valores_novos.qtde_familias_ben}</span>}
        {item.valores_novos?.comunidade_criada && <span>Código criado nesta execução.</span>}
      </li>
    )
  }
  return (
    <li key={`${item.entidade}-${index}`}>
      <strong>{item.mensagem || `Município código ${item.chave.cod_municipio}`}</strong>
      <span>Ação: {ACOES[item.acao] || item.acao}</span>
      <span>Resultado: {RESULTADOS[item.resultado] || item.resultado}</span>
      {item.valores_anteriores?.vinculado != null && <span>Estado anterior: {item.valores_anteriores.vinculado ? 'Vinculado' : 'Não vinculado'}</span>}
      {item.valores_novos?.vinculado != null && <span>Estado novo: {item.valores_novos.vinculado ? 'Vinculado' : 'Não vinculado'}</span>}
    </li>
  )
}

export default function ResultadoAplicacao({ resultado, contexto = 'pendentes', validacaoCancelamento, onCancelarAplicacao, onFechar }) {
  const sucesso = resultado.status === 'sucesso'
  const cancelado = resultado.status === 'cancelado'
  const processando = resultado.status === 'em_processamento'
  const Icone = sucesso ? CheckCircle2 : cancelado ? Undo2 : processando ? Clock3 : AlertCircle
  const secoes = [
    ['Municípios', 'municipio'],
    ['Localidades', 'localidade'],
    ['Público-alvo', 'publico_alvo'],
    ['Obras', 'obra'],
  ]
  return (
    <section className={styles.resultPanel} aria-labelledby="resultado-aplicacao">
      <div className={`${styles.resultTitle} ${cancelado ? styles.resultTitleCancelled : !sucesso ? styles.resultTitleFailure : ''}`}>
        <Icone aria-hidden="true" />
        <div>
          <h2 id="resultado-aplicacao">{cancelado || sucesso ? `Execução #${resultado.id_execucao}` : processando ? 'Execução em processamento' : 'Execução encerrada com falha'}</h2>
          <p>{resultado.tipo_instrumento_label || 'Instrumento'} {resultado.identificador_instrumento} · Revisão nº {resultado.id_revisao}</p>
        </div>
      </div>
      <dl className={styles.resultMeta}>
        <div><dt>{sucesso || cancelado ? 'Aplicada em' : 'Iniciada em'}</dt><dd>{formatarData(sucesso || cancelado ? (resultado.aplicado_em || resultado.concluido_em) : resultado.iniciado_em)}</dd></div>
        <div><dt>Aplicada por</dt><dd>{resultado.administrador}</dd></div>
        <div><dt>Status</dt><dd>{cancelado ? 'Cancelado' : sucesso ? 'Sucesso' : processando ? 'Em processamento' : 'Falha'}</dd></div>
        {cancelado && <div><dt>Cancelada em</dt><dd>{formatarData(resultado.cancelado_em)}</dd></div>}
        {cancelado && <div><dt>Cancelada por</dt><dd>{resultado.administrador_cancelamento || '—'}</dd></div>}
        {cancelado && <div><dt>Motivo</dt><dd>{resultado.motivo_cancelamento || '—'}</dd></div>}
      </dl>
      {!sucesso && !cancelado && resultado.mensagem && <div className={styles.executionError} role="alert">{resultado.mensagem}</div>}
      <div className={styles.resultSummary}>
        <Resumo titulo="Municípios" valores={resultado.resumo.municipios} />
        <Resumo titulo="Localidades" valores={resultado.resumo.localidades} />
        <Resumo titulo="Público-alvo" valores={resultado.resumo.publico_alvo} />
        <Resumo titulo="Obras" valores={resultado.resumo.obras} />
      </div>
      <details className={styles.resultDetails} open={contexto === 'historico'}>
        <summary>Visualizar detalhes da execução</summary>
        {[
          ['Aplicação original', resultado.detalhes.filter((item) => !item.acao.startsWith('desfazer_'))],
          ...(cancelado ? [['Reversão do cancelamento', resultado.detalhes.filter((item) => item.acao.startsWith('desfazer_'))]] : []),
        ].map(([grupo, detalhes]) => <div className={styles.auditGroup} key={grupo}>
          <h3>{grupo}</h3>
          <div className={styles.executionSections}>
            {secoes.map(([titulo, entidade]) => {
              const itens = detalhes.filter((item) => item.entidade === entidade)
              return (
                <section key={`${grupo}-${entidade}`}>
                  <h4>{titulo}</h4>
                  {itens.length ? <ul>
                    {itens.map((item, index) => <DetalheResultado item={item} index={index} key={`${item.entidade}-${item.id_detalhe || index}`} />)}
                  </ul> : <p>Nenhum registro.</p>}
                </section>
              )
            })}
          </div>
        </div>)}
      </details>
      {contexto === 'historico' && sucesso && validacaoCancelamento && !validacaoCancelamento.pode_cancelar && (
        <div className={styles.cancelBlocked}>{validacaoCancelamento.motivo_bloqueio}</div>
      )}
      <div className={styles.resultActions}>
        <button type="button" className={styles.secondaryButton} onClick={onFechar}>{contexto === 'historico' ? 'Voltar ao histórico' : 'Voltar às pendentes'}</button>
        {contexto === 'historico' && sucesso && validacaoCancelamento?.pode_cancelar && (
          <button type="button" className={styles.dangerButton} onClick={onCancelarAplicacao}>Cancelar aplicação</button>
        )}
      </div>
    </section>
  )
}
