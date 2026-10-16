import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Link, Loader2, Search } from 'lucide-react'
import { adminUsuariosApi } from '@/api/adminUsuarios'
import ModalBase from './ModalBase'
import { papeisPrioridade } from './prioridades'
import styles from '@/pages/admin/usuarios/AdminUsuarios.module.css'

const mensagemErro = (error, fallback) => {
  const detalhe = error?.response?.data?.detail
  return typeof detalhe === 'string' ? detalhe : fallback
}

export default function PrioridadesInstrumentoModal({ usuario, instrumento = '', modo = 'adicionar', onClose, onSaved }) {
  const [nr, setNr] = useState(instrumento)
  const [busca, setBusca] = useState('')
  const [opcoes, setOpcoes] = useState([])
  const [estado, setEstado] = useState(null)
  const [ordem, setOrdem] = useState([])
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(Boolean(instrumento))
  const [buscando, setBuscando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [conflito, setConflito] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const incluir = modo !== 'gerenciar'

  useEffect(() => {
    if (nr || busca.trim().length < 2) return undefined
    let ativo = true
    const timer = setTimeout(async () => {
      setBuscando(true)
      setErro('')
      try {
        const itens = await adminUsuariosApi.buscarInstrumentos(busca.trim())
        if (ativo) setOpcoes(itens)
      } catch (error) {
        if (ativo) setErro(mensagemErro(error, 'Não foi possível pesquisar instrumentos.'))
      } finally { if (ativo) setBuscando(false) }
    }, 300)
    return () => { ativo = false; clearTimeout(timer) }
  }, [busca, nr])

  useEffect(() => {
    if (!nr) return undefined
    let ativo = true
    // Descartar respostas antigas impede misturar monitores de instrumentos diferentes.
    const timer = setTimeout(async () => {
      setCarregando(true)
      setEstado(null)
      setErro('')
      setAviso('')
      try {
        const dados = await adminUsuariosApi.monitoresInstrumento(nr)
        if (!ativo) return
        const monitores = [...dados.monitores]
        if (incluir && monitores.some((m) => m.id_usuario === usuario.id_usuario)) {
          setAviso('Este monitor já está vinculado. Use Gerenciar prioridades no instrumento.')
        } else if (incluir && monitores.length >= 3) {
          setAviso('As três posições estão ocupadas. Desative explicitamente um vínculo antes de adicionar ou reativar outro monitor.')
        } else if (incluir) {
          monitores.push({ id_usuario: usuario.id_usuario, nome: usuario.nome, novo: true })
        }
        setEstado(dados)
        setOrdem(monitores)
        setConflito(false)
      } catch (error) {
        if (ativo) setErro(mensagemErro(error, 'Não foi possível consultar os monitores.'))
      } finally { if (ativo) setCarregando(false) }
    }, 0)
    return () => { ativo = false; clearTimeout(timer) }
  }, [nr, tentativa, incluir, usuario.id_usuario, usuario.nome])

  function mover(indice, destino) {
    setOrdem((atual) => {
      const proxima = [...atual]
      const [monitor] = proxima.splice(indice, 1)
      proxima.splice(destino, 0, monitor)
      return proxima
    })
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    const payload = {
      versao: estado.versao,
      monitores: ordem.map((monitor, i) => ({ id_usuario: monitor.id_usuario, ordem_prioridade: i + 1 })),
    }
    try {
      if (modo === 'adicionar') await adminUsuariosApi.vincularInstrumento(usuario.id_usuario, nr, payload)
      else if (modo === 'reativar') await adminUsuariosApi.alterarVinculo(usuario.id_usuario, nr, true, payload)
      else await adminUsuariosApi.salvarPrioridades(nr, payload)
      onSaved('Vínculos e prioridades salvos com sucesso.')
    } catch (error) {
      setErro(mensagemErro(error, 'Não foi possível salvar as prioridades.'))
      if (error?.response?.status === 409) setConflito(true)
    } finally { setSalvando(false) }
  }

  function atualizar() { setCarregando(true); setTentativa((v) => v + 1) }
  const titulo = modo === 'adicionar' ? 'Adicionar instrumento' : modo === 'reativar' ? 'Reativar vínculo' : 'Gerenciar prioridades'
  const bloqueado = salvando || carregando || conflito || Boolean(aviso)
  return <ModalBase titulo={titulo} onClose={onClose} ocupado={salvando}>
    {!nr ? <>
      <p>Pesquise o instrumento para consultar os monitores e definir a ordem final.</p>
      <label className={styles.instrumentSearch}><Search />
        <input autoFocus aria-label="Buscar instrumento ou proposta" value={busca} onChange={(e) => {
          setBusca(e.target.value); setOpcoes([]); setBuscando(false)
        }} placeholder="Instrumento ou proposta" />
      </label>
      {buscando && <p role="status">Pesquisando...</p>}
      <div className={styles.options}>{opcoes.map((item) => <button type="button" key={item.nr_instrumento} onClick={() => {
        setCarregando(true); setNr(item.nr_instrumento)
      }}><Link /><span><strong>{item.nr_instrumento}</strong><small>{item.nr_proposta || item.tipo_instrumento}</small></span></button>)}</div>
    </> : <>
      <p>Instrumento <strong>{nr}</strong>{incluir && <><br />Monitor: <strong>{usuario.nome}</strong></>}</p>
      {carregando && <div className={styles.loading} role="status"><Loader2 className={styles.spin} />Consultando monitores...</div>}
      {estado && !carregando && <>
        <h3>Monitores vinculados atualmente</h3>
        <ul className={styles.currentMonitors}>{estado.monitores.map((m) => <li key={m.id_usuario}>
          {m.ordem_prioridade ? `Prioridade ${m.ordem_prioridade}` : 'Sem prioridade'} — {m.nome}
        </li>)}{estado.monitores.length === 0 && <li>Nenhum monitor vinculado.</li>}</ul>
        {estado.monitores.length < 3 && <p>{3 - estado.monitores.length} posição(ões) disponível(is).</p>}
        {aviso && <p className={styles.notice} role="alert">{aviso}</p>}
        <h3>Ordem final antes de salvar</h3>
        <p>Mova os monitores para definir o principal e os reservas. As alterações serão aplicadas ao confirmar.</p>
        <ol className={styles.priorityList} aria-live="polite">{ordem.map((m, i) => <li key={m.id_usuario}>
          <span className={styles.priorityNumber}>{i + 1}</span>
          <div><strong>{m.nome}{m.novo && (modo === 'reativar' ? ' (reativação)' : ' (novo vínculo)')}</strong><small>{papeisPrioridade[i] || 'Excede o limite'}</small></div>
          <button type="button" className={styles.secondary} disabled={bloqueado || i === 0} onClick={() => mover(i, i - 1)} aria-label={`Mover ${m.nome} para cima`}><ArrowUp /></button>
          <button type="button" className={styles.secondary} disabled={bloqueado || i === ordem.length - 1} onClick={() => mover(i, i + 1)} aria-label={`Mover ${m.nome} para baixo`}><ArrowDown /></button>
        </li>)}</ol>
      </>}
    </>}
    {erro && <div className={styles.error} role="alert">{erro}</div>}
    {nr && <button type="button" className={styles.secondary} disabled={salvando || carregando} onClick={atualizar}>Atualizar dados</button>}
    {nr && modo === 'adicionar' && <button type="button" className={styles.secondary} disabled={salvando} onClick={() => {
      setNr(''); setEstado(null); setOrdem([]); setErro(''); setAviso(''); setConflito(false); setOpcoes([]); setBusca('')
    }}>Trocar instrumento</button>}
    <div className={styles.modalActions}>
      <button type="button" className={styles.secondary} disabled={salvando} onClick={onClose}>Cancelar</button>
      <button type="button" className={styles.primary} disabled={bloqueado || !estado || ordem.length === 0 || ordem.length > 3} onClick={salvar}>
        {salvando && <Loader2 className={styles.spin} />}Confirmar prioridades
      </button>
    </div>
  </ModalBase>
}
