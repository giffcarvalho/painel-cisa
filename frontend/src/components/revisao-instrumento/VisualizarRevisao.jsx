import { useEffect, useState } from 'react'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { revisaoInstrumentoApi } from '@/api/revisaoInstrumento'
import styles from './VisualizarRevisao.module.css'
import { baixarFichaPublicoAlvo } from './FichaPublicoAlvoPdf'
import { useAuth } from '@/context/auth/useAuth'
import ModalSolicitacaoCancelamento from './ModalSolicitacaoCancelamento'
import {
  CONFIRMACOES_OBRA as CONFIRMACOES,
  CORRECAO_SOLICITADA_PUBLICO_ALVO,
  RELACOES_OBRA as RELACOES,
  STATUS_PUBLICO_ALVO,
} from '@/utils/revisaoInstrumentoLabels'

const ACOES = {
  manter: 'Manter',
  remover: 'Remover',
  adicionar: 'Adicionar',
  corrigir: 'Corrigir',
}

function valor(value) {
  return value === null || value === undefined || value === '' ? '—' : value
}

function formatarData(value) {
  if (!value) return null
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

function formatarPopulacao(value) {
  const texto = String(value ?? '').trim()
  const numero = Number(texto.replace(/\D/g, ''))
  return /^[\d\s.,]+$/.test(texto) && Number.isFinite(numero)
    ? `${new Intl.NumberFormat('pt-BR').format(numero)} pessoas`
    : valor(value)
}

function Metadados({ item }) {
  const conferencia = formatarData(item.conferido_em)
  const validade = formatarData(item.valido_ate)
  if (!conferencia && !validade) return null
  return (
    <p className={styles.metadata}>
      {conferencia && <>Conferido em {conferencia}</>}
      {conferencia && validade && <span aria-hidden="true"> · </span>}
      {validade && <>Válido até {validade}</>}
    </p>
  )
}

function Comparacao({ label, original, revisado }) {
  const possuiRevisado = revisado !== null && revisado !== undefined && revisado !== ''
  return (
    <div className={styles.comparacao}>
      <span className={styles.label}>{label}</span>
      <div className={styles.valores}>
        <div><small>Original</small><strong>{valor(original)}</strong></div>
        <span className={styles.seta} aria-hidden="true">→</span>
        <div><small>Revisado</small><strong>{possuiRevisado ? revisado : 'Sem alteração'}</strong></div>
      </div>
    </div>
  )
}

export default function VisualizarRevisao() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { numeroInstrumento, idRevisao } = useParams()
  const [revisao, setRevisao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroPdf, setErroPdf] = useState('')
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [solicitando, setSolicitando] = useState(false)
  const [modalSolicitacao, setModalSolicitacao] = useState(false)
  const [motivoSolicitacao, setMotivoSolicitacao] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.resolve().then(() => {
      if (!ativo) return
      setCarregando(true)
      setErro('')
    })
    revisaoInstrumentoApi.buscarRevisaoEnviada(numeroInstrumento, idRevisao)
      .then((data) => {
        if (ativo) setRevisao(data)
      })
      .catch((error) => {
        if (!ativo) return
        setErro(error?.response?.data?.detail || 'Não foi possível carregar a revisão.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => { ativo = false }
  }, [idRevisao, numeroInstrumento])

  const retornar = () => navigate(`/revisao-instrumento/${encodeURIComponent(numeroInstrumento)}`)

  if (carregando) {
    return <main className={styles.state}><Loader2 className={styles.spinner} />Carregando revisão...</main>
  }

  if (erro || !revisao) {
    return (
      <main className={styles.state}>
        <p role="alert">{erro || 'Revisão não encontrada.'}</p>
        <button type="button" onClick={retornar}><ArrowLeft size={18} /> Retornar</button>
      </main>
    )
  }

  const instrumento = revisao.instrumento
  const numero = instrumento.nr_instrumento || instrumento.nr_ted || instrumento.nr_proposta
  const status = revisao.execucao?.status === 'cancelado'
    ? 'Aplicação cancelada'
    : revisao.solicitacao_cancelamento?.status === 'pendente'
      ? 'Cancelamento solicitado'
      : revisao.aplicado_em
    ? `Enviada — aplicada em ${formatarData(revisao.aplicado_em)}`
    : 'Enviada — aguardando aplicação'
  const solicitacao = revisao.solicitacao_cancelamento
  const podeSolicitar = revisao.usuario.id_usuario === usuario?.id_usuario
    && revisao.execucao?.status === 'sucesso'
    && revisao.execucao?.pode_cancelar
    && solicitacao?.status !== 'pendente'

  async function enviarSolicitacao() {
    const motivo = motivoSolicitacao.trim()
    if (!motivo || solicitando) return
    setSolicitando(true)
    setErro('')
    try {
      const criada = await revisaoInstrumentoApi.solicitarCancelamento(revisao.id_revisao, motivo)
      setRevisao((atual) => ({ ...atual, solicitacao_cancelamento: criada }))
      setModalSolicitacao(false)
      setMotivoSolicitacao('')
    } catch (error) {
      setErro(error?.response?.data?.detail || 'Não foi possível enviar a solicitação de cancelamento.')
    } finally {
      setSolicitando(false)
    }
  }

  const baixarPdf = async () => {
    setGerandoPdf(true)
    setErroPdf('')
    try {
      await baixarFichaPublicoAlvo(revisao)
    } catch {
      setErroPdf('Não foi possível gerar a ficha de revisão.')
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={retornar}>
          <ArrowLeft size={18} /> Retornar
        </button>
        <div className={styles.heading}>
          <div>
            <h1>Revisão nº {revisao.id_revisao}</h1>
            <p>Instrumento nº {valor(numero)}</p>
          </div>
          <span className={styles.status}>{status}</span>
        </div>
        <p className={styles.author}>
          Enviada por <strong>{revisao.usuario.nome}</strong>
          {revisao.enviado_em && <> em <strong>{formatarData(revisao.enviado_em)}</strong></>}
        </p>
        {instrumento.objeto && <p className={styles.object}>{instrumento.objeto}</p>}
      </header>

      {revisao.execucao?.status === 'cancelado' && <section className={`${styles.section} ${styles.cancellationState}`}>
        <h2>Aplicação cancelada</h2>
        {revisao.execucao.cancelado_em && <p>Cancelada em {formatarData(revisao.execucao.cancelado_em)}</p>}
        {revisao.execucao.usuario_cancelamento && <p>Responsável: {revisao.execucao.usuario_cancelamento}</p>}
        {revisao.execucao.motivo_cancelamento && <p>Motivo: {revisao.execucao.motivo_cancelamento}</p>}
        {solicitacao?.status === 'aprovada' && <><p>Solicitação aprovada em {formatarData(solicitacao.respondido_em)}</p>{solicitacao.observacao_resposta && <p>Observação administrativa: {solicitacao.observacao_resposta}</p>}</>}
      </section>}

      {revisao.execucao?.status !== 'cancelado' && solicitacao?.status === 'pendente' && <section className={`${styles.section} ${styles.cancellationState}`}>
        <h2>Cancelamento solicitado</h2><strong>Aguardando análise</strong>
        <p>Solicitado em {formatarData(solicitacao.solicitado_em)}</p><p>Motivo: {solicitacao.motivo_solicitacao}</p>
      </section>}

      {solicitacao?.status === 'rejeitada' && <section className={`${styles.section} ${styles.rejectedState}`}>
        <h2>Solicitação de cancelamento rejeitada</h2>
        {solicitacao.respondido_em && <p>Respondida em {formatarData(solicitacao.respondido_em)}</p>}
        {solicitacao.observacao_resposta && <p>Observação administrativa: {solicitacao.observacao_resposta}</p>}
      </section>}

      {podeSolicitar && <div className={styles.cancellationAction}><button type="button" className={styles.requestCancelButton} onClick={() => setModalSolicitacao(true)}>Solicitar cancelamento da aplicação</button></div>}

      {revisao.observacao_geral && (
        <section className={styles.section}>
          <h2>Observação geral</h2>
          <p className={styles.textBlock}>{revisao.observacao_geral}</p>
        </section>
      )}

      {revisao.publico_alvo.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Público-alvo</h2>
            <button type="button" className={styles.downloadButton} onClick={baixarPdf} disabled={gerandoPdf}>
              {gerandoPdf ? <Loader2 className={styles.spinner} size={16} /> : <Download size={16} />}
              {gerandoPdf ? 'Gerando ficha...' : 'Baixar ficha de revisão'}
            </button>
          </div>
          {erroPdf && <p className={styles.inlineError} role="alert">{erroPdf}</p>}
          <div className={styles.targetList}>
            {revisao.publico_alvo.map((item) => (
              <article className={styles.targetItem} key={item.id_revisao_publico_alvo}>
                <h3>{valor(item.nome_obra || `Projeto ${item.id_projeto_investimento}`)}</h3>
                <div className={styles.targetReviewGrid}>
                  <div className={`${styles.reviewedField} ${styles.populationField}`}>
                    <h4>População beneficiada</h4>
                    <dl>
                      <div><dt>Informação atual</dt><dd>{formatarPopulacao(item.populacao_beneficiada_original)}</dd></div>
                      <div><dt>Resultado da conferência</dt><dd><span className={`${styles.conferenceStatus} ${styles[`conference_${item.status_populacao_beneficiada || 'pending'}`]}`}>{STATUS_PUBLICO_ALVO[item.status_populacao_beneficiada] || 'Não conferida'}</span></dd></div>
                      <div><dt>Correção solicitada</dt><dd>{CORRECAO_SOLICITADA_PUBLICO_ALVO[item.status_correcao_solicitada] || 'Nenhuma alteração informada'}</dd></div>
                    </dl>
                  </div>
                  <div className={`${styles.reviewedField} ${styles.descriptionField}`}>
                    <h4>Descrição da população beneficiada</h4>
                    <dl>
                      <div><dt>Informação atual</dt><dd className={styles.longValue}>{valor(item.desc_populacao_beneficiada_original)}</dd></div>
                      <div><dt>Resultado da conferência</dt><dd><span className={`${styles.conferenceStatus} ${styles[`conference_${item.status_desc_populacao_beneficiada || 'pending'}`]}`}>{STATUS_PUBLICO_ALVO[item.status_desc_populacao_beneficiada] || 'Não conferida'}</span></dd></div>
                      <div><dt>Correção solicitada</dt><dd>{CORRECAO_SOLICITADA_PUBLICO_ALVO[item.status_correcao_solicitada] || 'Nenhuma alteração informada'}</dd></div>
                    </dl>
                  </div>
                </div>
                {item.observacao_publico_alvo && (
                  <div className={styles.targetNote}><span>Observação do público-alvo</span><p>{item.observacao_publico_alvo}</p></div>
                )}
                <Metadados item={item} />
              </article>
            ))}
          </div>
        </section>
      )}

      {revisao.municipios.length > 0 && (
        <section className={styles.section}>
          <h2>Municípios, localidades e obras</h2>
          <div className={styles.cards}>
            {revisao.municipios.map((municipio) => (
              <article className={styles.card} key={municipio.cod_municipio}>
                <div className={styles.cardHeader}>
                  <h3>{valor(municipio.nome)}{municipio.uf ? `/${municipio.uf}` : ''}</h3>
                  {municipio.acao_sugerida && <span className={styles.action}>Ação proposta: {ACOES[municipio.acao_sugerida]}</span>}
                </div>
                {municipio.justificativa && <p className={styles.textBlock}><strong>Justificativa:</strong> {municipio.justificativa}</p>}
                <Metadados item={municipio} />

                {municipio.localidades.length > 0 && (
                  <div className={styles.subsection}>
                    <h4>Localidades</h4>
                    {municipio.localidades.map((localidade) => (
                      <div className={styles.item} key={localidade.id_revisao_localidade}>
                        <div className={styles.itemTitle}>
                          <strong>{valor(localidade.nome_localidade || localidade.nome_localidade_informada)}</strong>
                          <span>{ACOES[localidade.acao_sugerida] || valor(localidade.acao_sugerida)}</span>
                        </div>
                        <p className={styles.metadata}>Origem: {localidade.origem_registro === 'adicionado_tecnico' ? 'Adicionada pelo técnico' : 'Base do instrumento'}</p>
                        <Comparacao label="Famílias beneficiadas" original={localidade.qtde_familias_ben_original} revisado={localidade.qtde_familias_ben_sugerida} />
                        {localidade.justificativa && <p className={styles.textBlock}><strong>Justificativa:</strong> {localidade.justificativa}</p>}
                        <Metadados item={localidade} />
                      </div>
                    ))}
                  </div>
                )}

                {municipio.obras_saneamento.length > 0 && (
                  <div className={styles.subsection}>
                    <h4>Obras</h4>
                    {municipio.obras_saneamento.map((obra) => (
                      <div className={styles.item} key={obra.id_revisao_obra}>
                        <div className={styles.itemTitle}><strong>{valor(obra.descricao)}</strong><span>{RELACOES[obra.relacao_instrumento]}</span></div>
                        <p><strong>Órgão:</strong> {valor(obra.orgao)}</p>
                        <p><strong>Confirmação:</strong> {CONFIRMACOES[obra.confirmacao_status] || valor(obra.confirmacao_status)}</p>
                        {obra.justificativa && <p className={styles.textBlock}><strong>Justificativa:</strong> {obra.justificativa}</p>}
                        {(obra.link_transferegov || obra.link_obrasgov) && <p className={styles.links}>{obra.link_transferegov && <a href={obra.link_transferegov} target="_blank" rel="noreferrer">Transferegov</a>}{obra.link_obrasgov && <a href={obra.link_obrasgov} target="_blank" rel="noreferrer">Obrasgov</a>}</p>}
                        <Metadados item={obra} />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {!revisao.observacao_geral && revisao.publico_alvo.length === 0 && revisao.municipios.length === 0 && (
        <section className={styles.empty}>Nenhuma alteração foi registrada nesta revisão.</section>
      )}
      {modalSolicitacao && <ModalSolicitacaoCancelamento motivo={motivoSolicitacao} processando={solicitando} onMotivo={setMotivoSolicitacao} onFechar={() => setModalSolicitacao(false)} onEnviar={enviarSolicitacao} />}
    </main>
  )
}
