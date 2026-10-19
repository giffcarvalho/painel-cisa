import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { revisaoInstrumentoApi } from '@/api/revisaoInstrumento'
import styles from './HistoricoRevisoes.module.css'

const LIMITE = 20
const LIMITE_COMPACTO = 5

function formatarData(value) {
  if (!value) return 'Data de envio não informada'
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return 'Data de envio não informada'
  const dia = new Intl.DateTimeFormat('pt-BR').format(data)
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)
  return `${dia} às ${hora}`
}

function numeroInstrumento(item) {
  return item.nr_instrumento || item.nr_ted || item.nr_proposta || item.identificador_busca
}

export default function HistoricoRevisoes({ escopo, embedded = false, compact = false }) {
  const navigate = useNavigate()
  const { numeroInstrumento: identificadorRota } = useParams()
  const pessoal = escopo === 'pessoal'
  const [resultado, setResultado] = useState(null)
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const listagemRef = useRef(null)
  const limiteAtual = compact ? LIMITE_COMPACTO : LIMITE

  useEffect(() => {
    // O mesmo componente atende o histórico pessoal e o de um instrumento; a
    // origem da requisição varia com o escopo, mantendo paginação compartilhada.
    let ativo = true
    Promise.resolve().then(() => {
      if (!ativo) return
      setCarregando(true)
      setErro('')
    })

    const requisicao = pessoal
      ? revisaoInstrumentoApi.buscarMinhasRevisoes({ busca: buscaAplicada, page: pagina, limit: limiteAtual })
      : revisaoInstrumentoApi.buscarHistoricoInstrumento(
        identificadorRota,
        { page: pagina, limit: limiteAtual },
      )

    requisicao
      .then((data) => {
        if (!ativo) return
        setResultado(data)
        if (compact && listagemRef.current) listagemRef.current.scrollTop = 0
      })
      .catch((error) => {
        if (ativo) setErro(error?.response?.data?.detail || 'Não foi possível carregar o histórico de revisões.')
      })
      .finally(() => { if (ativo) setCarregando(false) })

    return () => { ativo = false }
  }, [buscaAplicada, compact, identificadorRota, limiteAtual, pagina, pessoal])

  function mudarPagina(novaPagina) {
    setCarregando(true)
    setPagina(novaPagina)
  }

  function pesquisar(event) {
    // Separa o texto digitado do filtro aplicado para não consultar a cada tecla.
    event.preventDefault()
    if (pagina !== 1 || buscaAplicada !== busca.trim()) setCarregando(true)
    setPagina(1)
    setBuscaAplicada(busca.trim())
  }

  function visualizar(item) {
    navigate(
      `/revisao-instrumento/${encodeURIComponent(item.identificador_busca)}/revisoes/${item.id_revisao}`,
    )
  }

  const instrumento = resultado?.instrumento
  const numeroCabecalho = instrumento
    ? instrumento.nr_instrumento || instrumento.nr_ted || instrumento.nr_proposta
    : identificadorRota
  const vazio = !carregando && !erro && resultado?.data?.length === 0
  const mensagemVazia = buscaAplicada
    ? 'Nenhuma revisão encontrada para a busca informada.'
    : pessoal
      ? 'Você ainda não possui revisões enviadas.'
      : 'Este instrumento ainda não possui revisões enviadas.'

  const Root = embedded ? 'section' : 'main'

  return (
    <Root className={`${styles.page} ${pessoal ? styles.personalPage : ''} ${embedded ? styles.embedded : ''} ${compact ? styles.compact : ''}`}>
      <header className={styles.header}>
        {!pessoal && (
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate(`/revisao-instrumento/${encodeURIComponent(identificadorRota)}`)}
          >
            <ArrowLeft size={18} /> Retornar
          </button>
        )}
        <div className={styles.titleRow}>
          <h1>{pessoal ? (embedded ? 'Revisões enviadas' : 'Meu Painel') : 'Histórico de revisões'}</h1>
          {compact && <span className={styles.count}>{resultado?.total ?? resultado?.data?.length ?? 0}</span>}
        </div>
        <p>
          {pessoal
            ? 'Consulte as revisões de instrumento enviadas por você.'
            : `Instrumento nº ${numeroCabecalho || '—'}`}
        </p>
        {!pessoal && instrumento?.objeto && <p className={styles.object}>{instrumento.objeto}</p>}
        {pessoal && (
          <form className={styles.searchForm} onSubmit={pesquisar}>
            <label htmlFor="busca-revisoes">Buscar por nº da revisão ou nº do instrumento</label>
            <div>
              <Search size={18} aria-hidden="true" />
              <input
                id="busca-revisoes"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Ex.: 2 ou 948494"
              />
              <button type="submit">Buscar</button>
            </div>
          </form>
        )}
      </header>

      <div ref={listagemRef} className={compact ? styles.listViewport : undefined} aria-busy={carregando}>
        {carregando && (!compact || !resultado) && (
          <section className={styles.state} role="status">
            <Loader2 className={styles.spinner} /> Carregando revisões...
          </section>
        )}

        {!carregando && erro && <section className={styles.state} role="alert">{erro}</section>}
        {vazio && <section className={styles.state}>{mensagemVazia}</section>}

        {(compact || !carregando) && !erro && resultado?.data?.length > 0 && (
          <>
            {pessoal && <h2 className={styles.resultsHeading}>Revisões encontradas</h2>}
            <section className={styles.list} aria-label="Revisões enviadas">
              {resultado.data.map((item) => (
                <article className={styles.card} key={item.id_revisao}>
                  <div className={styles.cardMain}>
                    <h2>Revisão nº {item.id_revisao}</h2>
                    {pessoal && <p className={styles.instrument}>Instrumento nº {numeroInstrumento(item)}</p>}
                    {pessoal && item.objeto && <p className={styles.description}>{item.objeto}</p>}
                    {!pessoal && <p className={styles.author}>Enviada por <strong>{item.usuario.nome}</strong></p>}
                    <p className={styles.date}>Enviada em {formatarData(item.enviado_em)}</p>
                    {item.nr_processo_sei && <p className={styles.description}>Número do processo SEI: {item.nr_processo_sei}</p>}
                  </div>
                  <div className={styles.cardActions}>
                    <span className={`${styles.status} ${item.status_execucao === 'cancelado' ? styles.cancelled : item.solicitacao_cancelamento?.status === 'pendente' ? styles.requested : item.aplicado_em ? styles.applied : ''}`}>
                      {item.status_label}
                    </span>
                    {item.status_execucao === 'cancelado' && <small className={styles.statusDetail}>
                      {item.cancelado_em && <>Cancelada em {formatarData(item.cancelado_em)}</>}
                      {item.usuario_cancelamento && <> · por {item.usuario_cancelamento}</>}
                      {item.motivo_cancelamento && <> · Motivo: {item.motivo_cancelamento}</>}
                    </small>}
                    <button type="button" onClick={() => visualizar(item)}>
                      Visualizar revisão
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>

      {(compact || (!carregando && !erro && resultado?.total_paginas > 1)) && (
        <nav className={styles.pagination} aria-label="Paginação do histórico">
          <button type="button" disabled={carregando || pagina === 1} onClick={() => mudarPagina(pagina - 1)}>
            <ChevronLeft size={17} /> Anterior
          </button>
          <span>Página {pagina} de {Math.max(1, resultado?.total_paginas ?? 1)}</span>
          <button
            type="button"
            disabled={carregando || pagina >= (resultado?.total_paginas ?? 1)}
            onClick={() => mudarPagina(pagina + 1)}
          >
            Próxima <ChevronRight size={17} />
          </button>
        </nav>
      )}
    </Root>
  )
}
