import { memo, useState } from 'react'
import FiltrosDistribuicao, { ResumoFiltros } from './FiltrosDistribuicao'
import useOpcoesContextuais from './useOpcoesContextuais'
import { nomePosicao } from './preparacao'
import styles from './distribuicao.module.css'

const LinhaInstrumento = memo(function LinhaInstrumento({ i, disabled, dispatch }) {
  const territorios = i.territorios || []
  const principal = i.monitores
    .filter(m => m.ordem_prioridade === 1)
    .map(m => m.nome)
    .join(', ')
  const reservas = i.monitores.filter(m => m.ordem_prioridade !== 1)

  return (
    <tr>
      <td>
        <input
          type="checkbox"
          aria-label={`Selecionar ${i.tipo_instrumento} ${i.numero}`}
          disabled={disabled}
          checked={i.selecionado}
          onChange={e => dispatch({
            tipo: 'itens',
            chaves: [i.chave],
            marcar: e.target.checked,
          })}
        />
      </td>
      <td>
        <strong>{i.numero}</strong>
        <small>{i.nr_proposta || 'Sem proposta'}</small>
      </td>
      <td>
        <span className={styles.truncate} title={i.tipo_instrumento}>
          {i.tipo_instrumento || '—'}
        </span>
      </td>
      <td>
        <span
          className={styles.truncate}
          title={territorios.map(t => `${t.municipio}/${t.uf}`).join(', ')}
        >
          {territorios.length
            ? `${territorios[0].municipio}/${territorios[0].uf}`
            : 'Não informado'}
        </span>
        {territorios.length > 1 && (
          <small>+ {territorios.length - 1} município(s)</small>
        )}
      </td>
      <td>
        <span className={styles.truncate} title={principal}>
          {principal || 'Sem principal'}
        </span>
      </td>
      <td>
        {reservas.length ? reservas.map((m, index) => (
          <small
            key={`${m.id_usuario}:${index}`}
            className={styles.truncate}
            title={`${nomePosicao(m.ordem_prioridade)}: ${m.nome}`}
          >
            {nomePosicao(m.ordem_prioridade)}: {m.nome}
          </small>
        )) : '—'}
      </td>
      <td>
        <span className={styles.truncate} title={i.atributos.situacao_atual}>
          {i.atributos.situacao_atual || '—'}
        </span>
        <details className={styles.rowDetails}>
          <summary>
            {i.alertas.length ? `${i.alertas.length} aviso(s) · detalhes` : 'Detalhes'}
          </summary>
          <p>{i.atributos.nome_proponente || 'Proponente não informado'}</p>
          {territorios.map(t => (
            <small key={t.cod_municipio}>{t.municipio}/{t.uf}</small>
          ))}
          {i.alertas.map(a => <small key={a}>{a}</small>)}
        </details>
      </td>
    </tr>
  )
})

export default function SelecaoDistribuicao({
  catalogo,
  consulta,
  estado,
  dispatch,
  ocupada,
  verSelecao,
  onVerSelecao,
  ativa,
  onContinuar,
}) {
  const [rotulos, setRotulos] = useState({})
  const opcoes = useOpcoesContextuais(estado.filtros, ativa && !!catalogo.data)
  const lembrar = (chave, label) => setRotulos(prev => (
    prev[chave] === label ? prev : { ...prev, [chave]: label }
  ))
  const mudarFiltros = valor => dispatch({ tipo: 'filtros', valor })
  const dados = consulta.data
  const itens = dados?.items || []
  const selecionados = dados?.selecionados || 0
  const todos = itens.length > 0 && itens.every(i => i.selecionado)
  const parcial = !todos && itens.some(i => i.selecionado)
  const totalPaginas = Math.max(1, Math.ceil((dados?.total || 0) / 25))

  return (
    <>
      <h2 id="selecao-titulo">Selecione os instrumentos</h2>
      <div className={styles.selectionLayout}>
        <aside
          id="painel-filtros"
          className={styles.filterPanel}
          aria-label="Filtros de instrumentos"
        >
          {catalogo.isPending ? (
            <p role="status">Carregando filtros…</p>
          ) : catalogo.isError ? (
            <p role="alert">
              Não foi possível carregar os filtros.{' '}
              <button type="button" onClick={() => catalogo.refetch()}>
                Tentar novamente
              </button>
            </p>
          ) : (
            <fieldset disabled={ocupada} className={styles.operationForm}>
              <FiltrosDistribuicao
                catalogo={catalogo.data}
                value={estado.filtros}
                onChange={mudarFiltros}
                consulta={opcoes}
                lembrar={lembrar}
                rotulos={rotulos}
              />
            </fieldset>
          )}
        </aside>
        <fieldset disabled={ocupada} className={styles.operationForm}>
          <ResumoFiltros
            catalogo={catalogo.data}
            value={estado.filtros}
            onChange={mudarFiltros}
            opcoes={opcoes.data}
            rotulos={rotulos}
          />
        </fieldset>
        <div className={styles.results}>
          <div className={styles.toolbar}>
            <div aria-live="polite">
              <strong className={styles.selectionCount}>
                {selecionados} {selecionados === 1 ? 'selecionado' : 'selecionados'}
              </strong>
              <small>
                {consulta.isFetching
                  ? 'Consultando…'
                  : consulta.isError
                    ? 'Consulta indisponível'
                    : `${dados?.total_no_filtro ?? dados?.total ?? 0} encontrados`}
                {!!dados && selecionados > dados.selecionados_no_filtro
                  && ` · ${selecionados - dados.selecionados_no_filtro} selecionados fora dos filtros atuais`}
                {verSelecao && ` · Exibindo a seleção completa: ${dados?.total ?? 0}`}
              </small>
            </div>
            <button
              type="button"
              className={styles.primary}
              disabled={ocupada || consulta.isFetching || consulta.isError
                || !selecionados || !catalogo.data}
              onClick={onContinuar}
            >
              Continuar
            </button>
          </div>
          <div className={styles.selectionActions}>
            <button
              type="button"
              disabled={ocupada || consulta.isFetching || consulta.isError
                || !dados?.total || verSelecao}
              onClick={() => dispatch({ tipo: 'todos' })}
            >
              Selecionar todos os resultados
            </button>
            <button
              type="button"
              disabled={ocupada || consulta.isFetching || (!selecionados && !verSelecao)}
              onClick={onVerSelecao}
            >
              {verSelecao ? 'Ver resultados filtrados' : 'Revisar seleção'}
            </button>
            <button
              type="button"
              disabled={ocupada || consulta.isFetching || !selecionados}
              onClick={() => dispatch({ tipo: 'limparSelecao' })}
            >
              Limpar seleção
            </button>
            {estado.selecao.filtros !== null && (
              <small>Seleção mantida ao mudar os filtros.</small>
            )}
          </div>
          {consulta.isError && (
            <p role="alert" className={styles.error}>
              Não foi possível consultar os instrumentos.{' '}
              <button type="button" onClick={() => consulta.refetch()}>
                Tentar novamente
              </button>
            </p>
          )}
          <div
            className={`${styles.tableWrap} ${styles.selectionTable}`}
            aria-busy={consulta.isFetching}
          >
            <table>
              <caption className={styles.srOnly}>Instrumentos para seleção</caption>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos os instrumentos desta página"
                      ref={el => { if (el) el.indeterminate = parcial }}
                      checked={todos}
                      disabled={ocupada || consulta.isFetching || consulta.isError || !itens.length}
                      onChange={e => dispatch({
                        tipo: 'itens',
                        chaves: itens.map(i => i.chave),
                        marcar: e.target.checked,
                      })}
                    />
                  </th>
                  <th scope="col">Instrumento / proposta</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">UF / municípios</th>
                  <th scope="col">Principal</th>
                  <th scope="col">Reservas</th>
                  <th scope="col">Situação / detalhes</th>
                </tr>
              </thead>
              <tbody>
                {!consulta.isError && itens.map(i => (
                  <LinhaInstrumento
                    key={i.chave}
                    i={i}
                    disabled={ocupada || consulta.isFetching}
                    dispatch={dispatch}
                  />
                ))}
                {!consulta.isFetching && !consulta.isError && !itens.length && (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      Nenhum instrumento encontrado. Ajuste os filtros ou revise a seleção.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <span>
              Página {Math.min(estado.pagina + 1, totalPaginas)} de {totalPaginas}
            </span>
            <button
              type="button"
              disabled={ocupada || consulta.isFetching || estado.pagina === 0}
              onClick={() => dispatch({ tipo: 'pagina', valor: estado.pagina - 1 })}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={ocupada || consulta.isFetching || consulta.isError
                || (estado.pagina + 1) * 25 >= (dados?.total || 0)}
              onClick={() => dispatch({ tipo: 'pagina', valor: estado.pagina + 1 })}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
