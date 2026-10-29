import {
  diagnosticarDistribuicao,
  nomePosicao,
  panoramaMonitores,
  tecnicoValido,
} from './preparacao.js'

const posicoes = [1, 2, 3]
const ocupante = (lista, posicao) => lista.find(m => m?.ordem_prioridade === posicao) || null
const idOcupante = (lista, posicao) => ocupante(lista, posicao)?.id_usuario ?? null
const unicos = lista => [...new Set(lista)]

// Chaves de objetos e a ordem de leitura não afetam a comparação de referências.
const estavel = valor => {
  if (Array.isArray(valor)) return `[${valor.map(estavel).join(',')}]`
  if (valor && typeof valor === 'object') return `{${
    Object.keys(valor)
      .sort()
      .map(chave => `${JSON.stringify(chave)}:${estavel(valor[chave])}`)
      .join(',')
  }}`
  return JSON.stringify(valor)
}

const referencia = item => estavel({
  chave: item.chave,
  numero: item.numero,
  nr_proposta: item.nr_proposta,
  tipo_instrumento: item.tipo_instrumento,
  monitores: Array.isArray(item.monitores) ? item.monitores.map(estavel).sort() : item.monitores,
  alertas: [...(item.alertas || [])].sort(),
  rascunhos: item.rascunhos,
})

function problemasIdentidade(item) {
  const problemas = []
  if (typeof item.chave !== 'string' || !/^(instrumento|ted):[^:]+$/.test(item.chave)) {
    problemas.push(
      typeof item.chave === 'string' && item.chave.startsWith('proposta:')
        ? 'Instrumento sem número operacional; apenas a proposta está identificada.'
        : 'Instrumento sem identidade operacional válida.'
    )
  } else {
    const [tipo, numero] = item.chave.split(':')
    if (tipo === 'ted' && !/^\d+$/.test(numero))
      problemas.push('Identidade operacional de TED deve conter somente um número válido.')
    const normalizar = valor => tipo === 'ted'
      ? String(valor).replace(/\D/g, '').replace(/^0+(?=\d)/, '')
      : String(valor).trim()
    if (
      item.numero === null
      || item.numero === undefined
      || !String(item.numero).trim()
      || normalizar(numero) !== normalizar(item.numero)
    )
      problemas.push('Número do instrumento inconsistente com sua identidade operacional.')
  }

  for (const alerta of item.alertas || []) {
    if (/amb[ií]gua|identidade.*inconsistente|v[ií]nculos.*duplicados|prioridades.*inv[aá]lidas/i.test(alerta))
      problemas.push(alerta)
  }
  return problemas
}

function analisarItens(itens) {
  const grupos = new Map()
  for (const [indice, item] of itens.entries()) {
    // Referências ausentes nunca são fundidas entre si.
    const chave = typeof item.chave === 'string' && item.chave ? item.chave : Symbol(indice)
    if (!grupos.has(chave)) grupos.set(chave, {
      item,
      referencia: referencia(item),
      problemas: problemasIdentidade(item),
    })

    const grupo = grupos.get(chave)
    if (grupo.referencia !== referencia(item))
      grupo.problemas.push('Referências divergentes para o mesmo instrumento. Atualize a seleção antes de conferir.')
  }
  return [...grupos.values()].map(grupo => {
    const diagnostico = diagnosticarDistribuicao(grupo.item.monitores)
    return {
      ...grupo,
      problemas: unicos([...grupo.problemas, ...diagnostico.problemas]),
      inconsistencias: diagnostico.inconsistencias,
    }
  })
}

export function resumirDistribuicao(itens, monitores = []) {
  const grupos = analisarItens(itens)
  const base = grupos.map(g => g.item)
  const monitoresAtuais = panoramaMonitores(base, monitores)
  const problemas = unicos(grupos.flatMap(g => g.problemas))
  const inconsistencias = unicos(grupos.flatMap(g => g.inconsistencias))
  const resumoPosicoes = posicoes.map(posicao => {
    const encontrados = monitoresAtuais
      .filter(m => m.posicoes[posicao])
      .map(m => ({ ...m, total: m.posicoes[posicao] }))
    const valores = base.map(i =>
      idOcupante(Array.isArray(i.monitores) ? i.monitores : [], posicao)
    )
    const assinaturas = base.map(i => Array.isArray(i.monitores)
      ? estavel(
        i.monitores
          .filter(m => m?.ordem_prioridade === posicao)
          .map(m => m.id_usuario)
          .sort((a, b) => a - b)
      )
      : 'indisponível'
    )
    const diferentes = new Set(assinaturas).size > 1
    const comum = !!base.length
      && !problemas.length
      && !inconsistencias.length
      && new Set(valores).size === 1

    return {
      posicao,
      monitores: encontrados,
      semMonitor: valores.filter(v => v === null).length,
      comum,
      diferentes,
      valor: comum ? valores[0] : undefined,
    }
  })

  return {
    total: base.length,
    comum: !!base.length && resumoPosicoes.every(p => p.comum),
    diferentes: resumoPosicoes.some(p => p.diferentes),
    posicoes: resumoPosicoes,
    monitoresAtuais,
    problemas,
    inconsistencias,
  }
}

// undefined exige decisão; null é uma escolha explícita de deixar sem monitor.
export function iniciarDistribuicao(itens, monitores = []) {
  return Object.fromEntries(
    resumirDistribuicao(itens, monitores).posicoes.map(p => [p.posicao, p.valor])
  )
}

export function validarDistribuicao(distribuicao, monitores = []) {
  const erros = []
  const valores = posicoes.map(p => distribuicao?.[p])
  for (const p of posicoes) {
    const valor = distribuicao?.[p]
    if (valor === undefined) erros.push(
      `${nomePosicao(p)} ainda não definida. ${p === 1 ? 'Escolha um técnico.' : 'Escolha um técnico ou Sem monitor.'}`
    )
    else if (p === 1 && valor === null)
      erros.push('Principal obrigatório. Escolha um técnico.')
    else if (valor !== null) {
      const encontrados = monitores.filter(m => m.id_usuario === valor)
      if (
        !Number.isInteger(valor)
        || valor <= 0
        || !encontrados.length
        || encontrados.some(m => !tecnicoValido(m))
      )
        erros.push(`${nomePosicao(p)}: monitor de destino inexistente, inconsistente ou sem perfil técnico.`)
      else if (new Set(encontrados.map(estavel)).size > 1)
        erros.push(`${nomePosicao(p)}: cadastro do monitor de destino apresenta referências divergentes.`)
    }
  }
  const preenchidos = valores.filter(v => v !== null && v !== undefined)
  if (new Set(preenchidos).size !== preenchidos.length)
    erros.push('O mesmo monitor não pode ocupar mais de uma posição.')
  if (
    distribuicao?.[3] !== null
    && distribuicao?.[3] !== undefined
    && (distribuicao?.[2] === null || distribuicao?.[2] === undefined)
  )
    erros.push('Reserva 2 permitida somente com Reserva 1.')
  if (distribuicao && Object.keys(distribuicao).some(p => !['1', '2', '3'].includes(p)))
    erros.push('A distribuição deve conter somente as prioridades 1, 2 e 3.')
  return unicos(erros)
}

function alteracoesPorInstrumento(atual, proposta) {
  return posicoes.filter(p => idOcupante(atual, p) !== idOcupante(proposta, p)).map(posicao => {
    const antes = ocupante(atual, posicao), depois = ocupante(proposta, posicao)
    const destinoAnterior = antes && proposta.find(m => m.id_usuario === antes.id_usuario)
    const origemNovo = depois && atual.find(m => m.id_usuario === depois.id_usuario)
    const situacoes = []
    if (antes) situacoes.push(
      destinoAnterior
        ? `${antes.nome} muda de ${nomePosicao(posicao)} para ${nomePosicao(destinoAnterior.ordem_prioridade)}`
        : `Remoção do vínculo de ${antes.nome}`
    )
    if (depois) situacoes.push(
      origemNovo
        ? `${depois.nome} muda de ${nomePosicao(origemNovo.ordem_prioridade)} para ${nomePosicao(posicao)}`
        : `Inclusão de ${depois.nome}`
    )

    const efeitos = []
    if (destinoAnterior || origemNovo) efeitos.push('Mudança de prioridade')
    if (antes && !destinoAnterior && depois && !origemNovo) efeitos.push('Substituição')
    else {
      if (antes && !destinoAnterior) efeitos.push('Remoção')
      if (depois && !origemNovo) efeitos.push('Inclusão')
    }
    return {
      posicao,
      atual: antes,
      proposto: depois,
      situacao: efeitos.join(' · '),
      detalhes: situacoes.join('; '),
    }
  })
}

// Uma única distribuição final é comparada com cada instrumento da seleção.
// Vínculos preservados retêm inclusive sua referência; nenhuma entrada é mutada.
export function conferirDistribuicao(itens, distribuicao, monitores = []) {
  const erros = validarDistribuicao(distribuicao, monitores)
  if (!itens.length) erros.push('Selecione ao menos um instrumento.')
  const linhas = analisarItens(itens).map(({ item, problemas: integridade, inconsistencias }) => {
    const atual = Array.isArray(item.monitores) ? item.monitores : []
    // O catálogo e os vínculos são consultados em momentos distintos. Não
    // aproveita metadados antigos para validar um destino contraditório com a
    // leitura atual. A ativação da conta não participa desta elegibilidade.
    const divergencias = atual.flatMap(m => {
      if (!m || !posicoes.some(p => distribuicao?.[p] === m.id_usuario)) return []
      const destino = monitores.find(c => c.id_usuario === m.id_usuario)
      const perfil = cadastro => typeof cadastro?.perfil === 'string'
        ? cadastro.perfil.trim().toLowerCase()
        : cadastro?.perfil
      return destino && (m.ativo !== destino.ativo || perfil(m) !== perfil(destino))
        ? [`Cadastro de ${m.nome || `Monitor ${m.id_usuario}`} apresenta situação administrativa ou perfil divergente entre a seleção e o catálogo. Atualize a página e prepare novamente a distribuição para este destino.`]
        : []
    })
    const problemas = unicos([...integridade, ...erros, ...divergencias])
    const proposta = problemas.length ? atual : posicoes.flatMap(posicao => {
      const id = distribuicao[posicao]
      if (id === null) return []
      const preservado = atual.find(m =>
        m.id_usuario === id && m.ordem_prioridade === posicao
      )
      return [
        preservado || { ...monitores.find(m => m.id_usuario === id), ordem_prioridade: posicao },
      ]
    })
    const alteracoes = problemas.length ? [] : alteracoesPorInstrumento(atual, proposta)
    const avisos = problemas.length ? [] : unicos(
      proposta
        .filter(m => monitores.find(c => c.id_usuario === m.id_usuario)?.ativo === false)
        .map(m => `Cadastro desativado: ${m.nome || `Monitor ${m.id_usuario}`}.`)
    )
    const status = problemas.length
      ? 'com impedimento'
      : alteracoes.length
        ? 'com alteração'
        : 'sem alteração'

    return {
      ...item,
      atual,
      proposta,
      status,
      problemas,
      alteracoes,
      avisos,
      inconsistenciasResolvidas: problemas.length ? [] : inconsistencias,
    }
  })

  return {
    linhas,
    total: linhas.length,
    alterados: linhas.filter(l => l.status === 'com alteração').length,
    semMudancas: linhas.filter(l => l.status === 'sem alteração').length,
    impedidos: linhas.filter(l => l.status === 'com impedimento').length,
    comAvisos: linhas.filter(l => l.avisos.length).length,
    erros,
  }
}
