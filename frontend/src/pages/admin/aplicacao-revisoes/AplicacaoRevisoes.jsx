import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { aplicacaoRevisoesApi } from '@/api/aplicacaoRevisoes'
import DetalhesRevisao from '@/components/aplicacao-revisoes/DetalhesRevisao'
import HistoricoAplicacoes from '@/components/aplicacao-revisoes/HistoricoAplicacoes'
import ListaRevisoesPendentes from '@/components/aplicacao-revisoes/ListaRevisoesPendentes'
import ModalConfirmacaoAplicacao from '@/components/aplicacao-revisoes/ModalConfirmacaoAplicacao'
import ModalCancelamentoAplicacao from '@/components/aplicacao-revisoes/ModalCancelamentoAplicacao'
import ResultadoAplicacao from '@/components/aplicacao-revisoes/ResultadoAplicacao'
import SolicitacoesCancelamento from '@/components/aplicacao-revisoes/SolicitacoesCancelamento'
import styles from './AplicacaoRevisoes.module.css'

function mensagemErro(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (detail?.pendencias?.length) return detail.pendencias.join(' ')
  return detail?.mensagem || 'Não foi possível concluir a operação.'
}

export default function AplicacaoRevisoes() {
  const [revisoes, setRevisoes] = useState([])
  const [selecionada, setSelecionada] = useState(null)
  const [detalhe, setDetalhe] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)
  const [aba, setAba] = useState('pendentes')
  const [contextoResultado, setContextoResultado] = useState('pendentes')
  const [historico, setHistorico] = useState({ data: [], page: 1, page_size: 10, total: 0, total_pages: 0 })
  const [filtrosHistorico, setFiltrosHistorico] = useState({ busca: '', status: '' })
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [validacaoCancelamento, setValidacaoCancelamento] = useState(null)
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)
  const [processandoCancelamento, setProcessandoCancelamento] = useState(false)
  const [solicitacoes, setSolicitacoes] = useState({ data: [], page: 1, page_size: 20, total: 0, total_pages: 0 })
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(false)

  const carregarPendentes = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const data = await aplicacaoRevisoesApi.listarPendentes()
      setRevisoes(data.data || [])
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setCarregando(false)
    }
  }, [])

  const carregarHistorico = useCallback(async (page = 1, filtros = filtrosHistorico) => {
    setCarregandoHistorico(true)
    setErro('')
    try {
      setHistorico(await aplicacaoRevisoesApi.listarHistorico({ page, pageSize: 10, ...filtros }))
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setCarregandoHistorico(false)
    }
  }, [filtrosHistorico])

  const carregarSolicitacoes = useCallback(async (page = 1, status = 'pendente') => {
    setCarregandoSolicitacoes(true)
    setErro('')
    try {
      setSolicitacoes(await aplicacaoRevisoesApi.listarSolicitacoesCancelamento({ page, pageSize: 20, status }))
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setCarregandoSolicitacoes(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(carregarPendentes, 0)
    return () => window.clearTimeout(timeoutId)
  }, [carregarPendentes])

  useEffect(() => {
    if (aba !== 'historico' || resultado) return undefined
    const timeoutId = window.setTimeout(() => carregarHistorico(1), 0)
    return () => window.clearTimeout(timeoutId)
  }, [aba, carregarHistorico, resultado])

  useEffect(() => {
    if (aba !== 'solicitacoes') return undefined
    const timeoutId = window.setTimeout(() => carregarSolicitacoes(1, 'pendente'), 0)
    return () => window.clearTimeout(timeoutId)
  }, [aba, carregarSolicitacoes])

  async function responderSolicitacao(item, acao, observacao) {
    setErro('')
    try {
      if (acao === 'aprovar') await aplicacaoRevisoesApi.aprovarSolicitacaoCancelamento(item.id_solicitacao, observacao)
      else await aplicacaoRevisoesApi.rejeitarSolicitacaoCancelamento(item.id_solicitacao, observacao)
      await carregarSolicitacoes(1, 'pendente')
    } catch (error) {
      setErro(mensagemErro(error))
      throw error
    }
  }

  async function selecionar(idRevisao) {
    setSelecionada(idRevisao)
    setDetalhe(null)
    setResultado(null)
    setErro('')
    setCarregandoDetalhe(true)
    try {
      setDetalhe(await aplicacaoRevisoesApi.obterDetalhe(idRevisao))
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  async function confirmarAplicacao() {
    if (!detalhe || processando) return
    setProcessando(true)
    setErro('')
    try {
      const validacao = await aplicacaoRevisoesApi.validar(detalhe.revisao.id_revisao)
      if (!validacao.aplicavel) {
        setDetalhe((atual) => ({ ...atual, validacao }))
        setConfirmando(false)
        setErro(validacao.pendencias.join(' ') || 'A revisão não está pronta para aplicação.')
        return
      }
      const data = await aplicacaoRevisoesApi.aplicar(detalhe.revisao.id_revisao)
      setResultado(data)
      setContextoResultado('pendentes')
      setConfirmando(false)
      setDetalhe(null)
      setSelecionada(null)
      setRevisoes((atuais) => atuais.filter((item) => item.id_revisao !== data.id_revisao))
    } catch (error) {
      const mensagem = mensagemErro(error)
      setConfirmando(false)
      await carregarPendentes()
      setErro(mensagem)
    } finally {
      setProcessando(false)
    }
  }

  async function abrirExecucao(idExecucao) {
    setCarregandoHistorico(true)
    setErro('')
    try {
      const execucao = await aplicacaoRevisoesApi.obterExecucao(idExecucao)
      setResultado(execucao)
      setValidacaoCancelamento(
        execucao.status === 'sucesso'
          ? await aplicacaoRevisoesApi.validarCancelamento(idExecucao)
          : null,
      )
      setContextoResultado('historico')
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setCarregandoHistorico(false)
    }
  }

  async function confirmarCancelamento(motivo) {
    if (!resultado || processandoCancelamento || !motivo.trim()) return
    setProcessandoCancelamento(true)
    setErro('')
    try {
      const execucao = await aplicacaoRevisoesApi.cancelar(resultado.id_execucao, motivo)
      setResultado(execucao)
      setValidacaoCancelamento(null)
      setConfirmandoCancelamento(false)
      await carregarHistorico(historico.page)
    } catch (error) {
      setConfirmandoCancelamento(false)
      setErro(mensagemErro(error))
      try {
        setValidacaoCancelamento(await aplicacaoRevisoesApi.validarCancelamento(resultado.id_execucao))
      } catch {
        setValidacaoCancelamento(null)
      }
    } finally {
      setProcessandoCancelamento(false)
    }
  }

  function trocarAba(novaAba) {
    setAba(novaAba)
    setResultado(null)
    setErro('')
  }

  function filtrarHistorico(filtros) {
    setFiltrosHistorico(filtros)
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Aplicação de Revisões</h1>
          <p>Confira e aplique, individualmente, as revisões enviadas e suas avaliações consolidadas.</p>
        </div>
        <button type="button" className={styles.secondaryButton} disabled={carregando || carregandoHistorico || carregandoSolicitacoes} onClick={() => aba === 'historico' ? carregarHistorico(historico.page) : aba === 'solicitacoes' ? carregarSolicitacoes(1, 'pendente') : carregarPendentes()}>
          <RefreshCw aria-hidden="true" /> Atualizar
        </button>
      </header>

      <nav className={styles.tabs} aria-label="Visualizações da aplicação de revisões">
        <button type="button" className={aba === 'pendentes' ? styles.tabActive : ''} aria-current={aba === 'pendentes' ? 'page' : undefined} onClick={() => trocarAba('pendentes')}>Pendentes</button>
        <button type="button" className={aba === 'solicitacoes' ? styles.tabActive : ''} aria-current={aba === 'solicitacoes' ? 'page' : undefined} onClick={() => trocarAba('solicitacoes')}>Solicitações de cancelamento</button>
        <button type="button" className={aba === 'historico' ? styles.tabActive : ''} aria-current={aba === 'historico' ? 'page' : undefined} onClick={() => trocarAba('historico')}>Histórico</button>
      </nav>

      {erro && <div className={styles.errorMessage} role="alert">{erro}</div>}

      {resultado ? <ResultadoAplicacao
        resultado={resultado}
        contexto={contextoResultado}
        validacaoCancelamento={validacaoCancelamento}
        onCancelarAplicacao={() => setConfirmandoCancelamento(true)}
        onFechar={() => { setResultado(null); setValidacaoCancelamento(null) }}
      /> : aba === 'solicitacoes' ? (
        <SolicitacoesCancelamento
          resultado={solicitacoes}
          carregando={carregandoSolicitacoes}
          onAtualizar={carregarSolicitacoes}
          onResponder={responderSolicitacao}
        />
      ) : aba === 'historico' ? (
        <HistoricoAplicacoes
          historico={historico}
          filtros={filtrosHistorico}
          carregando={carregandoHistorico}
          onFiltrar={filtrarHistorico}
          onPagina={(page) => carregarHistorico(page)}
          onAbrir={abrirExecucao}
        />
      ) : (
        <div className={styles.layout}>
          <section className={styles.listPanel} aria-labelledby="pendentes-title">
            <div className={styles.panelHeading}>
              <h2 id="pendentes-title">Revisões pendentes de aplicação</h2>
              <span>{revisoes.length}</span>
            </div>
            {carregando ? (
              <div className={styles.loading}><Loader2 className={styles.spinner} /> Carregando revisões...</div>
            ) : (
              <ListaRevisoesPendentes revisoes={revisoes} selecionada={selecionada} onSelecionar={selecionar} />
            )}
          </section>

          <section className={styles.detailPanel} aria-live="polite">
            {carregandoDetalhe && <div className={styles.loading}><Loader2 className={styles.spinner} /> Validando revisão...</div>}
            {!carregandoDetalhe && detalhe && <DetalhesRevisao detalhe={detalhe} onAplicar={() => setConfirmando(true)} />}
            {!carregandoDetalhe && !detalhe && (
              <div className={styles.detailEmpty}>Selecione uma revisão para conferir as alterações e sua validação.</div>
            )}
          </section>
        </div>
      )}

      {confirmando && detalhe && (
        <ModalConfirmacaoAplicacao
          revisao={detalhe.revisao}
          processando={processando}
          onCancelar={() => setConfirmando(false)}
          onConfirmar={confirmarAplicacao}
        />
      )}
      {confirmandoCancelamento && resultado && validacaoCancelamento?.pode_cancelar && (
        <ModalCancelamentoAplicacao
          execucao={resultado}
          validacao={validacaoCancelamento}
          processando={processandoCancelamento}
          onFechar={() => setConfirmandoCancelamento(false)}
          onConfirmar={confirmarCancelamento}
        />
      )}
    </main>
  )
}
