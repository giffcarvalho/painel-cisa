import { useCallback, useEffect, useState } from 'react'
import { ClipboardCheck, FilePenLine, Loader2, RefreshCw, Send } from 'lucide-react'
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

      {carregando && !dados && <section className={styles.state}><Loader2 className={styles.spinner} /> Carregando seu painel...</section>}
      {!carregando && erro && <section className={styles.state} role="alert">{erro}</section>}

      {dados && (
        <>
          <section className={styles.summary} aria-label="Resumo do Meu Painel">
            <div><ClipboardCheck /><span><strong>{dados.resumo.instrumentos_com_pendencias}</strong> instrumentos com pendências</span></div>
            <div><FilePenLine /><span><strong>{dados.resumo.rascunhos}</strong> rascunhos</span></div>
            <div><Send /><span><strong>{dados.resumo.revisoes_enviadas}</strong> revisões enviadas</span></div>
          </section>

          <section className={styles.panel} aria-labelledby="pendencias-title">
            <div className={styles.sectionHeading}>
              <div><h2 id="pendencias-title">Pendências</h2><p>O que ainda precisa ser revisado nos instrumentos sob sua responsabilidade.</p></div>
              <span>{dados.pendencias.length}</span>
            </div>
            {dados.pendencias.length === 0 ? <div className={styles.empty}>Você não possui instrumentos com pendências de revisão.</div> : (
              <div className={styles.cardGrid}>
                {dados.pendencias.map((item) => (
                  <article className={styles.card} key={`${item.tipo_instrumento}-${item.identificador_instrumento}`}>
                    <div className={styles.cardTop}><div><small>{item.tipo_instrumento_label}</small><h3>Instrumento {item.identificador_instrumento}</h3></div><strong>{item.total_pendencias} {item.total_pendencias === 1 ? 'item pendente' : 'itens pendentes'}</strong></div>
                    <dl className={styles.groups}>
                      {Object.entries(GRUPOS).map(([chave, label]) => <div key={chave}><dt>{label}</dt><dd>{item.grupos[chave]}</dd></div>)}
                    </dl>
                    <button type="button" className={styles.primary} onClick={() => navigate(`/revisao-instrumento/${encodeURIComponent(item.identificador_instrumento)}`)}>Revisar instrumento</button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="rascunhos-title">
            <div className={styles.sectionHeading}>
              <div><h2 id="rascunhos-title">Rascunhos em aberto</h2><p>Continue de onde parou sem criar uma nova revisão.</p></div>
              <span>{dados.rascunhos.length}</span>
            </div>
            {dados.rascunhos.length === 0 ? <div className={styles.empty}>Você não possui rascunhos em aberto.</div> : (
              <div className={styles.drafts}>
                {dados.rascunhos.map((item) => (
                  <article className={styles.draft} key={item.id_revisao}>
                    <div><small>{item.tipo_instrumento_label}</small><h3>Instrumento {item.identificador_instrumento}</h3><p><strong>Alterações salvas:</strong> {resumoAlteracoes(item.alteracoes)}</p><time>Criado em {formatarData(item.criado_em)} · Atualizado em {formatarData(item.atualizado_em)}</time></div>
                    <button type="button" className={styles.primary} onClick={() => navigate(`/revisao-instrumento/${encodeURIComponent(item.identificador_instrumento)}`)}>Continuar revisão</button>
                  </article>
                ))}
              </div>
            )}
          </section>

        </>
      )}
      <HistoricoRevisoes escopo="pessoal" embedded />
      <NotificationCenter />
    </main>
  )
}
