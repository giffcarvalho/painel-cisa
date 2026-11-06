import { useMemo } from 'react'
import Select from 'react-select'
import { nomePosicao, quantidadeInstrumentos, tecnicoValido } from './preparacao'
import { textoBusca } from './filtrosContextuais'
import styles from './distribuicao.module.css'

const posicoes = [1, 2, 3]
const semMonitor = {
  value: null,
  label: 'Sem monitor',
  descricao: 'Esta posição ficará vazia em todos os instrumentos.',
}
const temMonitor = valor => valor !== null && valor !== undefined
const mesmoId = (a, b) => temMonitor(a) && temMonitor(b) && String(a) === String(b)

function ListaResponsaveis({ lista }) {
  return (
    <ul className={styles.currentMonitors}>
      {lista.map(m => (
        <li key={m.id_usuario ?? 'vazio'}>
          <span>
            {m.nome}{m.ativo === false && <small> · Cadastro desativado</small>}
          </span>
          <small>{quantidadeInstrumentos(m.total)}</small>
        </li>
      ))}
    </ul>
  )
}

function ResumoPosicao({ posicao, total }) {
  const lista = [
    ...posicao.monitores,
    ...(posicao.semMonitor
      ? [{ id_usuario: null, nome: 'Sem monitor', total: posicao.semMonitor }]
      : []),
  ]
  let situacao
  if (posicao.comum && total) {
    situacao = total === 1 ? 'Responsável atual' : 'Comum a todos'
  } else {
    situacao = posicao.diferentes ? 'Responsáveis diferentes' : 'Vínculos exigem revisão'
  }

  return (
    <div className={styles.currentPosition} data-posicao-atual={posicao.posicao}>
      <div className={styles.positionHeading}>
        <h4>{nomePosicao(posicao.posicao)}</h4>
        <small>{situacao}</small>
      </div>
      <ListaResponsaveis lista={lista.slice(0, 3)} />
      {lista.length > 3 && (
        <details className={styles.positionDetails}>
          <summary>Ver mais {lista.length - 3} responsáveis</summary>
          <ListaResponsaveis lista={lista.slice(3)} />
        </details>
      )}
      {!lista.length && <p className={styles.overviewHint}>Nenhum vínculo encontrado.</p>}
    </div>
  )
}

export default function OperacoesDistribuicao({
  monitores,
  base,
  distribuicao,
  onChange,
  panorama,
  onSelecao,
  erros = [],
  ocupada = false,
}) {
  const { grupos, opcoes } = useMemo(() => {
    const atuais = new Map(panorama.monitoresAtuais.map(m => [String(m.id_usuario), m]))
    const unicos = new Map(
      [...panorama.monitoresAtuais, ...monitores].map(m => [String(m.id_usuario), m]),
    )
    const tecnicos = [...unicos.values()]
      .filter(m => atuais.has(String(m.id_usuario)) || tecnicoValido(m))
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'))
    const opcoes = tecnicos.map(m => {
      const atual = atuais.get(String(m.id_usuario))
      const elegivel = tecnicoValido(m)
        && monitores.some(c => c.id_usuario === m.id_usuario && tecnicoValido(c))
      const vinculos = atual
        ? posicoes.filter(p => atual.posicoes[p])
          .map(p => `${nomePosicao(p)} em ${quantidadeInstrumentos(atual.posicoes[p])}`)
          .join(' · ')
        : ''
      const situacao = !elegivel
        ? 'Indisponível para destino: cadastro inexistente, inconsistente ou perfil incompatível'
        : m.ativo === false ? 'Cadastro desativado' : ''
      const descricao = [vinculos, situacao].filter(Boolean).join(' · ')

      return {
        value: m.id_usuario,
        label: m.nome,
        setor: m.setor || 'Sem setor',
        descricao,
        atual: !!atual,
        elegivel,
        busca: textoBusca(`${m.nome} ${m.setor || ''}`),
      }
    })

    return {
      opcoes,
      grupos: [
        { label: 'Monitores já vinculados', options: opcoes.filter(o => o.atual) },
        { label: 'Outros técnicos', options: opcoes.filter(o => !o.atual) },
      ].filter(g => g.options.length),
    }
  }, [monitores, panorama.monitoresAtuais])

  const mudar = (posicao, opcao) => onChange({
    ...distribuicao,
    [posicao]: opcao ? opcao.value : undefined,
  })
  let errosVisiveis
  if (typeof erros === 'string') {
    errosVisiveis = [erros].filter(Boolean)
  } else {
    errosVisiveis = Array.isArray(erros) ? erros : Object.values(erros).flat().filter(Boolean)
  }
  const problemasAtuais = panorama.problemas || []
  const inconsistenciasAtuais = panorama.inconsistencias || []
  const avisos = monitores.filter(m => (
    m.ativo === false && posicoes.some(p => distribuicao[p] === m.id_usuario)
  ))
  const descricaoAtual = panorama.comum
    ? panorama.total === 1
      ? 'Responsáveis atuais deste instrumento.'
      : `Distribuição comum aos ${quantidadeInstrumentos(panorama.total)}.`
    : 'Contagens de toda a seleção, incluindo outras páginas.'

  return (
    <>
      <div className={styles.scopeBar}>
        <strong>
          {quantidadeInstrumentos(base.length)} {base.length === 1 ? 'selecionado' : 'selecionados'}
        </strong>
        <button type="button" disabled={ocupada} onClick={onSelecao}>Alterar seleção</button>
      </div>
      {panorama.diferentes && (
        <p className={styles.mixedNotice} role="status">
          Os {quantidadeInstrumentos(panorama.total)} possuem responsáveis diferentes.
          A nova distribuição substituirá as atribuições atuais de todos eles.
        </p>
      )}
      <div className={styles.workspace}>
        <section className={styles.monitorOverview} aria-labelledby="distribuicao-atual-titulo">
          <h3 id="distribuicao-atual-titulo">Distribuição atual</h3>
          <p className={styles.overviewHint}>{descricaoAtual}</p>
          {!!problemasAtuais.length && (
            <div className={styles.validationErrors} role="alert">
              <strong>Vínculos atuais exigem revisão</strong>
              <details className={styles.positionDetails}>
                <summary>Consultar inconsistências da seleção ({problemasAtuais.length})</summary>
                <ul>{problemasAtuais.map(problema => <li key={problema}>{problema}</li>)}</ul>
              </details>
            </div>
          )}
          {!!inconsistenciasAtuais.length && (
            <details className={styles.positionDetails}>
              <summary>
                Inconsistências que a redistribuição pode resolver ({inconsistenciasAtuais.length})
              </summary>
              <ul>
                {inconsistenciasAtuais.map(problema => <li key={problema}>{problema}</li>)}
              </ul>
            </details>
          )}
          {panorama.posicoes.map(posicao => (
            <ResumoPosicao key={posicao.posicao} posicao={posicao} total={panorama.total} />
          ))}
        </section>
        <section className={styles.configuration} aria-labelledby="nova-distribuicao-titulo">
          <h3 id="nova-distribuicao-titulo">Nova distribuição</h3>
          <p className={styles.overviewHint}>
            Defina as três posições para todos os instrumentos. Nas reservas,
            escolha “Sem monitor” para deixar a posição vazia.
          </p>
          <div className={styles.distributionFields}>
            {posicoes.map(posicao => {
              const atual = panorama.posicoes.find(p => p.posicao === posicao)
              const valor = distribuicao[posicao]
              const indefinido = valor === undefined
              const misto = !!atual?.diferentes
              const bloqueiaVazio = posicao === 2 && temMonitor(distribuicao[3])
              const selecionado = valor === null
                ? semMonitor
                : opcoes.find(o => mesmoId(o.value, valor)) || (temMonitor(valor) ? {
                  value: valor,
                  label: monitores.find(m => mesmoId(m.id_usuario, valor))?.nome
                    || panorama.monitoresAtuais.find(m => mesmoId(m.id_usuario, valor))?.nome
                    || `Monitor ${valor}`,
                  descricao: 'Cadastro indisponível. Escolha um técnico válido.',
                } : null)
              const nomeAtual = misto
                ? 'Responsáveis diferentes'
                : atual?.monitores[0]?.nome || 'Sem monitor'
              const igualAtual = atual?.comum
                && (valor === null ? atual.valor === null : mesmoId(valor, atual.valor))
              let ajuda
              if (indefinido) {
                if (misto) {
                  ajuda = 'Posição ainda não definida; escolha um monitor ou, nas reservas, “Sem monitor”.'
                } else if (problemasAtuais.length) {
                  ajuda = `Atual: ${nomeAtual}. Vínculos atuais exigem revisão. Defina o destino.`
                } else {
                  ajuda = `Atual em todos: ${nomeAtual}. Defina o destino.`
                }
              } else {
                ajuda = igualAtual ? `Valor atual em todos: ${nomeAtual}.` : `Atual: ${nomeAtual}.`
              }

              return (
                <div
                  key={posicao}
                  className={styles.field}
                  data-posicao={posicao}
                  data-estado={indefinido ? 'indefinido' : valor === null ? 'sem-monitor' : 'definido'}
                >
                  <div className={styles.fieldHeading}>
                    <label htmlFor={`nova-distribuicao-${posicao}`}>{nomePosicao(posicao)}</label>
                    <small>{posicao === 1 ? 'Obrigatório' : 'Opcional · defina o destino'}</small>
                  </div>
                  <Select
                    isDisabled={ocupada}
                    inputId={`nova-distribuicao-${posicao}`}
                    instanceId={`nova-distribuicao-${posicao}`}
                    className={styles.select}
                    classNamePrefix="distribuicao-select"
                    options={posicao === 1
                      ? grupos
                      : [{ label: 'Posição vazia', options: [semMonitor] }, ...grupos]}
                    value={selecionado}
                    onChange={opcao => mudar(posicao, opcao)}
                    isClearable={!bloqueiaVazio}
                    placeholder={misto
                      ? 'Responsáveis diferentes — definir novo monitor'
                      : 'Definir novo monitor…'}
                    noOptionsMessage={() => 'Nenhum técnico encontrado'}
                    filterOption={(opcao, busca) => (
                      (opcao.data.busca || textoBusca(opcao.label)).includes(textoBusca(busca))
                    )}
                    isOptionDisabled={opcao => opcao.value === null
                      ? bloqueiaVazio
                      : !opcao.elegivel
                        || (posicao === 3 && !temMonitor(distribuicao[2]))
                        || posicoes.some(p => (
                          p !== posicao && mesmoId(distribuicao[p], opcao.value)
                        ))}
                    getOptionValue={opcao => opcao.value === null ? 'sem-monitor' : String(opcao.value)}
                    formatOptionLabel={(opcao, { context }) => (
                      <span className={styles.monitorOption}>
                        <span>
                          {opcao.label}{opcao.setor && <small> · {opcao.setor}</small>}
                        </span>
                        {opcao.descricao && context === 'menu' && <small>{opcao.descricao}</small>}
                      </span>
                    )}
                    aria-describedby={`distribuicao-ajuda-${posicao}`}
                  />
                  <small id={`distribuicao-ajuda-${posicao}`} className={styles.fieldHelp}>
                    {ajuda}
                    {posicao === 3 && !temMonitor(distribuicao[2])
                      ? ' Escolha a Reserva 1 antes de preencher a Reserva 2.' : ''}
                    {bloqueiaVazio
                      ? ' Para esvaziar a Reserva 1, escolha “Sem monitor” na Reserva 2 primeiro.' : ''}
                  </small>
                </div>
              )
            })}
          </div>
          {!!avisos.length && (
            <p role="status" className={styles.localNotice}>
              {avisos.map(m => `Cadastro desativado: ${m.nome}.`).join(' ')}
            </p>
          )}
          {!!errosVisiveis.length && (
            <div className={styles.validationErrors} role="alert">
              <strong>Revise a nova distribuição</strong>
              <ul>{errosVisiveis.map(erro => <li key={erro}>{erro}</li>)}</ul>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
