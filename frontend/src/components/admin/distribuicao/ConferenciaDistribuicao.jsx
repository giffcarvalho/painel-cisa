import { useState } from 'react'
import { nomePosicao, quantidadeInstrumentos } from './preparacao'
import styles from './distribuicao.module.css'

const posicoes = [1, 2, 3]
const nomeMonitor = monitor => (
  monitor?.nome || (monitor ? `Monitor ${monitor.id_usuario}` : 'Sem monitor')
)
const naPosicao = (lista, posicao) => (
  (Array.isArray(lista) ? lista : []).filter(m => Number(m?.ordem_prioridade) === posicao)
)
const nomesNaPosicao = (lista, posicao) => (
  naPosicao(lista, posicao).map(nomeMonitor).join(', ') || 'Sem monitor'
)
const mesmoMonitor = (a, b) => a && b && String(a.id_usuario) === String(b.id_usuario)

function DistribuicaoCompleta({ linha, impedido }) {
  const observacoes = [...new Set([
    ...(linha.alertas || []).filter(alerta => !/usu[aá]rio inativo ou sem perfil t[eé]cnico/i.test(alerta)),
    ...(linha.rascunhos
      ? [`${linha.rascunhos} rascunho(s) de revisão em andamento; confira antes da aplicação.`]
      : []),
  ])]

  return (
    <div>
      <table className={styles.completeTable}>
        <caption>Distribuição completa · {linha.tipo_instrumento} {linha.numero}</caption>
        <thead>
          <tr>
            <th scope="col">Posição</th>
            <th scope="col">Atual</th>
            <th scope="col">Proposta</th>
          </tr>
        </thead>
        <tbody>
          {posicoes.map(p => (
            <tr key={p}>
              <th scope="row">{nomePosicao(p)}</th>
              <td>{nomesNaPosicao(linha.atual, p)}</td>
              <td>
                {impedido ? 'Pendente — exige correção' : nomesNaPosicao(linha.proposta, p)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {impedido && !!linha.atual.length && (
        <>
          <strong>Vínculos atuais consultados</strong>
          <ul>
            {linha.atual.map((m, indice) => {
              let descricao = 'Vínculo ilegível: dados indisponíveis.'
              if (m) {
                const prioridade = posicoes.includes(m.ordem_prioridade)
                  ? nomePosicao(m.ordem_prioridade)
                  : `Prioridade inválida (${m.ordem_prioridade ?? 'não informada'})`
                let cadastro = ''
                if (m.cadastro_encontrado === false) cadastro = ' · Cadastro inexistente'
                else if (m.ativo === false) cadastro = ' · Cadastro desativado'
                descricao = `${nomeMonitor(m)} · cadastro ${m.id_usuario ?? 'sem identidade'}`
                  + ` · ${prioridade}${cadastro}`
              }
              return <li key={indice}>{descricao}</li>
            })}
          </ul>
        </>
      )}
      {!!linha.problemas?.length && (
        <>
          <strong className={styles.errorText}>Impedimentos a corrigir</strong>
          <ul>{linha.problemas.map(problema => <li key={problema}>{problema}</li>)}</ul>
        </>
      )}
      {!!linha.avisos?.length && (
        <>
          <strong>Avisos administrativos</strong>
          <ul>{linha.avisos.map(aviso => <li key={aviso}>{aviso}</li>)}</ul>
        </>
      )}
      {!!linha.inconsistenciasResolvidas?.length && (
        <>
          <strong>Inconsistências resolvidas pela distribuição proposta</strong>
          <ul>
            {linha.inconsistenciasResolvidas.map(problema => <li key={problema}>{problema}</li>)}
          </ul>
        </>
      )}
      {!!observacoes.length && (
        <>
          <strong>Observações da consulta</strong>
          <ul>{observacoes.map(observacao => <li key={observacao}>{observacao}</li>)}</ul>
        </>
      )}
      {!!linha.alteracoes?.length && (
        <>
          <strong>Alterações detalhadas</strong>
          <ul>
            {linha.alteracoes.map(a => (
              <li key={a.posicao}>{nomePosicao(a.posicao)}: {a.detalhes || a.situacao}</li>
            ))}
          </ul>
          <p>
            Os vínculos retirados do estado final serão desativados na aplicação, sem exclusão física.
          </p>
        </>
      )}
    </div>
  )
}

export default function ConferenciaDistribuicao({ resumo }) {
  const [pagina, setPagina] = useState(0)
  const [status, setStatus] = useState('revisar')
  const [abertos, setAbertos] = useState([])
  const linhas = resumo.linhas
    .filter(l => {
      if (!status) return true
      if (status === 'revisar') return l.status !== 'sem alteração' || l.avisos?.length
      if (status === 'aviso') return l.avisos?.length
      return l.status === status
    })
    .sort((a, b) => (
      Number(b.status === 'com impedimento') - Number(a.status === 'com impedimento')
      || Number(b.status === 'com alteração') - Number(a.status === 'com alteração')
    ))
  const ultima = Math.max(0, Math.ceil(linhas.length / 25) - 1)
  const atual = Math.min(pagina, ultima)

  return (
    <>
      <p className={styles.reviewSummary}>
        <strong>
          {quantidadeInstrumentos(resumo.total)} {resumo.total === 1 ? 'selecionado' : 'selecionados'}
        </strong>
        <span>{resumo.alterados} com alteração</span>
        <span>{resumo.semMudancas} sem alteração</span>
        <span className={resumo.impedidos ? styles.errorText : undefined}>
          {resumo.impedidos} com impedimento
        </span>
        {!!resumo.comAvisos && <span>{resumo.comAvisos} com aviso</span>}
      </p>
      {!!resumo.impedidos && (
        <p role="alert" className={styles.errorText}>
          A distribuição final dos instrumentos com impedimento está pendente.{' '}
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              setStatus('com impedimento')
              setPagina(0)
            }}
          >
            Ver impedimentos
          </button>
        </p>
      )}
      <label className={styles.reviewFilter}>
        Exibir{' '}
        <select
          value={status}
          onChange={e => {
            setStatus(e.target.value)
            setPagina(0)
          }}
        >
          <option value="revisar">Alterações e alertas</option>
          <option value="">Todos os instrumentos</option>
          <option value="com alteração">Alterações propostas</option>
          <option value="sem alteração">Sem alteração</option>
          <option value="com impedimento">Com impedimento</option>
          <option value="aviso">Com aviso</option>
        </select>
      </label>
      <div className={styles.reviewTableWrap}>
        <table className={styles.reviewTable}>
          <caption className={styles.srOnly}>Comparação da distribuição por instrumento</caption>
          <thead>
            <tr>
              <th scope="col">Instrumento</th>
              <th scope="col">Posição</th>
              <th scope="col">Monitor atual</th>
              <th scope="col">Monitor proposto</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          {linhas.slice(atual * 25, (atual + 1) * 25).map(linha => {
            const impedido = linha.status === 'com impedimento' || !!linha.problemas?.length
            const aberto = abertos.includes(linha.chave)
            const alteracoes = impedido ? [] : (linha.alteracoes || []).filter(a => (
              !mesmoMonitor(a.atual, a.proposto) && (a.atual || a.proposto)
            ))
            const exibidas = alteracoes.length ? alteracoes : [null]

            return (
              <tbody key={linha.chave} className={styles.instrumentReview}>
                {exibidas.map((alteracao, indice) => (
                  <tr key={alteracao?.posicao ?? 'resumo'} className={styles.reviewChange}>
                    {indice === 0 && (
                      <td
                        rowSpan={exibidas.length}
                        className={styles.reviewInstrument}
                        data-label="Instrumento"
                      >
                        <strong>{linha.numero}</strong>
                        <small>{linha.tipo_instrumento}</small>
                        {!!linha.avisos?.length && <small>Aviso</small>}
                        {!!linha.inconsistenciasResolvidas?.length && (
                          <small>Inconsistência resolvida</small>
                        )}
                        <button
                          type="button"
                          className={styles.detailButton}
                          aria-expanded={aberto}
                          aria-controls={`detalhes-${linha.chave}`}
                          onClick={() => setAbertos(prev => (
                            aberto
                              ? prev.filter(chave => chave !== linha.chave)
                              : [...prev, linha.chave]
                          ))}
                        >
                          {aberto ? 'Ocultar detalhes' : 'Ver distribuição completa'}
                          <span className={styles.srOnly}> de {linha.tipo_instrumento} {linha.numero}</span>
                        </button>
                      </td>
                    )}
                    <td data-label="Posição">
                      {alteracao ? nomePosicao(alteracao.posicao) : 'Todas'}
                    </td>
                    <td data-label="Monitor atual">
                      {alteracao
                        ? nomeMonitor(alteracao.atual)
                        : impedido ? 'Consulte os detalhes' : 'Distribuição preservada'}
                    </td>
                    <td data-label="Monitor proposto">
                      {alteracao
                        ? nomeMonitor(alteracao.proposto)
                        : impedido
                          ? <strong className={styles.errorText}>Pendente</strong>
                          : 'Igual à atual'}
                    </td>
                    <td data-label="Situação">
                      {alteracao ? (
                        <span className={styles.changeStatus}>{alteracao.situacao}</span>
                      ) : impedido ? (
                        <strong className={styles.errorText}>
                          Impedimento · {linha.problemas.length}{' '}
                          {linha.problemas.length === 1 ? 'motivo' : 'motivos'}
                        </strong>
                      ) : linha.avisos?.length ? 'Sem alteração · Aviso' : 'Sem alteração'}
                    </td>
                  </tr>
                ))}
                <tr
                  hidden={!aberto}
                  id={`detalhes-${linha.chave}`}
                  className={styles.fullDistribution}
                >
                  <td colSpan={5}>
                    <DistribuicaoCompleta linha={linha} impedido={impedido} />
                  </td>
                </tr>
              </tbody>
            )
          })}
          {!linhas.length && (
            <tbody>
              <tr>
                <td colSpan={5} className={styles.empty}>
                  {resumo.semMudancas === resumo.total && status === 'revisar'
                    ? 'Todos os instrumentos já possuem a distribuição proposta. '
                      + 'Consulte “Sem alteração” ou “Todos os instrumentos” para ver os detalhes.'
                    : 'Nenhum instrumento nesta situação.'}
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
      <div className={styles.pagination}>
        <span>{quantidadeInstrumentos(linhas.length)} · Página {atual + 1} de {ultima + 1}</span>
        <button type="button" disabled={!atual} onClick={() => setPagina(atual - 1)}>
          Anterior
        </button>
        <button type="button" disabled={atual === ultima} onClick={() => setPagina(atual + 1)}>
          Próxima
        </button>
      </div>
    </>
  )
}
