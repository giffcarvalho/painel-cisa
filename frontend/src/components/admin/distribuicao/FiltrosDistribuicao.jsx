import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Select from 'react-select'
import {
  alternar,
  mudarFiltro,
  opcoesComSelecionados,
  textoBusca,
  textoOpcao,
} from './filtrosContextuais'
import styles from './distribuicao.module.css'

const nomes = {
  ufs: 'UF inteira',
  municipios: 'Município',
  setores: 'Setor',
  monitores: 'Monitor',
  posicoes: 'Posição',
  sem_monitor: 'Sem monitor ativo',
}
const posicoes = ['Principal', 'Reserva 1', 'Reserva 2']

function rotuloValor(campo, valor, catalogo, opcoes, rotulos) {
  const opcao = opcoes?.[campo]?.find(o => o.value === valor)
  if (opcao) return opcao.label + (
    campo === 'municipios' && opcao.sigla ? `/${opcao.sigla}` : ''
  )
  if (rotulos[`${campo}:${valor}`]) return rotulos[`${campo}:${valor}`]
  if (campo === 'ufs') return catalogo?.ufs.find(u => u.cod_uf === valor)?.sigla || valor
  if (campo === 'monitores')
    return catalogo?.monitores.find(m => m.id_usuario === valor)?.nome || valor
  if (campo === 'setores')
    return catalogo?.monitores.find(m => m.id_setor === valor)?.setor || valor
  if (campo === 'posicoes') return posicoes[valor - 1]
  if (valor === 'true') return 'Sim'
  if (valor === 'false') return 'Não'
  return String(valor)
}

export function ResumoFiltros({ catalogo, value, onChange, opcoes, rotulos }) {
  if (!Object.keys(value).length) return null

  return (
    <div className={styles.activeFilters} aria-label="Filtros ativos">
      <strong>{'Filtros ativos '}</strong>
      <div className={styles.chips}>
        {Object.entries(value).flatMap(([campo, valores]) =>
          (Array.isArray(valores) ? valores : [true]).map(v => {
            const nome = nomes[campo]
              || catalogo?.campos.find(c => c.campo === campo)?.label
              || campo
            const label = rotuloValor(campo, v, catalogo, opcoes, rotulos)
            const zero = opcoes?.[campo]?.find(o => o.value === v)?.total === 0

            return (
              <button
                key={`${campo}:${v}`}
                type="button"
                className={zero ? styles.zeroOption : undefined}
                aria-label={`Remover ${nome}: ${label}`}
                onClick={() => onChange(mudarFiltro(
                  value,
                  campo,
                  campo === 'sem_monitor' ? false : valores.filter(x => x !== v)
                ))}
              >
                {nome}
                {campo === 'sem_monitor' ? '' : `: ${label}`}
                {zero ? ' · 0 — sem resultados' : ''}
                {' ×'}
              </button>
            )
          })
        )}
        <button type="button" onClick={() => onChange({})}>
          Limpar todos os filtros
        </button>
      </div>
    </div>
  )
}

function Campo({ campo, opcoes, selecionados, mudar }) {
  const lista = opcoesComSelecionados(
    opcoes,
    selecionados,
    v => campo.campo === 'posicoes' ? posicoes[v - 1] : String(v)
  )

  return (
    <div className={styles.field}>
      <label htmlFor={`filtro-${campo.campo}`}>{campo.label}</label>
      <Select
        isMulti
        inputId={`filtro-${campo.campo}`}
        className={styles.select}
        classNamePrefix="distribuicao-select"
        options={lista}
        value={lista.filter(o => selecionados.includes(o.value))}
        getOptionLabel={textoOpcao}
        closeMenuOnSelect={false}
        placeholder="Buscar ou selecionar…"
        maxMenuHeight={220}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={{
          menuPortal: base => ({ ...base, zIndex: 100, fontSize: '.85rem' }),
        }}
        noOptionsMessage={() => 'Nenhuma opção para os demais filtros'}
        onChange={valores => mudar(campo.campo, valores.map(o => o.value))}
      />
    </div>
  )
}

export default function FiltrosDistribuicao({
  catalogo,
  value,
  onChange,
  consulta,
  lembrar,
  rotulos,
}) {
  const [aberto, setAberto] = useState(null)
  const painel = useRef(null)

  useLayoutEffect(() => {
    if (!aberto) return
    const grupo = painel.current?.querySelector('details[open]')
    const acionador = grupo?.querySelector(':scope > summary')
    const conteudo = grupo?.querySelector(':scope > div')
    if (!acionador || !conteudo) return

    const posicionar = () => {
      const margem = 8, intervalo = 8
      const larguraJanela = document.documentElement.clientWidth
      const alturaJanela = window.innerHeight
      const referencia = acionador.getBoundingClientRect()
      // O painel fixo escapa do overflow do layout; a âncora é sempre o
      // acionador aberto, inclusive quando os filtros quebram em duas linhas.
      const largura = Math.min(
        aberto === 'localizacao' ? 420 : aberto === 'responsavel' ? 480 : 760,
        larguraJanela - margem * 2
      )
      conteudo.style.width = `${largura}px`

      const limite = Math.min(
        alturaJanela * (aberto === 'localizacao' ? .6 : .65),
        aberto === 'localizacao' ? 400 : 600
      )
      const altura = Math.min(conteudo.scrollHeight + 2, limite)
      const abaixo = alturaJanela - referencia.bottom - intervalo - margem
      const acima = referencia.top - intervalo - margem
      const abrirAcima = abaixo < altura && acima > abaixo
      const disponivel = Math.max(0, abrirAcima ? acima : abaixo)
      conteudo.style.maxHeight = `${Math.min(limite, disponivel)}px`

      const alturaFinal = conteudo.getBoundingClientRect().height
      const topo = abrirAcima
        ? referencia.top - intervalo - alturaFinal
        : referencia.bottom + intervalo
      conteudo.style.left = `${
        Math.max(margem, Math.min(referencia.left, larguraJanela - largura - margem))
      }px`
      conteudo.style.top = `${
        Math.max(margem, Math.min(topo, alturaJanela - alturaFinal - margem))
      }px`
      conteudo.style.visibility = referencia.bottom <= 0
        || referencia.top >= alturaJanela
        || !referencia.width
        ? 'hidden'
        : 'visible'
    }

    posicionar()
    let frame
    const atualizar = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(posicionar)
    }
    const observador = new ResizeObserver(atualizar)
    observador.observe(acionador)
    observador.observe(conteudo)
    window.addEventListener('resize', atualizar)
    // Captura também a rolagem do main do aplicativo e dos painéis internos.
    window.addEventListener('scroll', atualizar, true)

    return () => {
      observador.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', atualizar)
      window.removeEventListener('scroll', atualizar, true)
    }
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const fechar = e => {
      if (e.type === 'keydown' && e.key === 'Escape' && !e.defaultPrevented) {
        painel.current?.querySelector('details[open] > summary')?.focus()
        setAberto(null)
      } else if (
        e.type === 'pointerdown'
        && !painel.current?.contains(e.target)
        && !e.target.closest('[class*="distribuicao-select__"]')
      ) setAberto(null)
    }
    document.addEventListener('pointerdown', fechar)
    document.addEventListener('keydown', fechar)

    return () => {
      document.removeEventListener('pointerdown', fechar)
      document.removeEventListener('keydown', fechar)
    }
  }, [aberto])

  const [buscaLocal, setBuscaLocal] = useState('')
  const [ufsAbertas, setUfsAbertas] = useState([])
  const opcoes = consulta.data || {}

  const mudar = (campo, valores) => {
    for (const valor of Array.isArray(valores) ? valores : []) {
      const o = opcoes[campo]?.find(o => o.value === valor)
      if (o) lembrar(
        `${campo}:${valor}`,
        o.label + (campo === 'municipios' ? `/${o.sigla}` : '')
      )
    }
    onChange(mudarFiltro(value, campo, valores))
  }

  const lista = campo => opcoesComSelecionados(
    opcoes[campo],
    value[campo],
    v => rotuloValor(campo, v, catalogo, opcoes, rotulos)
  ).map(o => {
    if (campo === 'ufs' && !o.nome) return {
      ...o,
      nome: catalogo.ufs.find(u => u.cod_uf === o.value)?.nome,
    }
    if (campo === 'municipios' && !o.cod_uf) {
      const sigla = o.label.split('/').at(-1)
      return {
        ...o,
        cod_uf: catalogo.ufs.find(u => u.sigla === sigla)?.cod_uf,
        sigla,
      }
    }
    return o
  })

  const municipios = lista('municipios')
  const ufs = lista('ufs')
  // Pais estruturais permitem ver filhos selecionados mesmo quando a faceta do pai é zero.
  for (const m of municipios) if (m.cod_uf && !ufs.some(u => u.value === m.cod_uf)) {
    const uf = catalogo.ufs.find(u => u.cod_uf === m.cod_uf)
    ufs.push({
      value: m.cod_uf,
      label: uf?.sigla || m.sigla,
      nome: uf?.nome,
      total: consulta.data ? 0 : undefined,
    })
  }

  const monitores = lista('monitores').map(m => ({
    ...m,
    setor: m.setor
      || catalogo.monitores.find(u => u.id_usuario === m.value)?.setor
      || 'Sem setor',
  }))

  const check = (campo, o, label = o.label, herdado = false) => (
    <label
      key={o.value}
      className={`${styles.check} ${o.total === 0 ? styles.zeroOption : ''}`}
    >
      <input
        type="checkbox"
        checked={herdado || (value[campo] || []).includes(o.value)}
        disabled={herdado}
        title={herdado
          ? 'Incluído na UF inteira. Desmarque a UF para escolher municípios.'
          : undefined}
        onChange={() => mudar(campo, alternar(value[campo], o.value))}
      />
      <span>
        {textoOpcao({ ...o, label })}
        {o.ativo === false ? ' (usuário inativo)' : ''}
      </span>
    </label>
  )

  const limpar = campos => (
    <button
      type="button"
      className={styles.clearFilter}
      disabled={!campos.some(c => value[c]?.length || value[c] === true)}
      onClick={() => onChange(campos.reduce((f, c) => mudarFiltro(f, c, false), value))}
    >
      Limpar este filtro
    </button>
  )

  const principal = ['nr_instrumento', 'nr_proposta', 'tipo_instrumento']
  let tituloPrioridades = 'Prioridade de qualquer monitor'
  if (value.monitores?.length) {
    tituloPrioridades = 'Prioridade dos monitores selecionados'
  } else if (value.setores?.length) {
    tituloPrioridades = 'Prioridade dos monitores dos setores selecionados'
  }
  const prioridades = (
    <fieldset className={`${styles.operationForm} ${styles.priorityFilter}`}>
      <legend>{tituloPrioridades}</legend>
      <small>Sem restrição quando nenhuma prioridade está marcada.</small>
      <div className={styles.priorityChoices}>
        {lista('posicoes').map(p => check('posicoes', p))}
      </div>
    </fieldset>
  )

  const busca = textoBusca(buscaLocal.trim())
  const ufsVisiveis = ufs.filter(uf =>
    textoBusca(`${uf.label} ${uf.nome}`).includes(busca)
    || municipios.some(m => m.cod_uf === uf.value && textoBusca(m.label).includes(busca))
  )
  const secoes = {
    localizacao: (
      <>
        {limpar(['ufs', 'municipios'])}
        <input
          type="search"
          aria-label="Buscar UF ou município"
          placeholder="Buscar UF ou município…"
          value={buscaLocal}
          onChange={e => setBuscaLocal(e.target.value)}
        />
        <div className={styles.hierarchyScroll}>
          {ufsVisiveis.map(uf => {
            const filhos = municipios.filter(m => m.cod_uf === uf.value)
            const inteira = (value.ufs || []).includes(uf.value)
            const parcial = !inteira && filhos.some(m => value.municipios?.includes(m.value))
            const expandida = ufsAbertas.includes(uf.value)
            const ufEncontrada = textoBusca(`${uf.label} ${uf.nome}`).includes(busca)

            return (
              <div key={uf.value} className={styles.locationGroup}>
                <div className={styles.locationRow}>
                  <label
                    className={`${styles.check} ${uf.total === 0 ? styles.zeroOption : ''}`}
                  >
                    <input
                      type="checkbox"
                      aria-label={`${uf.label} — ${uf.nome || uf.label} (UF inteira)`}
                      checked={inteira}
                      aria-checked={parcial ? 'mixed' : inteira}
                      ref={el => { if (el) el.indeterminate = parcial }}
                      onChange={() => mudar('ufs', alternar(value.ufs, uf.value))}
                    />
                    <span>{uf.label} — {uf.nome}</span>
                    <small>{uf.total ?? '…'}</small>
                  </label>
                  <button
                    type="button"
                    aria-label={`Municípios de ${uf.label}`}
                    aria-expanded={expandida}
                    aria-controls={`municipios-${uf.value}`}
                    onClick={() => setUfsAbertas(anteriores => alternar(anteriores, uf.value))}
                  >
                    {expandida ? '▾' : '▸'}
                  </button>
                </div>
                {expandida && (
                  <div id={`municipios-${uf.value}`} className={styles.locationChildren}>
                    {filhos
                      .filter(m => ufEncontrada || textoBusca(m.label).includes(busca))
                      .map(m => check('municipios', m, m.label, inteira))}
                    {!filhos.length && !consulta.isPending && !consulta.isFetching && (
                      <small>Sem municípios para os demais filtros.</small>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {!ufsVisiveis.length && <p>Nenhuma localização encontrada.</p>}
        </div>
      </>
    ),
    responsavel: (
      <>
        <div className={styles.field}>
          <label htmlFor="filtro-monitores">Monitores atuais</label>
          <Select
            isMulti
            inputId="filtro-monitores"
            className={styles.select}
            classNamePrefix="distribuicao-select"
            options={monitores}
            value={monitores.filter(m => value.monitores?.includes(m.value))}
            getOptionLabel={m => textoOpcao({
              ...m,
              label: `${m.label} · ${m.setor}${m.ativo === false ? ' · Inativo' : ''}`,
            })}
            filterOption={({ data }, termo) =>
              textoBusca(`${data.label} ${data.setor}`).includes(textoBusca(termo))
            }
            closeMenuOnSelect
            placeholder="Buscar por nome ou setor…"
            maxMenuHeight={180}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              menuPortal: base => ({ ...base, zIndex: 100, fontSize: '.85rem' }),
            }}
            noOptionsMessage={() => 'Nenhum monitor para os demais filtros'}
            onChange={valores => mudar('monitores', valores.map(m => m.value))}
          />
        </div>
        {!!value.monitores?.length && (
          <>
            <p className={styles.filterHint}>
              Qualquer um dos monitores selecionados, nas prioridades abaixo, no mesmo vínculo.
            </p>
            {prioridades}
          </>
        )}
        <details className={styles.responsibilityMore}>
          <summary>
            Outros critérios
            {value.setores?.length
              || value.sem_monitor
              || (!value.monitores?.length && value.posicoes?.length)
              ? ' · ativos'
              : ''}
          </summary>
          <Campo
            campo={{ campo: 'setores', label: 'Restringir por setor' }}
            opcoes={lista('setores')}
            selecionados={value.setores || []}
            mudar={mudar}
          />
          {!!value.setores?.length && (
            <p className={styles.filterHint}>
              O mesmo vínculo deve pertencer a um dos setores selecionados
              {value.monitores?.length ? ' e a um dos monitores escolhidos' : ''}.
            </p>
          )}
          {!value.monitores?.length && prioridades}
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={!!value.sem_monitor}
              onChange={e => mudar('sem_monitor', e.target.checked)}
            />
            {textoOpcao(opcoes.sem_monitor?.[0] || {
              label: 'Sem monitor ativo',
              total: consulta.data ? 0 : undefined,
            })}
          </label>
        </details>
        {limpar(['setores', 'monitores', 'posicoes', 'sem_monitor'])}
      </>
    ),
    instrumento: (
      <div className={styles.filterGrid}>
        {catalogo.campos.filter(c => principal.includes(c.campo)).map(c => (
          <Campo
            key={c.campo}
            campo={c}
            opcoes={opcoes[c.campo]}
            selecionados={value[c.campo] || []}
            mudar={mudar}
          />
        ))}
      </div>
    ),
    avancada: (
      <div className={styles.filterGrid}>
        {catalogo.campos.filter(c => !principal.includes(c.campo)).map(c => (
          <Campo
            key={c.campo}
            campo={c}
            opcoes={opcoes[c.campo]}
            selecionados={value[c.campo] || []}
            mudar={mudar}
          />
        ))}
      </div>
    ),
  }
  const ordem = ['localizacao', 'responsavel', 'instrumento', 'avancada']

  return (
    <>
      <div role="status" aria-live="polite" className={styles.srOnly}>
        {consulta.isPending || consulta.isFetching
          ? 'Atualizando opções…'
          : 'Opções atualizadas. Contagens considerando os demais filtros.'}
      </div>
      {consulta.isError && (
        <p role="alert">
          {'Não foi possível carregar as opções. '}
          <button type="button" onClick={() => consulta.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      <div ref={painel} className={styles.hierarchies}>
        {ordem.map(id => {
          let titulo = 'Filtros avançados'
          let tituloPainel = 'Combine as opções'
          let classePainel = ''
          if (id === 'localizacao') {
            titulo = 'Localização · UF e município'
            tituloPainel = 'Localização'
            classePainel = styles.locationPopover
          } else if (id === 'responsavel') {
            titulo = 'Responsabilidade atual'
            tituloPainel = 'Responsabilidade atual'
            classePainel = styles.responsibilityPopover
          } else if (id === 'instrumento') {
            titulo = 'Identificação do instrumento'
          }

          return (
            <details key={id} className={styles.tree} open={aberto === id}>
              <summary onClick={e => {
                e.preventDefault()
                setAberto(aberto === id ? null : id)
              }}>
                {titulo}
              </summary>
              <div className={`${styles.filterContent} ${classePainel}`}>
                <div className={styles.popoverTitle}>
                  <strong>{tituloPainel}</strong>
                  <button
                    type="button"
                    aria-label="Fechar filtros"
                    onClick={() => {
                      painel.current?.querySelector('details[open] > summary')?.focus()
                      setAberto(null)
                    }}
                  >
                    Concluir
                  </button>
                </div>
                {secoes[id]}
              </div>
            </details>
          )
        })}
      </div>
    </>
  )
}
