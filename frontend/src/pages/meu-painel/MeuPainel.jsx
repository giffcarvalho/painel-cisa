import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { meuPainelApi } from '@/api/meuPainel'
import NotificationCenter from '@/components/notificacoes/NotificationCenter'
import HistoricoRevisoes from '@/components/revisao-instrumento/HistoricoRevisoes'
import styles from './MeuPainel.module.css'

const GRUPOS = {
  municipios: 'Municípios',
  localidades: 'Localidades',
  publico_alvo: 'Público-alvo',
  obras: 'Obras',
}

function formatarData(value) {
  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return 'Não informada'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data)
}

function resumoAlteracoes(alteracoes) {
  const partes = Object.entries(GRUPOS)
    .filter(([chave]) => alteracoes?.[chave] > 0)
    .map(([chave]) => `${alteracoes[chave]} ${GRUPOS[chave].toLocaleLowerCase('pt-BR')}`)
  if (alteracoes?.observacao_geral) partes.push('observação geral')
  return partes.length ? partes.join(' · ') : 'Nenhuma modificação efetiva registrada.'
}

function PendenciaCard({ item, onReview }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <div><small>{item.tipo_instrumento_label}</small><h3>Instrumento {item.identificador_instrumento}</h3></div>
        <strong>{item.total_pendencias} {item.total_pendencias === 1 ? 'item pendente' : 'itens pendentes'}</strong>
      </div>
      <dl className={styles.groups}>
        {Object.entries(GRUPOS).map(([chave, label]) => <div key={chave}><dt>{label}</dt><dd>{item.grupos[chave]}</dd></div>)}
      </dl>
      <button type="button" className={styles.primary} onClick={() => onReview(item.identificador_instrumento)}>Revisar instrumento</button>
    </article>
  )
}

function PendenciasSection({ items, onReview }) {
  const carouselRef = useRef(null)
  const [expandido, setExpandido] = useState(false)
  const [podeVoltar, setPodeVoltar] = useState(false)
  const [podeAvancar, setPodeAvancar] = useState(false)

  const atualizarControles = useCallback(() => {
    const carousel = carouselRef.current
    if (!carousel || expandido) return
    setPodeVoltar(carousel.scrollLeft > 2)
    setPodeAvancar(carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 2)
  }, [expandido])

  useEffect(() => {
    atualizarControles()
    window.addEventListener('resize', atualizarControles)
    return () => window.removeEventListener('resize', atualizarControles)
  }, [atualizarControles, items.length])

  function navegar(direcao) {
    const carousel = carouselRef.current
    if (!carousel) return
    carousel.scrollBy({ left: direcao * Math.max(carousel.clientWidth * 0.82, 260), behavior: 'smooth' })
  }

  function alternarExpansao() {
    setExpandido((valor) => !valor)
    carouselRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }

  return (
    <section className={`${styles.panel} ${styles.pendingPanel}`} aria-labelledby="pendencias-title">
      <div className={styles.sectionHeading}>
        <div><h2 id="pendencias-title">Pendências</h2><p>O que ainda precisa ser revisado nos instrumentos sob sua responsabilidade.</p></div>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? <div className={styles.empty}>Você não possui instrumentos com pendências de revisão.</div> : (
        <>
          <div
            ref={carouselRef}
            className={`${styles.pendingCards} ${expandido ? styles.expanded : ''}`}
            onScroll={atualizarControles}
            aria-label={expandido ? 'Todas as pendências' : 'Carrossel de pendências'}
          >
            {items.map((item) => (
              <PendenciaCard
                key={`${item.tipo_instrumento}-${item.identificador_instrumento}`}
                item={item}
                onReview={onReview}
              />
            ))}
          </div>
          <div className={styles.pendingFooter}>
            {!expandido && (podeVoltar || podeAvancar) && (
              <div className={styles.carouselControls} aria-label="Navegação das pendências">
                <button type="button" aria-label="Pendências anteriores" disabled={!podeVoltar} onClick={() => navegar(-1)}><ChevronLeft /></button>
                <button type="button" aria-label="Próximas pendências" disabled={!podeAvancar} onClick={() => navegar(1)}><ChevronRight /></button>
              </div>
            )}
            <button type="button" className={styles.expandButton} onClick={alternarExpansao}>
              {expandido ? 'Recolher pendências' : 'Ver todas as pendências'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

function RascunhosSection({ items, onContinue }) {
  return (
    <section className={styles.panel} aria-labelledby="rascunhos-title">
      <div className={styles.sectionHeading}>
        <div><h2 id="rascunhos-title">Rascunhos em aberto</h2><p>Continue de onde parou sem criar uma nova revisão.</p></div>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? <div className={styles.empty}>Você não possui rascunhos em aberto.</div> : (
        <div className={styles.drafts}>
          {items.map((item) => (
            <article className={styles.draft} key={item.id_revisao}>
              <div><small>{item.tipo_instrumento_label}</small><h3>Instrumento {item.identificador_instrumento}</h3><p><strong>Alterações salvas:</strong> {resumoAlteracoes(item.alteracoes)}</p><time>Criado em {formatarData(item.criado_em)} · Atualizado em {formatarData(item.atualizado_em)}</time></div>
              <button type="button" className={styles.primary} onClick={() => onContinue(item.identificador_instrumento)}>Continuar revisão</button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default function MeuPainel() {
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      setDados(await meuPainelApi.buscar())
    } catch (error) {
      setErro(error?.response?.data?.detail || 'Não foi possível carregar seu painel.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    let ativo = true
    Promise.resolve().then(() => { if (ativo) carregar() })
    return () => { ativo = false }
  }, [carregar])

  const abrirRevisao = useCallback((identificador) => {
    navigate(`/revisao-instrumento/${encodeURIComponent(identificador)}`)
  }, [navigate])

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1>Meu Painel</h1>
          <p>Sua área de trabalho para acompanhar pendências, rascunhos, revisões e notificações.</p>
        </div>
        <button type="button" className={styles.refresh} disabled={carregando} onClick={carregar}>
          <RefreshCw className={carregando ? styles.spinner : ''} /> Atualizar
        </button>
      </header>

      <div className={styles.dashboard}>
        <div className={styles.mainColumn}>
          {carregando && !dados && <section className={styles.state}><Loader2 className={styles.spinner} /> Carregando seu painel...</section>}
          {!carregando && erro && <section className={styles.state} role="alert">{erro}</section>}
          {dados && <PendenciasSection items={dados.pendencias} onReview={abrirRevisao} />}
        </div>
        <aside className={styles.sidebar} aria-label="Acompanhamento do Meu Painel">
          <HistoricoRevisoes escopo="pessoal" embedded compact />
          {dados && <RascunhosSection items={dados.rascunhos} onContinue={abrirRevisao} />}
          <NotificationCenter compact />
        </aside>
      </div>
    </main>
  )
}
