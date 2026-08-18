import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { revisaoInstrumentoApi } from '@/api/revisaoInstrumento'
import styles from './VisualizarRevisao.module.css'

const ACOES = {
  manter: 'Manter',
  remover: 'Remover',
  adicionar: 'Adicionar',
  corrigir: 'Corrigir',
}

const RELACOES = {
  nao_analisada: 'Não analisada',
  sem_conflito_aparente: 'Sem conflito aparente',
  possivel_sobreposicao: 'Possível sobreposição',
}

const CONFIRMACOES = {
  nao_confirmada: 'Não confirmada',
  sem_conflito: 'Sem conflito',
  sobreposicao_confirmada: 'Sobreposição confirmada',
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
  const navigate = useNavigate()
  const { numeroInstrumento, idRevisao } = useParams()
  const [revisao, setRevisao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

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
  const status = revisao.aplicado_em
    ? `Enviada — aplicada em ${formatarData(revisao.aplicado_em)}`
    : 'Enviada — aguardando aplicação'

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

      {revisao.observacao_geral && (
        <section className={styles.section}>
          <h2>Observação geral</h2>
          <p className={styles.textBlock}>{revisao.observacao_geral}</p>
        </section>
      )}

      {revisao.publico_alvo.length > 0 && (
        <section className={styles.section}>
          <h2>Público-alvo</h2>
          <div className={styles.cards}>
            {revisao.publico_alvo.map((item) => (
              <article className={styles.card} key={item.id_revisao_publico_alvo}>
                <h3>{valor(item.nome_obra || `Projeto ${item.id_projeto_investimento}`)}</h3>
                <Comparacao label="População beneficiada" original={item.populacao_beneficiada_original} revisado={item.populacao_beneficiada_revisada} />
                <Comparacao label="Descrição" original={item.desc_populacao_beneficiada_original} revisado={item.desc_populacao_beneficiada_revisada} />
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
    </main>
  )
}
