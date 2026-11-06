import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRightLeft, Check } from 'lucide-react'
import { distribuicaoApi } from '@/api/distribuicaoInstrumentos'
import SelecaoDistribuicao from '@/components/admin/distribuicao/SelecaoDistribuicao'
import OperacoesDistribuicao from '@/components/admin/distribuicao/OperacoesDistribuicao'
import ConferenciaDistribuicao from '@/components/admin/distribuicao/ConferenciaDistribuicao'
import { estadoInicial, preparacaoReducer } from '@/components/admin/distribuicao/preparacao'
import {
  iniciarDistribuicao,
  resumirDistribuicao,
  validarDistribuicao,
} from '@/components/admin/distribuicao/distribuicaoFinal'
import { atualizarMarcacoes } from '@/components/admin/distribuicao/selecaoConsulta'
import {
  criarTravaExecucao,
  LIMITE_INSTRUMENTOS,
  prepararPedido,
  previaAplicavel,
  validarConjuntoConferido,
} from '@/components/admin/distribuicao/execucaoDistribuicao'
import styles from '@/components/admin/distribuicao/distribuicao.module.css'

const etapas = ['Selecionar instrumentos', 'Definir a nova distribuição', 'Conferir alterações']
const erroTexto = e => typeof e?.response?.data?.detail === 'string'
  ? e.response.data.detail
  : 'Não foi possível concluir a operação. Tente novamente.'

// Só preserva o rascunho ao voltar à mesma seleção e aos mesmos vínculos consultados.
const assinaturaBase = itens => JSON.stringify(
  itens.map(i => [i.chave, i.numero, i.alertas, i.monitores])
    .sort(([a], [b]) => String(a).localeCompare(String(b))),
)

export default function DistribuicaoInstrumentos() {
  const [estado, dispatch] = useReducer(preparacaoReducer, estadoInicial)
  const [etapa, setEtapa] = useState(1)
  const [instrumentos, setInstrumentos] = useState([])
  const [distribuicao, setDistribuicao] = useState({})
  const [versaoConferencia, setVersaoConferencia] = useState(0)
  const [previa, setPrevia] = useState(null)
  const [pedidoConferido, setPedidoConferido] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [ocupada, setOcupada] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [verSelecao, setVerSelecao] = useState(false)
  const [revisaoConsulta, setRevisaoConsulta] = useState(0)
  const queryClient = useQueryClient()
  const controlador = useRef(null)
  const titulo = useRef(null)
  const trava = useRef(null)
  if (trava.current === null) trava.current = criarTravaExecucao()

  useEffect(() => () => controlador.current?.abort(), [])
  useLayoutEffect(() => {
    titulo.current?.focus({ preventScroll: true })
    titulo.current?.closest('main')?.parentElement?.scrollTo({ top: 0, behavior: 'instant' })
  }, [etapa])

  const configuracao = useQuery({
    queryKey: ['distribuicao', 'configuracao'],
    queryFn: ({ signal }) => distribuicaoApi.configuracao(signal),
    staleTime: 0,
    retry: false,
  })
  // Falhas ou configuração ainda não consultada nunca liberam a gravação.
  const aplicacaoHabilitada = configuracao.isSuccess && configuracao.data?.habilitada === true

  const catalogo = useQuery({
    queryKey: ['distribuicao', 'catalogo'],
    queryFn: ({ signal }) => distribuicaoApi.catalogo(signal),
  })
  const payload = {
    filtros: estado.filtros,
    selecao: estado.selecao,
    somente_selecao: verSelecao,
    limit: 25,
    offset: estado.pagina * 25,
  }
  const chaveConsulta = useMemo(() => [
    'distribuicao',
    'consulta',
    revisaoConsulta,
    {
      filtros: estado.filtros,
      somente_selecao: verSelecao,
      offset: estado.pagina * 25,
    },
  ], [estado.filtros, estado.pagina, verSelecao, revisaoConsulta])
  const consulta = useQuery({
    queryKey: chaveConsulta,
    queryFn: ({ signal }) => distribuicaoApi.consultar(payload, signal),
    enabled: etapa === 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })
  const dispatchSelecao = useCallback(acao => {
    if (acao.tipo === 'itens' || acao.tipo === 'limparSelecao') {
      const dados = queryClient.setQueryData(
        chaveConsulta,
        anterior => atualizarMarcacoes(anterior, acao, verSelecao),
      )
      if (verSelecao && acao.tipo === 'itens') {
        const ultima = Math.max(0, Math.ceil((dados?.total || 0) / 25) - 1)
        if (estado.pagina > ultima) dispatch({ tipo: 'pagina', valor: ultima })
        setRevisaoConsulta(n => n + 1)
      }
    }
    if (acao.tipo === 'todos') setRevisaoConsulta(n => n + 1)
    dispatch(acao)
  }, [chaveConsulta, queryClient, verSelecao, estado.pagina])

  const monitores = catalogo.data?.monitores
  const panorama = useMemo(
    () => resumirDistribuicao(instrumentos, monitores || []),
    [instrumentos, monitores],
  )
  const errosDistribuicao = useMemo(
    () => validarDistribuicao(distribuicao, monitores || []),
    [distribuicao, monitores],
  )
  const selecionados = consulta.data?.selecionados || 0
  const podeConferir = instrumentos.length > 0 && errosDistribuicao.length === 0

  const mudarEtapa = numero => {
    if (aplicando) return
    setConfirmando(false)
    if (numero !== 3) {
      setPrevia(null)
      setPedidoConferido(null)
    }
    setEtapa(numero)
    setErro('')
  }
  const continuar = async () => {
    if (ocupada || consulta.isFetching || consulta.isError || !selecionados || !catalogo.data) return
    if (selecionados > LIMITE_INSTRUMENTOS) {
      setErro(`Selecione até ${LIMITE_INSTRUMENTOS} instrumentos por execução.`)
      return
    }
    if (!trava.current.iniciar()) return
    setErro('')
    setOcupada(true)
    setProgresso(0)
    const controller = new AbortController()
    controlador.current = controller

    try {
      const porChave = new Map()
      let offset = 0
      let total = null
      do {
        const pagina = await distribuicaoApi.consultar({
          selecao: estado.selecao,
          somente_selecao: true,
          limit: 200,
          offset,
        }, controller.signal)
        if (controller.signal.aborted) return
        if ((total === null ? selecionados : total) !== pagina.total) {
          throw new Error('A seleção mudou durante a leitura. Confira os instrumentos e tente novamente.')
        }
        total = pagina.total
        if (!pagina.items.length && offset < total) {
          throw new Error('A leitura ficou incompleta. Tente novamente.')
        }
        // Uma resposta repetida não pode ocultar vínculos divergentes.
        for (const item of pagina.items) {
          if (porChave.has(item.chave)) {
            throw new Error('A consulta retornou um instrumento repetido. Confira a seleção e tente novamente.')
          }
          porChave.set(item.chave, item)
        }
        offset += pagina.items.length
        setProgresso(porChave.size)
      } while (offset < total)

      if (!total || porChave.size !== total) {
        throw new Error('A seleção está vazia ou mudou durante a leitura. Confira os instrumentos e tente novamente.')
      }
      const lidos = [...porChave.values()]
      if (assinaturaBase(lidos) !== assinaturaBase(instrumentos)) {
        setDistribuicao(iniciarDistribuicao(lidos, monitores))
        setAviso(instrumentos.length
          ? 'A seleção ou os vínculos consultados mudaram. Defina a distribuição para esta nova seleção.'
          : '')
      }
      setInstrumentos(lidos)
      mudarEtapa(2)
    } catch (e) {
      if (!controller.signal.aborted) setErro(e.response ? erroTexto(e) : e.message)
    } finally {
      trava.current.liberar()
      if (controlador.current === controller) {
        controlador.current = null
        setOcupada(false)
      }
    }
  }
  const reiniciar = encerrada => {
    if (aplicando) return
    dispatch({ tipo: 'nova' })
    setInstrumentos([])
    setDistribuicao({})
    setPrevia(null)
    setPedidoConferido(null)
    setConfirmando(false)
    setVerSelecao(false)
    setRevisaoConsulta(n => n + 1)
    setAviso(encerrada
      ? 'Preparação encerrada. Nenhuma alteração foi gravada. Você pode iniciar uma nova seleção.'
      : 'Nova seleção iniciada. A preparação anterior foi descartada.')
    mudarEtapa(1)
  }
  const conferir = async () => {
    if (!podeConferir || !trava.current.iniciar()) return
    setErro('')
    setAviso('')
    setOcupada(true)
    setPrevia(null)
    setPedidoConferido(null)
    setConfirmando(false)
    const controller = new AbortController()
    controlador.current = controller
    try {
      const pedido = prepararPedido(instrumentos, distribuicao)
      const validada = validarConjuntoConferido(
        await distribuicaoApi.previa(pedido, controller.signal), pedido,
      )
      if (controller.signal.aborted) return
      setPrevia(validada)
      setPedidoConferido(pedido)
      setVersaoConferencia(n => n + 1)
      mudarEtapa(3)
    } catch (e) {
      if (!controller.signal.aborted) setErro(e.response ? erroTexto(e) : e.message)
    } finally {
      trava.current.liberar()
      if (controlador.current === controller) {
        controlador.current = null
        setOcupada(false)
      }
    }
  }
  const aplicar = async () => {
    if (!aplicacaoHabilitada) return
    if (!confirmando || !pedidoConferido || !previaAplicavel(previa)) {
      setConfirmando(false)
      setErro('Atualize a conferência antes de confirmar a aplicação.')
      return
    }
    if (!trava.current.iniciar()) return
    setAplicando(true)
    setOcupada(true)
    setErro('')
    try {
      const resposta = await distribuicaoApi.aplicar({ ...pedidoConferido, versao: previa.versao })
      setResultado(resposta)
      setInstrumentos([])
      setDistribuicao({})
      setPrevia(null)
      setPedidoConferido(null)
      setConfirmando(false)
      dispatch({ tipo: 'nova' })
      setVerSelecao(false)
      setAviso('')
    } catch (e) {
      // Um timeout pode acontecer depois do commit. Exige nova leitura do
      // servidor antes de qualquer nova tentativa, mantendo seleção e destino.
      setPrevia(anterior => anterior ? { ...anterior, versao: null } : null)
      setConfirmando(false)
      setErro(`${erroTexto(e)} Atualize a conferência para verificar o estado atual antes de tentar novamente.`)
    } finally {
      trava.current.liberar()
      setAplicando(false)
      setOcupada(false)
    }
  }
  const navegar = numero => {
    if (numero === 1) mudarEtapa(1)
    else if (etapa === 1) continuar()
    else if (numero === 3 && podeConferir) conferir()
    else mudarEtapa(2)
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <Link to="/admin"><ArrowLeft size={15} /> Gestão de Usuários</Link>
          <h1 ref={titulo} tabIndex={-1}>
            <ArrowRightLeft aria-hidden="true" /> Distribuição de Instrumentos
          </h1>
        </div>
      </header>
      {!aplicacaoHabilitada && (
        <p role="status" className={styles.localNotice}>
          {configuracao.isError
            ? 'Não foi possível verificar a configuração. A aplicação definitiva permanece indisponível.'
            : configuracao.isPending
              ? 'Verificando disponibilidade da aplicação definitiva…'
              : 'A aplicação definitiva está desabilitada. A seleção, a definição e a conferência não gravam alterações.'}
          {configuracao.isError && <> <button type="button" onClick={() => configuracao.refetch()}>Tentar novamente</button></>}
        </p>
      )}
      {!resultado && <nav aria-label="Etapas da distribuição">
        <ol className={styles.steps}>
          {etapas.map((label, i) => (
            <li
              key={label}
              className={etapa === i + 1
                ? styles.activeStep
                : etapa > i + 1 ? styles.completedStep : ''}
            >
              <button
                type="button"
                aria-current={etapa === i + 1 ? 'step' : undefined}
                disabled={ocupada || etapa === i + 1
                  || (i === 1 && etapa === 1 && (consulta.isFetching || consulta.isError
                    || !selecionados || !catalogo.data))
                  || (i === 2 && (etapa === 1 || !podeConferir))}
                onClick={() => navegar(i + 1)}
              >
                <span>{etapa > i + 1 ? <Check size={17} aria-hidden="true" /> : i + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
      </nav>}
      {!resultado && etapa !== 3 && (
        <p className={styles.localNotice}>
          A preparação será validada pelo servidor antes da confirmação. Nenhuma alteração foi aplicada.
        </p>
      )}
      {aviso && <p role="status" className={styles.localNotice}>{aviso}</p>}
      {erro && <div role="alert" className={styles.error}>{erro}</div>}

      {resultado && (
        <section className={styles.section} aria-labelledby="resultado-distribuicao">
          <h2 id="resultado-distribuicao">Distribuição concluída</h2>
          <p role="status">{resultado.mensagem || 'Distribuição aplicada com sucesso.'}</p>
          <p>{resultado.total} instrumentos conferidos; {resultado.alterados} alterados e {resultado.semMudancas} sem mudanças.</p>
          <button type="button" className={styles.primary} onClick={() => {
            setResultado(null)
            reiniciar(false)
            // O estado concluído da aplicação independe da atualização deste
            // cache. A próxima consulta exibe eventuais falhas de leitura.
            void queryClient.invalidateQueries({ queryKey: ['distribuicao', 'consulta'] })
          }}>Iniciar nova seleção</button>
        </section>
      )}

      <section hidden={etapa !== 1 || !!resultado} className={styles.section} aria-labelledby="selecao-titulo">
        <SelecaoDistribuicao
          ativa={etapa === 1}
          catalogo={catalogo}
          consulta={consulta}
          estado={estado}
          dispatch={dispatchSelecao}
          ocupada={ocupada}
          verSelecao={verSelecao}
          onContinuar={continuar}
          onVerSelecao={() => {
            setVerSelecao(!verSelecao)
            dispatch({ tipo: 'pagina', valor: 0 })
          }}
        />
        {!!instrumentos.length && (
          <p className={styles.localNotice}>
            Distribuição em edição preservada. Se mudar os instrumentos selecionados,
            será necessário definir uma nova distribuição.
          </p>
        )}
        {ocupada && (
          <p role="status">
            Lendo seleção: {progresso} instrumentos.{' '}
            <button
              type="button"
              onClick={() => {
                controlador.current?.abort()
                controlador.current = null
                setOcupada(false)
              }}
            >
              Cancelar leitura
            </button>
          </p>
        )}
      </section>

      <section hidden={etapa !== 2 || !!resultado} className={styles.section} aria-labelledby="preparacao-titulo" aria-busy={ocupada}>
        <h2 id="preparacao-titulo">Defina a nova distribuição</h2>
        {catalogo.data && (
          <OperacoesDistribuicao
            monitores={monitores}
            base={instrumentos}
            distribuicao={distribuicao}
            panorama={panorama}
            onChange={setDistribuicao}
            erros={errosDistribuicao}
            ocupada={ocupada}
            onSelecao={() => mudarEtapa(1)}
          />
        )}
        <footer className={styles.stepFooter}>
          <button type="button" className={styles.textButton} disabled={ocupada} onClick={() => mudarEtapa(1)}>
            Voltar à seleção
          </button>
          <button type="button" disabled={ocupada} onClick={() => reiniciar(false)}>Nova seleção</button>
          <button
            type="button"
            className={styles.primary}
            disabled={ocupada || !podeConferir}
            onClick={conferir}
          >
            {ocupada ? 'Validando no servidor…' : 'Conferir alterações'}
          </button>
        </footer>
      </section>

      <section hidden={etapa !== 3 || !!resultado} className={styles.section} aria-labelledby="conferencia-titulo" aria-busy={ocupada}>
        <h2 id="conferencia-titulo">Confira as alterações</h2>
        {previa && <ConferenciaDistribuicao key={versaoConferencia} resumo={previa} />}
        {!!previa?.erros?.length && (
          <div role="alert" className={styles.error}><ul>{previa.erros.map(item => <li key={item}>{item}</li>)}</ul></div>
        )}
        {!!previa?.avisos?.length && <p role="status" className={styles.localNotice}>{previa.avisos.join(' ')}</p>}
        <p className={styles.localNotice}>
          Conferência validada pelo servidor. Nenhuma alteração foi gravada. Quando habilitada,
          a aplicação revalidará os dados e será cancelada integralmente
          se houver alteração concorrente. A nova distribuição substituirá todos os vínculos ativos selecionados.
        </p>
        {aplicacaoHabilitada && confirmando && previa && (
          <section className={styles.confirmation} aria-labelledby="confirmacao-distribuicao">
            <h3 id="confirmacao-distribuicao">Confirmar substituição dos vínculos</h3>
            <p>
              A distribuição abaixo substituirá os vínculos atuais de {previa.total} instrumentos selecionados.
              Desses, {previa.alterados} terão alterações e {previa.semMudancas} serão preservados.
            </p>
            <ul>
              {[1, 2, 3].map(posicao => {
                const destino = previa.linhas.flatMap(linha => linha.proposta || [])
                  .find(m => m.id_usuario === distribuicao[posicao])
                return <li key={posicao}>
                  {['Principal', 'Reserva 1', 'Reserva 2'][posicao - 1]}:{' '}
                  {distribuicao[posicao] === null ? 'Sem monitor'
                    : destino?.nome || monitores?.find(m => m.id_usuario === distribuicao[posicao])?.nome}
                  {destino?.ativo === false && ' · Cadastro desativado (distribuição permitida)'}
                </li>
              })}
            </ul>
            <p>
              {previa.contagens.desativar} vínculos a desativar; {previa.contagens.criar} a criar;{' '}
              {previa.contagens.reativar} a reativar; {previa.contagens.alterar_prioridade} prioridades a alterar;{' '}
              {previa.contagens.preservar} vínculos preservados.
            </p>
            <footer className={styles.stepFooter}>
              <button type="button" disabled={ocupada} onClick={() => setConfirmando(false)}>Cancelar confirmação</button>
              <button type="button" className={styles.primary} disabled={ocupada} onClick={aplicar}>
                {aplicando ? 'Aplicando distribuição…' : 'Confirmar e aplicar substituição'}
              </button>
            </footer>
          </section>
        )}
        <footer className={styles.stepFooter}>
          <button type="button" className={styles.textButton} disabled={ocupada} onClick={() => mudarEtapa(2)}>
            Voltar e editar distribuição
          </button>
          <button type="button" disabled={ocupada} onClick={conferir}>
            {ocupada && !aplicando ? 'Validando no servidor…' : 'Atualizar conferência'}
          </button>
          {aplicacaoHabilitada && !confirmando && <button type="button" className={styles.primary}
            disabled={ocupada || !previaAplicavel(previa)} onClick={() => setConfirmando(true)}>
            Aplicar distribuição
          </button>}
        </footer>
      </section>
    </main>
  )
}
