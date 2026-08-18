import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronDown, History, Plus, Save, Search, Send, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { revisaoInstrumentoApi } from '@/api/revisaoInstrumento'
import { useAuth } from '@/context/auth/useAuth'
import styles from './RevisaoInstrumento.module.css'
import { formatPercentualPontos } from '../../utils/formatters'

const ACOES_MUNICIPIO = [
  { value: 'manter', label: 'Manter', icon: Check },
  { value: 'remover', label: 'Remover', icon: X },
]

const LABELS_TECNICOS = {
  contrato_repasse: 'Contrato de Repasse',
  termo_execucao_descentralizada: 'Termo de Execução Descentralizada',
  ted: 'TED',
  termo_compromisso: 'Termo de Compromisso',
}

const ACOES_LOCALIDADE_EXISTENTE = [
  { value: 'manter', label: 'Manter', icon: Check },
  { value: 'remover', label: 'Remover', icon: X },
  { value: 'corrigir', label: 'Corrigir' },
]

const RELACOES_INSTRUMENTO = [
  { value: 'nao_analisada', label: 'Não analisada' },
  { value: 'sem_conflito_aparente', label: 'Sem conflito aparente' },
  { value: 'possivel_sobreposicao', label: 'Possível sobreposição' },
]

const CONFIRMACOES_STATUS = [
  { value: 'nao_confirmada', label: 'Não confirmada' },
  { value: 'sem_conflito', label: 'Sem conflito' },
  { value: 'sobreposicao_confirmada', label: 'Sobreposição confirmada' },
]

const MUNICIPIO_NOVO_INICIAL = {
  cod_municipio: '',
  nome_municipio: '',
  cod_uf: '',
  sigla_uf: '',
  nome_uf: '',
}

const LOCALIDADE_NOVA_INICIAL = {
  nome_localidade_informada: '',
  qtde_familias_ben_sugerida: '',
}

function valorOuTraco(value) {
  return valorAusente(value) ? '-' : value
}

function valorAusente(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

function formatarValorTecnico(value) {
  const texto = String(value ?? '').trim()
  if (!texto) return '-'

  const chave = texto.toLowerCase()
  if (LABELS_TECNICOS[chave]) return LABELS_TECNICOS[chave]

  if (!texto.includes('_')) return texto

  return texto
    .split('_')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
    .join(' ')
}

function formatarMunicipioUf(nome, uf) {
  if (!nome) return '-'
  if (String(nome).includes('/')) return nome
  return uf ? `${nome}/${uf}` : nome
}

function formatarValorMonetario(value) {
  if (value === null || value === undefined || value === '') return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

function numeroOuNull(value) {
  if (value === null || value === undefined || value === '') return null

  const numero = Number(value)
  return Number.isNaN(numero) ? null : numero
}

function percentualParaBarra(value) {
  const percentual = Number(value)
  if (Number.isNaN(percentual)) return 0
  return Math.min(100, Math.max(0, percentual))
}

function normalizarRelacaoInstrumento(value) {
  return RELACOES_INSTRUMENTO.some((option) => option.value === value)
    ? value
    : 'nao_analisada'
}

function confirmacoesPermitidas(relacaoInstrumento) {
  if (relacaoInstrumento === 'sem_conflito_aparente') {
    return CONFIRMACOES_STATUS.filter(({ value }) =>
      ['nao_confirmada', 'sem_conflito'].includes(value)
    )
  }

  if (relacaoInstrumento === 'possivel_sobreposicao') {
    return CONFIRMACOES_STATUS.filter(({ value }) =>
      ['nao_confirmada', 'sobreposicao_confirmada'].includes(value)
    )
  }

  return []
}

function normalizarObra(obra) {
  const relacaoInstrumento = normalizarRelacaoInstrumento(
    obra.relacao_instrumento
  )
  const confirmacoes = confirmacoesPermitidas(relacaoInstrumento)
  const confirmacaoStatus = confirmacoes.some(
    ({ value }) => value === obra.confirmacao_status
  )
    ? obra.confirmacao_status
    : 'nao_confirmada'

  return {
    ...obra,
    relacao_instrumento: relacaoInstrumento,
    confirmacao_status: confirmacaoStatus,
  }
}

function novaChaveLocal() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function chaveLocalidade(localidade) {
  if (localidade.cod_comunidade_rural !== null && localidade.cod_comunidade_rural !== undefined) {
    return `comunidade:${localidade.cod_comunidade_rural}`
  }

  return `nova:${localidade._clientId ?? localidade.id_revisao_localidade ?? localidade.nome_localidade_informada ?? localidade.nome_localidade}`
}

function chaveObra(obra) {
  return String(obra.id_obra)
}

function chavePublicoAlvo(item) {
  return String(item.id_projeto_investimento)
}

function limparTexto(value) {
  return value === null || value === undefined || String(value).trim() === ''
    ? null
    : String(value).trim()
}

function dadosMunicipioPersistencia(municipio) {
  return {
    cod_municipio: municipio.cod_municipio,
    nome: municipio.nome ?? null,
    uf: municipio.uf ?? null,
    origem_registro: municipio.origem_registro,
    acao_sugerida: municipio.acao_sugerida,
    justificativa: limparTexto(municipio.justificativa),
  }
}

function dadosLocalidadePersistencia(localidade, codMunicipio) {
  return {
    id_revisao_localidade: localidade.id_revisao_localidade ?? null,
    cod_municipio: localidade.cod_municipio || codMunicipio,
    cod_comunidade_rural: localidade.cod_comunidade_rural ?? null,
    nome_localidade: localidade.nome_localidade ?? null,
    nome_localidade_informada:
      limparTexto(localidade.nome_localidade_informada) ||
      (localidade.origem_registro === 'adicionado_tecnico'
        ? limparTexto(localidade.nome_localidade)
        : null),
    origem_registro: localidade.origem_registro,
    acao_sugerida: localidade.acao_sugerida,
    qtde_familias_ben_original: numeroOuNull(localidade.qtde_familias_ben_original),
    qtde_familias_ben_sugerida: numeroOuNull(localidade.qtde_familias_ben_sugerida),
    justificativa: limparTexto(localidade.justificativa),
  }
}

function dadosObraPersistencia(obra, codMunicipio) {
  return {
    id_revisao_obra: obra.id_revisao_obra ?? null,
    id_obra: obra.id_obra,
    cod_municipio: obra.cod_municipio || codMunicipio,
    descricao: obra.descricao ?? null,
    orgao: obra.orgao ?? null,
    link_transferegov: obra.link_transferegov ?? null,
    link_obrasgov: obra.link_obrasgov ?? null,
    relacao_instrumento: normalizarRelacaoInstrumento(
      obra.relacao_instrumento
    ),
    confirmacao_status:
      normalizarRelacaoInstrumento(obra.relacao_instrumento) ===
      'nao_analisada'
        ? 'nao_confirmada'
        : obra.confirmacao_status ?? 'nao_confirmada',
    justificativa: limparTexto(obra.justificativa),
  }
}

function dadosPublicoAlvoOriginal(item) {
  return {
    populacao_beneficiada_revisada: limparTexto(
      item.populacao_beneficiada_revisada
    ),
    desc_populacao_beneficiada_revisada: limparTexto(
      item.desc_populacao_beneficiada_revisada
    ),
  }
}

function copiarPublicoAlvo(publicoAlvo = []) {
  return publicoAlvo.map((item) => ({
    ...item,
    populacao_beneficiada_original:
      item.populacao_beneficiada_original ?? null,
    desc_populacao_beneficiada_original:
      item.desc_populacao_beneficiada_original ?? null,
    populacao_beneficiada_revisada:
      item.populacao_beneficiada_revisada ?? null,
    desc_populacao_beneficiada_revisada:
      item.desc_populacao_beneficiada_revisada ?? null,
    conferido_em: item.conferido_em ?? null,
    valido_ate: item.valido_ate ?? null,
    _publicoAlvoOriginal: dadosPublicoAlvoOriginal(item),
    _camposAlterados: {},
  }))
}

function publicoAlvoTemAlteracoes(publicoAlvo = []) {
  return publicoAlvo.some(
    (item) => Object.keys(item._camposAlterados ?? {}).length > 0
  )
}

function objetosIguais(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function semIdsPersistencia(dados) {
  if (!dados) return dados

  return Object.fromEntries(
    Object.entries(dados).filter(
      ([chave]) =>
        chave !== 'id_revisao_localidade' && chave !== 'id_revisao_obra'
    )
  )
}

function aplicarFlagAlteracao(currentFlags, chave, alterado) {
  const next = { ...currentFlags }

  if (alterado) {
    next[chave] = true
  } else {
    delete next[chave]
  }

  return next
}

function municipioTemAlteracoes(municipio) {
  return Boolean(
    municipio._municipioAlterado ||
      Object.keys(municipio._localidadesAlteradas ?? {}).length ||
      Object.keys(municipio._obrasAlteradas ?? {}).length
  )
}

function municipioTemHistorico(municipio) {
  return Boolean(
    municipio.revisao_municipio_conferida_em ||
      municipio.localidades_conferidas_em ||
      municipio.obras_conferidas_em
  )
}

function statusVisualMunicipio(municipio) {
  if (municipioTemAlteracoes(municipio)) return 'Alterações não salvas'
  if (municipio.revisao_municipio_conferida_em) {
    return `Ação salva — ${formatarDataConferencia(municipio.revisao_municipio_conferida_em)}${formatarValidade(municipio.valido_ate) ? ` · ${formatarValidade(municipio.valido_ate)}` : ''}`
  }
  return 'Ainda não conferida'
}

function formatarDataConferencia(value) {
  if (!value) return 'Ainda não conferida'

  const dataParte = String(value).split(/[T ]/)[0]
  const [ano, mes, dia] = dataParte.split('-')

  if (!ano || !mes || !dia) return 'Ainda não conferida'

  const hora = String(value).match(/[T ](\d{2}):(\d{2})/)
  return hora
    ? `Conferida em ${dia}/${mes}/${ano} às ${hora[1]}h${hora[2]}`
    : `Conferida em ${dia}/${mes}/${ano}`
}

function formatarDataAtualizacaoRascunho(value) {
  if (!value) return null

  const data = new Date(value)
  if (Number.isNaN(data.getTime())) return null

  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const ano = data.getFullYear()
  const hora = String(data.getHours()).padStart(2, '0')
  const minuto = String(data.getMinutes()).padStart(2, '0')

  return `${dia}/${mes}/${ano} às ${hora}h${minuto}`
}

function mensagemEstadoRascunho(data) {
  if (data?.revisao_pendente_aplicacao) return ''
  if (!data?.rascunho_global) {
    return 'Sem rascunho atual'
  }
  return ''
}

function descricaoRascunhoGlobal(data) {
  const rascunho = data?.rascunho_global
  if (!rascunho) return null

  const responsavel = rascunho.responsavel_nome || 'responsável não identificado'
  const ultimaAtualizacao = formatarDataAtualizacaoRascunho(rascunho.atualizado_em)
  return ultimaAtualizacao
    ? `Rascunho aberto por ${responsavel} · Última atualização em ${ultimaAtualizacao}`
    : `Rascunho aberto por ${responsavel}`
}

function contextoRevisao(data, usuarioAtualNome) {
  const revisaoPendente = data?.revisao_pendente_aplicacao
  if (revisaoPendente) {
    const responsavel = revisaoPendente.responsavel_nome || 'responsável não identificado'
    const enviadaEm = formatarDataAtualizacaoRascunho(revisaoPendente.enviado_em)
    const quantidade = data?.quantidade_revisoes_pendentes ?? 1
    return {
      status: `Revisão nº ${revisaoPendente.id_revisao} enviada por ${responsavel} — aguardando aplicação`,
      tone: 'sent',
      responsavel: null,
      detalhe: `${enviadaEm ? `Enviada em ${enviadaEm}. ` : ''}Os dados exibidos ainda correspondem à base oficial anterior.${
        quantidade > 1 ? ` Há ${quantidade} revisões aguardando aplicação; esta é a mais recente.` : ''
      }`,
    }
  }

  const rascunho = data?.rascunho_global
  if (rascunho) {
    return {
      status: 'Rascunho',
      tone: 'draft',
      responsavel: null,
      detalhe: descricaoRascunhoGlobal(data),
    }
  }

  const ultimaRevisao = data?.ultima_revisao_usuario
  if (ultimaRevisao?.aplicado_em) {
    return {
      status: 'Revisão aplicada',
      tone: 'applied',
      responsavel: usuarioAtualNome,
      detalhe: `Aplicada em ${formatarDataAtualizacaoRascunho(ultimaRevisao.aplicado_em)}`,
    }
  }

  if (ultimaRevisao?.enviado_em || data?.status === 'enviado') {
    return {
      status: 'Enviada — aguardando aplicação',
      tone: 'sent',
      responsavel: usuarioAtualNome,
      detalhe: ultimaRevisao?.enviado_em
        ? `Enviada em ${formatarDataAtualizacaoRascunho(ultimaRevisao.enviado_em)}`
        : null,
    }
  }

  return {
    status: 'Sem rascunho atual',
    tone: 'neutral',
    responsavel: null,
    detalhe: null,
  }
}

function formatarValidade(value) {
  if (!value) return null
  const dataParte = String(value).split(/[T ]/)[0]
  const [ano, mes, dia] = dataParte.split('-')
  return ano && mes && dia ? `Válida até ${dia}/${mes}/${ano}` : null
}

function resumoConferenciaSecao(itens, tipo) {
  const total = itens.length
  const revisados = itens.filter((item) =>
    tipo === 'localidades'
      ? item.origem_registro === 'adicionado_tecnico' || Boolean(item.acao_sugerida)
      : item.relacao_instrumento !== 'nao_analisada'
  )
  const maisRecente = revisados.reduce((mais, item) => {
    const data = item.conferido_em
    if (!data) return mais
    if (!mais || Date.parse(data) > Date.parse(mais)) return data
    return mais
  }, null)
  const validade = revisados.reduce((menor, item) => {
    if (!item.valido_ate) return menor
    if (!menor || Date.parse(item.valido_ate) < Date.parse(menor)) return item.valido_ate
    return menor
  }, null)

  if (!total) {
    return tipo === 'localidades' ? 'Nenhuma localidade cadastrada' : 'Nenhuma obra analisada'
  }
  if (!revisados.length) {
    return 'Ainda não conferida'
  }
  if (revisados.length < total) {
    return `${revisados.length} de ${total} ${tipo === 'localidades' ? 'localidades revisadas' : 'obras analisadas'}${maisRecente ? ` · Última alteração em ${formatarDataConferencia(maisRecente).replace('Conferida em ', '')}` : ' · Alterações não salvas'}`
  }
  return maisRecente
    ? `Conferida em ${formatarDataConferencia(maisRecente).replace('Conferida em ', '')}${formatarValidade(validade) ? ` · ${formatarValidade(validade)}` : ''}`
    : 'Todas revisadas · Alterações não salvas'
}

function nomeUsuario(usuario) {
  return (
    usuario?.nome_completo ||
    usuario?.nomeCompleto ||
    usuario?.full_name ||
    usuario?.nome ||
    usuario?.email ||
    'Usuário atual'
  )
}

function Tooltip({ text, children }) {
  return (
    <span className={styles.tooltipWrapper}>
      {children}
      <span className={styles.tooltip} role="tooltip">
        {text}
      </span>
    </span>
  )
}

function criarItemHistorico({ data, titulo, usuarioNome, descricao }) {
  return {
    id: `${titulo}-${data ?? novaChaveLocal()}-${descricao ?? ''}`,
    data,
    titulo,
    usuarioNome,
    descricao,
  }
}

function dataConferenciaPublicoAlvo(publicoAlvo = []) {
  return publicoAlvo.reduce((maisRecente, item) => {
    const conferidoEm = item.conferido_em
    if (!conferidoEm) return maisRecente
    if (!maisRecente) return conferidoEm

    const timestampAtual = Date.parse(conferidoEm)
    const timestampMaisRecente = Date.parse(maisRecente)

    if (Number.isNaN(timestampAtual) || Number.isNaN(timestampMaisRecente)) {
      return String(conferidoEm) > String(maisRecente) ? conferidoEm : maisRecente
    }

    return timestampAtual > timestampMaisRecente ? conferidoEm : maisRecente
  }, null)
}

function validadeConferenciaPublicoAlvo(publicoAlvo = []) {
  return publicoAlvo.reduce((menorValidade, item) => {
    if (!item.conferido_em || !item.valido_ate) return menorValidade
    if (!menorValidade || Date.parse(item.valido_ate) < Date.parse(menorValidade)) {
      return item.valido_ate
    }
    return menorValidade
  }, null)
}

function valorExibicaoPublicoAlvo(item, campoOriginal, campoRevisado) {
  return valorAusente(item[campoRevisado])
    ? item[campoOriginal]
    : item[campoRevisado]
}

function copiarMunicipios(municipios = []) {
  return municipios.map((municipio) => {
    const localidades = (municipio.localidades ?? []).map((localidade) => ({
      ...localidade,
      _clientId: localidade._clientId ?? novaChaveLocal(),
    }))
    const obras = (municipio.obras_saneamento ?? []).map(normalizarObra)
    const normalizado = {
      ...municipio,
      revisao_municipio_conferida_em: municipio.revisao_municipio_conferida_em ?? null,
      localidades_conferidas_em: municipio.localidades_conferidas_em ?? null,
      obras_conferidas_em: municipio.obras_conferidas_em ?? null,
      localidades,
      obras_saneamento: obras,
    }

    return {
      ...normalizado,
      _municipioOriginal: dadosMunicipioPersistencia(normalizado),
      _localidadesOriginais: Object.fromEntries(
        localidades.map((localidade) => [
          chaveLocalidade(localidade),
          dadosLocalidadePersistencia(localidade, normalizado.cod_municipio),
        ])
      ),
      _obrasOriginais: Object.fromEntries(
        obras.map((obra) => [
          chaveObra(obra),
          dadosObraPersistencia(obra, normalizado.cod_municipio),
        ])
      ),
      _municipioAlterado: false,
      _localidadesAlteradas: {},
      _obrasAlteradas: {},
      _salvoNestaSessao: municipio._salvoNestaSessao ?? municipioTemHistorico(normalizado),
    }
  })
}


export default function RevisaoInstrumento() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { numeroInstrumento } = useParams()
  const [identificador, setIdentificador] = useState('')
  const [dadosBusca, setDadosBusca] = useState(null)
  const [idRevisao, setIdRevisao] = useState(null)
  const [municipios, setMunicipios] = useState([])
  const [publicoAlvo, setPublicoAlvo] = useState([])
  const [municipioAberto, setMunicipioAberto] = useState(null)
  const [observacaoGeral, setObservacaoGeral] = useState('')
  const [novoMunicipio, setNovoMunicipio] = useState(MUNICIPIO_NOVO_INICIAL)
  const [buscaMunicipioOficial, setBuscaMunicipioOficial] = useState('')
  const [municipiosOficiais, setMunicipiosOficiais] = useState([])
  const [buscandoMunicipioOficial, setBuscandoMunicipioOficial] = useState(false)
  const [municipioOficialSelecionado, setMunicipioOficialSelecionado] = useState(null)
  const [erroMunicipioOficial, setErroMunicipioOficial] = useState('')
  const [localidadeNovoMunicipio, setLocalidadeNovoMunicipio] = useState(LOCALIDADE_NOVA_INICIAL)
  const [localidadesNovoMunicipio, setLocalidadesNovoMunicipio] = useState([])
  const [mostrarFormularioMunicipio, setMostrarFormularioMunicipio] = useState(false)
  const [novaLocalidadePorMunicipio, setNovaLocalidadePorMunicipio] = useState({})
  const [novaLocalidadeAbertaPorMunicipio, setNovaLocalidadeAbertaPorMunicipio] = useState({})
  const [justificativasLocalidadeAbertas, setJustificativasLocalidadeAbertas] = useState({})
  const [justificativasObraAbertas, setJustificativasObraAbertas] = useState({})
  const [edicoesPublicoAlvo, setEdicoesPublicoAlvo] = useState({})
  const [erroMunicipio, setErroMunicipio] = useState({})
  const [observacaoEmEdicao, setObservacaoEmEdicao] = useState(false)
  const [rascunhoObservacaoGeral, setRascunhoObservacaoGeral] = useState('')
  const [, setHistoricoSessao] = useState([])

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [confirmarEnvioParcial, setConfirmarEnvioParcial] = useState(false)
  const [meusInstrumentos, setMeusInstrumentos] = useState([])
  const [filtroMeusInstrumentos, setFiltroMeusInstrumentos] = useState('')
  const [carregandoMeusInstrumentos, setCarregandoMeusInstrumentos] = useState(true)
  const [erroMeusInstrumentos, setErroMeusInstrumentos] = useState('')
  const [detalhesInstrumentoAbertos, setDetalhesInstrumentoAbertos] = useState(false)

  const instrumento = numeroInstrumento ? dadosBusca?.instrumento ?? null : null
  const temRascunhoAberto = Boolean(dadosBusca?.rascunho_global)
  const ehAutorRascunho = dadosBusca?.rascunho_global?.eh_autor === true
  const podeEditarInstrumento = dadosBusca?.pode_editar === true
  const somenteLeituraPorAtribuicao = Boolean(instrumento) && !podeEditarInstrumento
  const bloqueadoPorRascunhoAlheio = temRascunhoAberto && !ehAutorRascunho
  const modoSomenteLeitura = dadosBusca?.status === 'enviado' || somenteLeituraPorAtribuicao || bloqueadoPorRascunhoAlheio
  const canEditRevision = dadosBusca?.pode_editar_revisao === true && dadosBusca?.status !== 'enviado'
  const usuarioAtualNome = nomeUsuario(usuario)
  const contextoAtual = contextoRevisao(dadosBusca, usuarioAtualNome)
  const observacaoGeralTexto = observacaoGeral.trim()
  const registrarEventoHistorico = (titulo, descricao) => {
    setHistoricoSessao((current) => [
      criarItemHistorico({
        data: new Date().toISOString(),
        titulo,
        usuarioNome: usuarioAtualNome,
        descricao,
      }),
      ...current,
    ])
  }

  const abrirEdicaoObservacaoGeral = () => {
    setRascunhoObservacaoGeral(observacaoGeral)
    setObservacaoEmEdicao(true)
  }

  const aplicarObservacaoGeral = () => {
    const textoAnterior = observacaoGeral.trim()
    const textoAtual = rascunhoObservacaoGeral.trim()

    setObservacaoGeral(rascunhoObservacaoGeral)
    setObservacaoEmEdicao(false)

    if (!textoAnterior && textoAtual) {
      registrarEventoHistorico('Observação geral adicionada')
    } else if (textoAnterior && textoAtual && textoAnterior !== textoAtual) {
      registrarEventoHistorico('Observação geral editada')
    }
  }

  const cancelarEdicaoObservacaoGeral = () => {
    setRascunhoObservacaoGeral(observacaoGeral)
    setObservacaoEmEdicao(false)
  }

  const removerObservacaoGeral = () => {
    if (observacaoGeral.trim()) {
      registrarEventoHistorico('Observação geral removida')
    }

    setObservacaoGeral('')
    setRascunhoObservacaoGeral('')
    setObservacaoEmEdicao(false)
  }
  const abrirInstrumento = useCallback(async (termo) => {
    if (!termo) {
      setMessage('Informe um número de instrumento, proposta ou TED.')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')
    setMessageType('')
    setDadosBusca(null)
    setIdRevisao(null)
    setMunicipios([])
    setPublicoAlvo([])
    setMunicipioAberto(null)
    setObservacaoGeral('')
    setNovoMunicipio(MUNICIPIO_NOVO_INICIAL)
    setBuscaMunicipioOficial('')
    setMunicipiosOficiais([])
    setMunicipioOficialSelecionado(null)
    setErroMunicipioOficial('')
    setLocalidadeNovoMunicipio(LOCALIDADE_NOVA_INICIAL)
    setLocalidadesNovoMunicipio([])
    setMostrarFormularioMunicipio(false)
    setNovaLocalidadeAbertaPorMunicipio({})
    setJustificativasLocalidadeAbertas({})
    setJustificativasObraAbertas({})
    setEdicoesPublicoAlvo({})
    setErroMunicipio({})
    setObservacaoEmEdicao(false)
    setRascunhoObservacaoGeral('')
    setHistoricoSessao([])

    try {
      const data = await revisaoInstrumentoApi.buscarInstrumento(termo)
      setDadosBusca(data)
      setIdRevisao(data.id_revisao ?? null)
      setObservacaoGeral(data.observacao_geral ?? '')
      setRascunhoObservacaoGeral(data.observacao_geral ?? '')
      setMunicipios(copiarMunicipios(data.municipios))
      setPublicoAlvo(copiarPublicoAlvo(data.publico_alvo))
      setMessage(mensagemEstadoRascunho(data))
      setMessageType('info')
    } catch (err) {
      setMessage(
        (typeof err?.response?.data?.detail === 'object'
          ? err.response.data.detail.mensagem || 'A revisão possui pendências.'
          : err?.response?.data?.detail) ||
          'Não foi possível localizar o instrumento informado.'
      )
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const navegarParaInstrumento = (termo) => {
    const valor = String(termo ?? '').trim()
    if (!valor) {
      setMessage('Informe um número de instrumento, proposta ou TED.')
      setMessageType('error')
      return
    }

    navigate(`/revisao-instrumento/${encodeURIComponent(valor)}`)
  }

  const buscarInstrumento = async (event) => {
    event.preventDefault()
    navegarParaInstrumento(identificador)
  }

  useEffect(() => {
    if (!numeroInstrumento) return

    const valor = String(numeroInstrumento).trim()
    Promise.resolve().then(() => abrirInstrumento(valor))
  }, [abrirInstrumento, numeroInstrumento])

  useEffect(() => {
    let ativo = true

    revisaoInstrumentoApi.buscarMeusInstrumentos()
      .then((resposta) => {
        if (ativo) setMeusInstrumentos(resposta.data ?? [])
      })
      .catch(() => {
        if (ativo) setErroMeusInstrumentos('Não foi possível carregar seus instrumentos agora.')
      })
      .finally(() => {
        if (ativo) setCarregandoMeusInstrumentos(false)
      })

    return () => { ativo = false }
  }, [usuario?.id_usuario])

  const meusInstrumentosFiltrados = meusInstrumentos.filter((item) => {
    const termo = filtroMeusInstrumentos.trim().toLowerCase()
    if (!termo) return true
    return [
      item.nr_instrumento,
      item.nr_proposta,
      item.municipios_beneficiados,
      item.uf,
      item.tipo_instrumento_label,
    ].some((valor) => String(valor ?? '').toLowerCase().includes(termo))
  })

  const atualizarMunicipio = (codMunicipio, campo, valor) => {
    setMunicipios((current) =>
      current.map((municipio) => {
        if (municipio.cod_municipio !== codMunicipio) return municipio

        const atualizado = { ...municipio, [campo]: valor }
        return {
          ...atualizado,
          _municipioAlterado: !objetosIguais(
            dadosMunicipioPersistencia(atualizado),
            municipio._municipioOriginal
          ),
        }
      })
    )
  }

  const atualizarAcaoMunicipio = (codMunicipio, acao) => {
    setMunicipios((current) =>
      current.map((municipio) => {
        if (municipio.cod_municipio !== codMunicipio) return municipio

        const atualizado = {
          ...municipio,
          acao_sugerida: acao,
          justificativa: acao === 'manter' ? '' : municipio.justificativa,
        }

        return {
          ...atualizado,
          _municipioAlterado: !objetosIguais(
            dadosMunicipioPersistencia(atualizado),
            municipio._municipioOriginal
          ),
        }
      })
    )
  }

  const alternarJustificativaLocalidade = (chave) => {
    setJustificativasLocalidadeAbertas((current) => ({
      ...current,
      [chave]: !current[chave],
    }))
  }

  const alternarJustificativaObra = (chave) => {
    setJustificativasObraAbertas((current) => ({
      ...current,
      [chave]: !current[chave],
    }))
  }

  const adicionarLocalidadeNovoMunicipio = () => {
    const nome = localidadeNovoMunicipio.nome_localidade_informada.trim()

    if (!nome) {
      setMessage('Informe o nome da localidade a adicionar.')
      setMessageType('error')
      return
    }

    setLocalidadesNovoMunicipio((current) => [
      ...current,
      {
        nome_localidade: nome,
        nome_localidade_informada: nome,
        qtde_familias_ben_sugerida:
          localidadeNovoMunicipio.qtde_familias_ben_sugerida,
      },
    ])

    setLocalidadeNovoMunicipio(LOCALIDADE_NOVA_INICIAL)
    setMessage('')
    setMessageType('')
  }

  const removerLocalidadeNovoMunicipio = (index) => {
    setLocalidadesNovoMunicipio((current) =>
      current.filter((_, localidadeIndex) => localidadeIndex !== index)
    )
  }

  const buscarMunicipioOficial = async () => {
    const termo = buscaMunicipioOficial.trim()
    if (termo.length < 2) {
      setMunicipiosOficiais([])
      setErroMunicipioOficial('Informe ao menos dois caracteres do nome, UF ou código IBGE.')
      return
    }

    setBuscandoMunicipioOficial(true)
    setErroMunicipioOficial('')
    try {
      const encontrados = await revisaoInstrumentoApi.buscarMunicipiosOficiais(termo)
      setMunicipiosOficiais(encontrados)
      if (!encontrados.length) {
        setErroMunicipioOficial('Nenhum município foi encontrado no cadastro territorial oficial.')
      }
    } catch (err) {
      setMunicipiosOficiais([])
      setErroMunicipioOficial(
        err?.response?.data?.detail ||
          'Não foi possível consultar o cadastro territorial de municípios.'
      )
    } finally {
      setBuscandoMunicipioOficial(false)
    }
  }

  const selecionarMunicipioOficial = (municipio) => {
    const existente = municipios.find(
      (item) => Number(item.cod_municipio) === Number(municipio.cod_municipio)
    )
    if (existente) {
      setErroMunicipioOficial(
        existente.origem_registro === 'adicionado_tecnico'
          ? 'Este município já foi adicionado ao rascunho.'
          : 'Este município já pertence ao instrumento.'
      )
      return
    }
    setNovoMunicipio(municipio)
    setMunicipioOficialSelecionado(municipio)
    setBuscaMunicipioOficial(`${municipio.nome_municipio}/${municipio.sigla_uf}`)
    setMunicipiosOficiais([])
    setErroMunicipioOficial('')
  }

  const adicionarMunicipio = () => {
    const codMunicipio = numeroOuNull(novoMunicipio.cod_municipio)

    if (!codMunicipio || municipioOficialSelecionado?.cod_municipio !== codMunicipio) {
      setErroMunicipioOficial('Selecione um município válido no cadastro territorial oficial.')
      return
    }

    const existente = municipios.find(
      (municipio) => Number(municipio.cod_municipio) === codMunicipio
    )
    if (existente) {
      setErroMunicipioOficial(
        existente.origem_registro === 'adicionado_tecnico'
          ? 'Este município já foi adicionado ao rascunho.'
          : 'Este município já pertence ao instrumento.'
      )
      return
    }

    const novoItem = {
      cod_municipio: codMunicipio,
      nome: municipioOficialSelecionado.nome_municipio,
      uf: municipioOficialSelecionado.sigla_uf,
      origem_registro: 'adicionado_tecnico',
      acao_sugerida: 'adicionar',
      justificativa: '',
      revisao_municipio_conferida_em: null,
      localidades_conferidas_em: null,
      obras_conferidas_em: null,
      localidades: localidadesNovoMunicipio.map((localidade) => ({
        _clientId: novaChaveLocal(),
        cod_municipio: codMunicipio,
        cod_comunidade_rural: null,
        nome_localidade: localidade.nome_localidade,
        nome_localidade_informada: localidade.nome_localidade_informada,
        origem_registro: 'adicionado_tecnico',
        acao_sugerida: 'adicionar',
        qtde_familias_ben_original: null,
        qtde_familias_ben_sugerida: localidade.qtde_familias_ben_sugerida,
        justificativa: '',
      })),
      obras_saneamento: [],
    }

    setMunicipios((current) => [
      ...current,
      {
        ...novoItem,
        _municipioOriginal: null,
        _localidadesOriginais: {},
        _obrasOriginais: {},
        _municipioAlterado: true,
        _localidadesAlteradas: Object.fromEntries(
          novoItem.localidades.map((localidade) => [chaveLocalidade(localidade), true])
        ),
        _obrasAlteradas: {},
        _salvoNestaSessao: false,
      },
    ])

    setNovoMunicipio(MUNICIPIO_NOVO_INICIAL)
    setBuscaMunicipioOficial('')
    setMunicipiosOficiais([])
    setMunicipioOficialSelecionado(null)
    setErroMunicipioOficial('')
    setLocalidadeNovoMunicipio(LOCALIDADE_NOVA_INICIAL)
    setLocalidadesNovoMunicipio([])
    setMostrarFormularioMunicipio(false)
    setMessage('')
    setMessageType('')
  }

  const atualizarLocalidade = (codMunicipio, chave, campo, valor) => {
    setMunicipios((current) =>
      current.map((municipio) => {
        if (municipio.cod_municipio !== codMunicipio) return municipio

        let flags = municipio._localidadesAlteradas ?? {}
        const localidades = municipio.localidades.map((localidade) => {
          if (chaveLocalidade(localidade) !== chave) return localidade

          const atualizada = { ...localidade, [campo]: valor }
          const alterada = !objetosIguais(
            dadosLocalidadePersistencia(atualizada, municipio.cod_municipio),
            municipio._localidadesOriginais?.[chave]
          )
          flags = aplicarFlagAlteracao(flags, chave, alterada)
          return atualizada
        })

        return {
          ...municipio,
          localidades,
          _localidadesAlteradas: flags,
        }
      })
    )
  }

  const atualizarAcaoLocalidade = (codMunicipio, chave, acao) => {
    setMunicipios((current) =>
      current.map((municipio) => {
        if (municipio.cod_municipio !== codMunicipio) return municipio

        let flags = municipio._localidadesAlteradas ?? {}
        const localidades = municipio.localidades.map((localidade) => {
          if (chaveLocalidade(localidade) !== chave) return localidade

          const atualizada = {
            ...localidade,
            acao_sugerida: acao,
            justificativa: acao === 'manter' ? '' : localidade.justificativa,
            qtde_familias_ben_sugerida:
              acao === 'corrigir' && !localidade.qtde_familias_ben_sugerida
                ? localidade.qtde_familias_ben_original ?? ''
                : localidade.qtde_familias_ben_sugerida,
          }
          const alterada = !objetosIguais(
            dadosLocalidadePersistencia(atualizada, municipio.cod_municipio),
            municipio._localidadesOriginais?.[chave]
          )
          flags = aplicarFlagAlteracao(flags, chave, alterada)
          return atualizada
        })

        return {
          ...municipio,
          localidades,
          _localidadesAlteradas: flags,
        }
      })
    )
  }

  const atualizarFamiliasLocalidade = (codMunicipio, chave, valor) => {
    setMunicipios((current) =>
      current.map((municipio) => {
        if (municipio.cod_municipio !== codMunicipio) return municipio

        let flags = municipio._localidadesAlteradas ?? {}
        const localidades = municipio.localidades.map((localidade) => {
          if (chaveLocalidade(localidade) !== chave) return localidade

          const original = localidade.qtde_familias_ben_original
          const valorNumerico = numeroOuNull(valor)
          const deveCorrigir =
            localidade.origem_registro === 'base_atual' &&
            localidade.acao_sugerida !== 'remover' &&
            valorNumerico !== original
          const atualizada = {
            ...localidade,
            qtde_familias_ben_sugerida: valor,
            acao_sugerida: deveCorrigir ? 'corrigir' : localidade.acao_sugerida,
          }
          const alterada = !objetosIguais(
            dadosLocalidadePersistencia(atualizada, municipio.cod_municipio),
            municipio._localidadesOriginais?.[chave]
          )
          flags = aplicarFlagAlteracao(flags, chave, alterada)
          return atualizada
        })

        return {
          ...municipio,
          localidades,
          _localidadesAlteradas: flags,
        }
      })
    )
  }

  const atualizarObra = (codMunicipio, idObra, campo, valor) => {
    setMunicipios((current) =>
      current.map((municipio) => {
        if (municipio.cod_municipio !== codMunicipio) return municipio

        let flags = municipio._obrasAlteradas ?? {}
        const obras = municipio.obras_saneamento.map((obra) => {
          if (chaveObra(obra) !== String(idObra)) return obra

          let atualizada

          if (campo === 'relacao_instrumento') {
            const relacaoInstrumento = normalizarRelacaoInstrumento(valor)
            atualizada = {
              ...obra,
              relacao_instrumento: relacaoInstrumento,
              confirmacao_status: 'nao_confirmada',
            }
          } else {
            atualizada = { ...obra, [campo]: valor }
          }

          const chave = chaveObra(atualizada)
          const alterada = !objetosIguais(
            dadosObraPersistencia(atualizada, municipio.cod_municipio),
            municipio._obrasOriginais?.[chave]
          )
          flags = aplicarFlagAlteracao(flags, chave, alterada)
          return atualizada
        })

        return {
          ...municipio,
          obras_saneamento: obras,
          _obrasAlteradas: flags,
        }
      })
    )
  }

  const chaveEdicaoPublicoAlvo = (idProjeto, campo) => `${idProjeto}:${campo}`

  const valorInicialEdicaoPublicoAlvo = (item, campoOriginal, campoRevisado) => {
    if (!valorAusente(item[campoRevisado])) return item[campoRevisado]
    if (!valorAusente(item[campoOriginal])) return item[campoOriginal]
    return ''
  }

  const iniciarEdicaoPublicoAlvo = (item, campoOriginal, campoRevisado) => {
    const chave = chaveEdicaoPublicoAlvo(
      item.id_projeto_investimento,
      campoRevisado
    )
    setEdicoesPublicoAlvo((current) => ({
      ...current,
      [chave]: valorInicialEdicaoPublicoAlvo(item, campoOriginal, campoRevisado),
    }))
  }

  const atualizarRascunhoPublicoAlvo = (chave, valor) => {
    setEdicoesPublicoAlvo((current) => ({
      ...current,
      [chave]: valor,
    }))
  }

  const fecharEdicaoPublicoAlvo = (chave) => {
    setEdicoesPublicoAlvo((current) => {
      const next = { ...current }
      delete next[chave]
      return next
    })
  }

  const atualizarPublicoAlvo = (idProjeto, campo, valor) => {
    setPublicoAlvo((current) =>
      current.map((item) => {
        if (chavePublicoAlvo(item) !== String(idProjeto)) return item

        const valorLimpo = limparTexto(valor)
        const atualizado = {
          ...item,
          [campo]: valorLimpo,
        }
        const originalCampo = item._publicoAlvoOriginal?.[campo] ?? null
        const camposAlterados = aplicarFlagAlteracao(
          item._camposAlterados ?? {},
          campo,
          !objetosIguais(valorLimpo, originalCampo)
        )

        return {
          ...atualizado,
          _camposAlterados: camposAlterados,
        }
      })
    )
  }

  const aplicarEdicaoPublicoAlvo = (idProjeto, campoRevisado, chave) => {
    atualizarPublicoAlvo(
      idProjeto,
      campoRevisado,
      edicoesPublicoAlvo[chave] ?? ''
    )
    fecharEdicaoPublicoAlvo(chave)
  }

  const atualizarNovaLocalidade = (codMunicipio, campo, valor) => {
    setNovaLocalidadePorMunicipio((current) => ({
      ...current,
      [codMunicipio]: {
        ...(current[codMunicipio] ?? LOCALIDADE_NOVA_INICIAL),
        [campo]: valor,
      },
    }))
  }

  const adicionarLocalidade = (codMunicipio) => {
    const form = novaLocalidadePorMunicipio[codMunicipio] ?? LOCALIDADE_NOVA_INICIAL
    const nome = form.nome_localidade_informada.trim()

    if (!nome) {
      setMessage('Informe o nome da localidade a adicionar.')
      setMessageType('error')
      return
    }

    setMunicipios((current) =>
      current.map((item) => {
        if (item.cod_municipio !== codMunicipio) return item

        const novaLocalidade = {
          _clientId: novaChaveLocal(),
          cod_municipio: item.cod_municipio,
          cod_comunidade_rural: null,
          nome_localidade: nome,
          nome_localidade_informada: nome,
          origem_registro: 'adicionado_tecnico',
          acao_sugerida: 'adicionar',
          qtde_familias_ben_original: null,
          qtde_familias_ben_sugerida: form.qtde_familias_ben_sugerida,
          justificativa: '',
        }
        const chave = chaveLocalidade(novaLocalidade)

        return {
          ...item,
          localidades: [
            ...item.localidades,
            novaLocalidade,
          ],
          _localidadesAlteradas: {
            ...(item._localidadesAlteradas ?? {}),
            [chave]: true,
          },
        }
      })
    )

    setNovaLocalidadeAbertaPorMunicipio((current) => ({
      ...current,
      [codMunicipio]: false,
    }))

    setNovaLocalidadePorMunicipio((current) => ({
      ...current,
      [codMunicipio]: LOCALIDADE_NOVA_INICIAL,
    }))

    setMessage('')
    setMessageType('')
  }

  const montarPayloadMunicipio = (municipio, idRevisaoAtual = idRevisao) => ({
    id_revisao: idRevisaoAtual,
    instrumento,
    cod_municipio: municipio.cod_municipio,
    municipio: municipio._municipioAlterado
      ? dadosMunicipioPersistencia(municipio)
      : null,
    localidades: municipio.localidades
      .filter((localidade) => municipio._localidadesAlteradas?.[chaveLocalidade(localidade)])
      .map((localidade) =>
        dadosLocalidadePersistencia(localidade, municipio.cod_municipio)
      ),
    obras_saneamento: municipio.obras_saneamento
      .filter((obra) => municipio._obrasAlteradas?.[chaveObra(obra)])
      .map((obra) => dadosObraPersistencia(obra, municipio.cod_municipio)),
  })

  const montarPayloadPublicoAlvo = () =>
    publicoAlvo
      .filter((item) => Object.keys(item._camposAlterados ?? {}).length > 0)
      .map((item) => {
        const payload = {
          id_projeto_investimento: item.id_projeto_investimento,
        }

        if (item._camposAlterados?.populacao_beneficiada_revisada) {
          payload.populacao_beneficiada_revisada = limparTexto(
            item.populacao_beneficiada_revisada
          )
        }

        if (item._camposAlterados?.desc_populacao_beneficiada_revisada) {
          payload.desc_populacao_beneficiada_revisada = limparTexto(
            item.desc_populacao_beneficiada_revisada
          )
        }

        return payload
      })

  const validarMunicipioAntesSalvar = (municipio) => {
    if (municipio._municipioAlterado && !municipio.acao_sugerida) {
      return 'Selecione uma ação para a revisão do município antes de salvar.'
    }

    const localidadeSemAcao = municipio.localidades.find(
      (localidade) =>
        municipio._localidadesAlteradas?.[chaveLocalidade(localidade)] &&
        !localidade.acao_sugerida
    )

    if (localidadeSemAcao) {
      return 'Selecione uma ação para cada localidade alterada antes de salvar.'
    }

    return null
  }

  const aplicarResultadoMunicipio = (payload, data) => {
    setIdRevisao(data.id_revisao)
    setDadosBusca((current) =>
      current
        ? {
            ...current,
            id_revisao: data.id_revisao,
            status: data.status ?? current.status,
            status_revisao_geral:
              data.status_revisao_geral ?? current.status_revisao_geral,
            status_revisao_geral_label:
              data.status_revisao_geral_label ??
              current.status_revisao_geral_label,
          }
        : current
    )
    setMunicipios((current) =>
      current.map((municipio) => {
        if (municipio.cod_municipio !== payload.cod_municipio) return municipio

        const retorno = data.municipio
        const localidadesRetorno = retorno.localidades ?? []
        const obrasRetorno = retorno.obras_saneamento ?? []
        const obraPorChave = Object.fromEntries(
          obrasRetorno.map((obra) => [chaveObra(obra), obra])
        )

        let municipioAlterado = municipio._municipioAlterado
        let municipioOriginal = municipio._municipioOriginal

        if (
          payload.municipio &&
          objetosIguais(dadosMunicipioPersistencia(municipio), payload.municipio)
        ) {
          municipioAlterado = false
          municipioOriginal = payload.municipio
        }

        let localidadesAlteradas = { ...(municipio._localidadesAlteradas ?? {}) }
        let localidadesOriginais = { ...(municipio._localidadesOriginais ?? {}) }
        const localidades = municipio.localidades.map((localidade) => {
          const chave = chaveLocalidade(localidade)
          const localidadeAtualPayload = dadosLocalidadePersistencia(
            localidade,
            municipio.cod_municipio
          )
          const retornoLocalidade = localidadesRetorno.find((item) =>
            objetosIguais(
              semIdsPersistencia(
                dadosLocalidadePersistencia(item, municipio.cod_municipio)
              ),
              semIdsPersistencia(localidadeAtualPayload)
            )
          )
          const payloadLocalidade = payload.localidades.find((item) =>
            objetosIguais(item, localidadeAtualPayload)
          )

          if (!retornoLocalidade) return localidade

          const atualizada = {
            ...localidade,
            ...retornoLocalidade,
            _clientId: localidade._clientId,
          }

          if (payloadLocalidade) {
            delete localidadesAlteradas[chave]
            localidadesOriginais[chave] = dadosLocalidadePersistencia(
              atualizada,
              municipio.cod_municipio
            )
          }

          return atualizada
        })

        let obrasAlteradas = { ...(municipio._obrasAlteradas ?? {}) }
        let obrasOriginais = { ...(municipio._obrasOriginais ?? {}) }
        const obras = municipio.obras_saneamento.map((obra) => {
          const chave = chaveObra(obra)
          const retornoObra = obraPorChave[chave]
          const payloadObra = payload.obras_saneamento.find((item) =>
            objetosIguais(item, dadosObraPersistencia(obra, municipio.cod_municipio))
          )

          if (!retornoObra) return obra

          const atualizada = normalizarObra({
            ...obra,
            ...retornoObra,
          })

          if (payloadObra) {
            delete obrasAlteradas[chave]
            obrasOriginais[chave] = dadosObraPersistencia(atualizada, municipio.cod_municipio)
          }

          return atualizada
        })

        return {
          ...municipio,
          revisao_municipio_conferida_em:
            retorno.revisao_municipio_conferida_em ??
            municipio.revisao_municipio_conferida_em,
          localidades_conferidas_em:
            retorno.localidades_conferidas_em ?? municipio.localidades_conferidas_em,
          obras_conferidas_em:
            retorno.obras_conferidas_em ?? municipio.obras_conferidas_em,
          localidades,
          obras_saneamento: obras,
          _municipioOriginal: municipioOriginal,
          _localidadesOriginais: localidadesOriginais,
          _obrasOriginais: obrasOriginais,
          _municipioAlterado: municipioAlterado,
          _localidadesAlteradas: localidadesAlteradas,
          _obrasAlteradas: obrasAlteradas,
          _salvoNestaSessao: true,
        }
      })
    )
  }

  const montarPayloadRevisao = (status, idRevisaoAtual) => ({
    id_revisao: idRevisaoAtual,
    status,
    observacao_geral: observacaoGeral.trim() || null,
    instrumento,
    municipios: municipios
      .filter(municipioTemAlteracoes)
      .map((municipio) => {
        const alteracoes = montarPayloadMunicipio(municipio, idRevisaoAtual)
        return {
          cod_municipio: municipio.cod_municipio,
          nome: municipio.nome ?? null,
          uf: municipio.uf ?? null,
          origem_registro: municipio.origem_registro,
          acao_sugerida: alteracoes.municipio?.acao_sugerida ?? null,
          justificativa: alteracoes.municipio?.justificativa ?? null,
          localidades: alteracoes.localidades,
          obras_saneamento: alteracoes.obras_saneamento,
        }
      }),
    publico_alvo: montarPayloadPublicoAlvo(),
  })

  const existemItensNaoConferidos = () =>
    municipios.some(
      (municipio) =>
        municipio.acao_sugerida == null ||
        municipio.localidades.some(
          (localidade) =>
            localidade.origem_registro !== 'adicionado_tecnico' &&
            !localidade.acao_sugerida
        ) ||
        municipio.obras_saneamento.some(
          (obra) => obra.relacao_instrumento === 'nao_analisada'
        )
    ) || publicoAlvo.some((item) => !item.conferido_em)

  const salvarRevisao = async (status) => {
    if (!instrumento) return

    const eraRascunhoExistente = Boolean(idRevisao)
    setIsSaving(true)
    setMessage('')
    setMessageType('')

    try {
      const municipioInvalido = municipios
        .filter(municipioTemAlteracoes)
        .find((municipio) => validarMunicipioAntesSalvar(municipio))
      if (municipioInvalido) {
        throw new Error(validarMunicipioAntesSalvar(municipioInvalido))
      }
      const payloadRevisao = montarPayloadRevisao(status, idRevisao)
      const data = await revisaoInstrumentoApi.salvarRevisao(payloadRevisao)
      setIdRevisao(data.id_revisao)
      setDadosBusca((current) =>
        current
          ? {
              ...current,
              id_revisao: data.id_revisao,
              status: data.status ?? current.status,
              pode_editar_revisao: data.status !== 'enviado' && current.pode_editar,
              rascunho_global:
                data.status === 'rascunho'
                  ? {
                      id_revisao: data.id_revisao,
                      status: data.status,
                      criado_em: data.criado_em,
                      atualizado_em: data.atualizado_em,
                      id_usuario: usuario?.id_usuario,
                      responsavel_nome: usuarioAtualNome,
                      eh_autor: true,
                    }
                  : null,
              rascunho_usuario:
                data.status === 'rascunho'
                  ? {
                      id_revisao: data.id_revisao,
                      status: data.status,
                      criado_em: data.criado_em,
                      atualizado_em: data.atualizado_em,
                      id_usuario: usuario?.id_usuario,
                      responsavel_nome: usuarioAtualNome,
                      eh_autor: true,
                    }
                  : null,
              ultima_revisao_usuario:
                data.status === 'enviado'
                  ? {
                      id_revisao: data.id_revisao,
                      status: data.status,
                      criado_em: data.criado_em,
                      atualizado_em: data.atualizado_em,
                      enviado_em: data.enviado_em,
                      aplicado_em: null,
                    }
                  : current.ultima_revisao_usuario,
              revisao_pendente_aplicacao:
                data.status === 'enviado'
                  ? {
                      id_revisao: data.id_revisao,
                      id_usuario: usuario?.id_usuario,
                      status: data.status,
                      enviado_em: data.enviado_em,
                      aplicado_em: null,
                      responsavel_nome: usuarioAtualNome,
                    }
                  : current.revisao_pendente_aplicacao,
              quantidade_revisoes_pendentes:
                data.status === 'enviado'
                  ? (current.quantidade_revisoes_pendentes ?? 0) + 1
                  : current.quantidade_revisoes_pendentes,
              completude: data.completude ?? current.completude,
              status_revisao_geral:
                data.status_revisao_geral ?? current.status_revisao_geral,
              status_revisao_geral_label:
                data.status_revisao_geral_label ??
                current.status_revisao_geral_label,
            }
          : current
      )
      setPublicoAlvo(copiarPublicoAlvo(data.publico_alvo ?? publicoAlvo))
      if (data.municipios?.length) {
        data.municipios.forEach((retorno) => {
          const original = municipios.find(
            (municipio) => municipio.cod_municipio === retorno.cod_municipio
          )
          if (!original) return
          aplicarResultadoMunicipio(
            montarPayloadMunicipio(original, data.id_revisao),
            { ...data, municipio: retorno }
          )
        })
      }
      setConfirmarEnvioParcial(false)
      registrarEventoHistorico(
        status === 'enviado' ? 'Revisão enviada' : 'Rascunho salvo',
        status === 'enviado'
          ? 'Revisão finalizada e enviada.'
          : 'Todo o estado atual da revisão foi salvo.'
      )
      setMessage(
        status === 'enviado'
          ? 'Revisão enviada com sucesso'
          : eraRascunhoExistente
            ? 'Rascunho atualizado com sucesso'
            : 'Rascunho salvo com sucesso'
      )
      setMessageType('success')
      if (status !== 'enviado') {
        window.setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 4000)
      }
    } catch (err) {
      setMessage(
        (typeof err?.response?.data?.detail === 'object'
          ? err.response.data.detail.mensagem || 'A revisão possui pendências.'
          : err?.response?.data?.detail) ||
          err?.message ||
          'Não foi possível salvar a revisão. Verifique sua autenticação e tente novamente.'
      )
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const iniciarEnvio = () => {
    if (existemItensNaoConferidos()) {
      setConfirmarEnvioParcial(true)
      return
    }
    salvarRevisao('enviado')
  }

  const iniciarNovaRevisao = async () => {
    if (!instrumento) return
    setIsLoading(true)
    try {
      const data = await revisaoInstrumentoApi.buscarInstrumento(
        instrumento.identificador_busca,
      )
      setDadosBusca(data)
      setIdRevisao(data.id_revisao ?? null)
      setObservacaoGeral(data.observacao_geral ?? '')
      setRascunhoObservacaoGeral(data.observacao_geral ?? '')
      setMunicipios(copiarMunicipios(data.municipios ?? []))
      setPublicoAlvo(copiarPublicoAlvo(data.publico_alvo ?? []))
      setMessage(mensagemEstadoRascunho(data))
      setMessageType('info')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={`${styles.page} ${instrumento ? styles.pageDetail : styles.pageIndex}`}>
      <header className={styles.header}>
        <div>
          {instrumento ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => navigate('/revisao-instrumento')}
            >
              Retornar
            </button>
          ) : (
            <>
              <h1>Revisão de Instrumento</h1>
              <p>
                Consulte, registre e envie os ajustes por instrumento da Carteira DSR.
              </p>
            </>
          )}
        </div>

        {instrumento && podeEditarInstrumento && (
          <div className={styles.headerActions}>
            {bloqueadoPorRascunhoAlheio ? (
              <div className={styles.headerActionGroup}>
                <span className={styles.statusChip}>Rascunho em andamento</span>
              </div>
            ) : modoSomenteLeitura ? (
              <div className={styles.headerActionGroup}>
                <span className={styles.statusChip}>Revisão enviada</span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={iniciarNovaRevisao}
                >
                  Iniciar nova revisão
                </button>
              </div>
            ) : <div className={styles.headerActionGroup}>
              <Tooltip text="Salva o estado atual de toda a revisão.">
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => salvarRevisao('rascunho')}
                  disabled={isSaving}
                >
                  <Save size={18} />
                  {isSaving ? 'Salvando...' : 'Salvar rascunho'}
                </button>
              </Tooltip>
            </div>}

            {canEditRevision && <div className={styles.headerActionGroup}>
              <Tooltip text="Finaliza e envia a revisão.">
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={iniciarEnvio}
                  disabled={isSaving}
                >
                  <Send size={18} />
                  {isSaving ? 'Enviando...' : 'Enviar revisão'}
                </button>
              </Tooltip>
            </div>}
          </div>
        )}
      </header>

      <div className={`${styles.mainGrid} ${instrumento ? styles.mainGridDetail : styles.mainGridSingle}`}>
        <div className={styles.leftColumn}>
          {!instrumento && (
          <section className={styles.consultSection} aria-labelledby="consultar-instrumento-titulo">
            <div className={styles.sectionTitleBlock}>
              <h2 id="consultar-instrumento-titulo">Consultar instrumento</h2>
            </div>

            <form className={styles.searchPanel} onSubmit={buscarInstrumento}>
              <label>
                <span>Número do instrumento, proposta ou TED</span>
              <input
                value={numeroInstrumento ?? identificador}
                onChange={(event) => setIdentificador(event.target.value)}
                placeholder="Ex.: número do instrumento, proposta ou TED"
              />
              </label>

            <button type="submit" disabled={isLoading}>
              <Search size={18} />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>

            {message && (
              <div
                className={styles.searchMessage}
                role={messageType === 'success' || messageType === 'info' ? 'status' : 'alert'}
              >
                {message}
              </div>
            )}

            </form>
          </section>
          )}

          {instrumento && (
            <section className={styles.reviewContext} aria-labelledby="contexto-revisao-titulo">
              <div className={styles.reviewContextMain}>
                <div className={styles.reviewContextTitleLine}>
                  <h2 id="contexto-revisao-titulo">
                    Instrumento {valorOuTraco(instrumento.nr_instrumento || instrumento.nr_ted)}
                  </h2>
                  <span className={`${styles.reviewStatusBadge} ${styles[`reviewStatus_${contextoAtual.tone}`]}`}>
                    {contextoAtual.status}
                  </span>
                </div>
                <p className={styles.reviewContextObject}>{valorOuTraco(instrumento.objeto)}</p>
                <p className={styles.reviewContextMeta}>
                  {contextoAtual.responsavel && <>Responsável: {contextoAtual.responsavel}</>}
                  {contextoAtual.responsavel && contextoAtual.detalhe && <span aria-hidden="true"> · </span>}
                  {contextoAtual.detalhe}
                </p>
                <button
                  type="button"
                  className={styles.viewRevisionButton}
                  onClick={() => navigate(
                    `/revisao-instrumento/${encodeURIComponent(instrumento.identificador_busca)}/revisoes`
                  )}
                >
                  Histórico de revisões
                </button>
                {dadosBusca?.revisao_pendente_aplicacao?.id_revisao && (
                  <button
                    type="button"
                    className={styles.viewRevisionButton}
                    onClick={() => navigate(
                      `/revisao-instrumento/${encodeURIComponent(instrumento.identificador_busca)}/revisoes/${dadosBusca.revisao_pendente_aplicacao.id_revisao}`
                    )}
                  >
                    Visualizar revisão nº {dadosBusca.revisao_pendente_aplicacao.id_revisao}
                  </button>
                )}
                {dadosBusca?.revisao_pendente_aplicacao && (
                  <p className={styles.reviewContextNotice} role="status">
                    {descricaoRascunhoGlobal(dadosBusca) || 'Sem rascunho atual'}
                  </p>
                )}
                {somenteLeituraPorAtribuicao && (
                  <p className={styles.readOnlyNotice} role="status">
                    Somente leitura · Este instrumento não está atribuído ao seu monitoramento.
                  </p>
                )}
                {bloqueadoPorRascunhoAlheio && (
                  <p className={styles.readOnlyNotice} role="status">
                    Já existe um rascunho em andamento para este instrumento.
                  </p>
                )}
                {message && (
                  <p className={styles.reviewContextMessage} role={messageType === 'error' ? 'alert' : 'status'}>
                    {message}
                  </p>
                )}
                {canEditRevision && temRascunhoAberto && existemItensNaoConferidos() && (
                  <p className={styles.reviewContextNotice} role="status">
                    Há itens ainda não conferidos. Você pode continuar revisando ou enviar somente as alterações já registradas.
                  </p>
                )}
              </div>
            </section>
          )}

          {!instrumento && meusInstrumentos.length > 0 && (
            <section className={styles.meusInstrumentosSection} aria-labelledby="meus-instrumentos-titulo">
              <div className={styles.meusInstrumentosHeader}>
                <div>
                  <h2 id="meus-instrumentos-titulo">Meus instrumentos</h2>
                  <p>Instrumentos atribuídos ao seu monitoramento.</p>
                </div>
                {meusInstrumentos.length > 0 && (
                  <label className={styles.meusInstrumentosFiltro}>
                    <span className={styles.srOnly}>Filtrar meus instrumentos</span>
                    <Search size={16} aria-hidden="true" />
                    <input
                      value={filtroMeusInstrumentos}
                      onChange={(event) => setFiltroMeusInstrumentos(event.target.value)}
                      placeholder="Filtrar meus instrumentos..."
                    />
                  </label>
                )}
              </div>

              {carregandoMeusInstrumentos && (
                <p className={styles.meusInstrumentosEstado}>Carregando instrumentos...</p>
              )}
              {erroMeusInstrumentos && (
                <p className={styles.meusInstrumentosErro} role="alert">{erroMeusInstrumentos}</p>
              )}
              {!carregandoMeusInstrumentos && !erroMeusInstrumentos && meusInstrumentos.length === 0 && (
                <p className={styles.meusInstrumentosEstado}>Nenhum instrumento está atualmente atribuído ao seu monitoramento.</p>
              )}
              {!carregandoMeusInstrumentos && !erroMeusInstrumentos && meusInstrumentos.length > 0 && meusInstrumentosFiltrados.length === 0 && (
                <p className={styles.meusInstrumentosEstado}>Nenhum instrumento corresponde ao filtro.</p>
              )}

              {meusInstrumentosFiltrados.length > 0 && (
                <div className={styles.meusInstrumentosGrid}>
                  {meusInstrumentosFiltrados.map((item) => {
                    const identificadorCard = item.nr_ted ?? item.nr_instrumento
                    const percentualExecucao = formatPercentualPontos(item.percentual_fisico_aferido)
                    return (
                      <button
                        type="button"
                        className={styles.meuInstrumentoCard}
                        key={`${item.tipo_instrumento}-${identificadorCard}`}
                        onClick={() => navegarParaInstrumento(identificadorCard)}
                      >
                        <span className={styles.meuInstrumentoTopo}>
                          <strong>{identificadorCard ?? '-'}</strong>
                          <span>{item.uf ?? '-'}</span>
                        </span>
                        <span className={styles.meuInstrumentoMunicipio}>{item.municipios_beneficiados || 'Município não informado'}</span>
                        <span className={styles.meuInstrumentoProposta}>
                          {item.nr_proposta ? `Proposta ${item.nr_proposta}` : null}
                        </span>

                        <span className={styles.meuInstrumentoMetadados}>
                          <span className={styles.meuInstrumentoCampo}>
                            <small>Tipo</small>
                            <span>{item.tipo_instrumento_label || formatarValorTecnico(item.tipo_instrumento)}</span>
                          </span>
                          <span className={styles.meuInstrumentoCampo}>
                            <small>Execução</small>
                            <span className={styles.meuInstrumentoExecucao}>
                              <span className={styles.meuInstrumentoProgresso} aria-hidden="true">
                                <span style={{ width: `${percentualParaBarra(item.percentual_fisico_aferido)}%` }} />
                              </span>
                              <span>{percentualExecucao}</span>
                            </span>
                          </span>
                        </span>

                        <span className={`${styles.meuInstrumentoCampo} ${styles.meuInstrumentoObjetoCampo}`}>
                          <small>Objeto</small>
                          <span className={styles.meuInstrumentoObjeto} title={item.objeto || undefined}>{item.objeto || '-'}</span>
                        </span>

                        <span className={styles.meuInstrumentoMetadados}>
                          <span className={styles.meuInstrumentoCampo}>
                            <small>Valor global</small>
                            <span className={styles.meuInstrumentoValor}>{formatarValorMonetario(item.valor_global)}</span>
                          </span>
                          <span className={styles.meuInstrumentoCampo}>
                            <small>Status da revisão</small>
                            <span className={styles.meuInstrumentoStatus}>{item.status_revisao_label}</span>
                          </span>
                        </span>

                        <span className={styles.meuInstrumentoRodape}>
                          <span className={styles.meuInstrumentoAbrir}>Abrir revisão →</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {canEditRevision && confirmarEnvioParcial && (
            <div className={styles.confirmationBox} role="dialog" aria-modal="true" aria-labelledby="confirmar-envio-titulo">
              <strong id="confirmar-envio-titulo">Esta revisão possui itens ainda não conferidos.</strong>
              <p>Serão enviadas somente as alterações registradas e o estado atual. Os demais itens não serão modificados e permanecerão aguardando análise.</p>
              <p>Deseja enviar a revisão?</p>
              <div className={styles.confirmationActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setConfirmarEnvioParcial(false)}>
                  Continuar revisando
                </button>
                <button type="button" className={styles.primaryButton} onClick={() => salvarRevisao('enviado')}>
                  Enviar mesmo assim
                </button>
              </div>
            </div>
          )}

          {instrumento && (
            <fieldset className={styles.reviewFieldset}>
              <div className={styles.reviewModule}>
                <section className={styles.generalReviewIntro} aria-labelledby="revisao-geral-titulo">
                  <div>
                    <h2 id="revisao-geral-titulo">Revisão do instrumento</h2>
                  </div>

                  <div className={styles.generalObservation}>
                    <div className={styles.generalFieldHeading}>
                      <h3>Observação geral</h3>
                    </div>

                    {canEditRevision && observacaoEmEdicao ? (
                      <div className={styles.observacaoEditor}>
                        <textarea
                          className={styles.textarea}
                          value={rascunhoObservacaoGeral}
                          onChange={(event) => setRascunhoObservacaoGeral(event.target.value)}
                          rows={4}
                          placeholder="Registre observações gerais da revisão."
                        />
                        <div className={styles.acoesRevisaoInline}>
                          <button type="button" onClick={aplicarObservacaoGeral}>Aplicar</button>
                          <button type="button" onClick={cancelarEdicaoObservacaoGeral}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.observacaoResumo}>
                        <p className={!observacaoGeralTexto ? styles.emptyObservation : undefined}>
                          {observacaoGeralTexto || 'Ainda não cadastrada.'}
                        </p>
                        {canEditRevision && <div className={styles.acaoTextualInline} aria-label="Ações da observação geral">
                          <span className={styles.acaoTextualItem}>
                            <button type="button" className={styles.acaoTextualButton} onClick={abrirEdicaoObservacaoGeral}>
                              {observacaoGeralTexto ? 'Editar' : 'Inserir'}
                            </button>
                          </span>
                          {observacaoGeralTexto && (
                            <>
                              <span className={styles.acaoTextualSeparator} aria-hidden="true">|</span>
                              <span className={styles.acaoTextualItem}>
                                <button type="button" className={styles.acaoTextualButton} onClick={removerObservacaoGeral}>Remover</button>
                              </span>
                            </>
                          )}
                        </div>}
                      </div>
                    )}
                  </div>
                </section>

                <div className={styles.municipalReview}>
                <div className={styles.reviewModuleHeader}>
                  <div>
                    <h2>Municípios do instrumento</h2>
                    <p>
                      {canEditRevision
                        ? 'Revise os dados do instrumento por município.'
                        : 'Consulte os dados do instrumento por município.'}
                    </p>
                  </div>

                  {canEditRevision && <button
                    type="button"
                    className={`${styles.secondaryButton} ${styles.addMunicipioToggle}`}
                    onClick={() => setMostrarFormularioMunicipio(true)}
                  >
                    <Plus size={16} />
                    Adicionar Município
                  </button>}
                </div>

              {canEditRevision && mostrarFormularioMunicipio && (
                <section className={`${styles.panel} ${styles.addMunicipioPanel}`}>
                  <div className={styles.panelHeader}>
                    <h2>Adicionar município</h2>
                  </div>

                  <div className={styles.addGrid}>
                    <label className={styles.municipioOficialSearch}>
                      <span>Município oficial</span>
                      <input
                        value={buscaMunicipioOficial}
                        placeholder="Digite município, UF ou código IBGE"
                        aria-invalid={Boolean(erroMunicipioOficial)}
                        aria-describedby={erroMunicipioOficial ? 'erro-municipio-oficial' : undefined}
                        onChange={(event) => {
                          setBuscaMunicipioOficial(event.target.value)
                          setNovoMunicipio(MUNICIPIO_NOVO_INICIAL)
                          setMunicipioOficialSelecionado(null)
                          setMunicipiosOficiais([])
                          setErroMunicipioOficial('')
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            buscarMunicipioOficial()
                          }
                        }}
                      />
                    </label>

                    <button type="button" onClick={buscarMunicipioOficial} disabled={buscandoMunicipioOficial}>
                      {buscandoMunicipioOficial ? 'Buscando…' : 'Buscar'}
                    </button>

                    {erroMunicipioOficial && (
                      <p id="erro-municipio-oficial" className={styles.municipioOficialErro} role="alert">
                        {erroMunicipioOficial}
                      </p>
                    )}

                    {municipioOficialSelecionado && (
                      <div className={styles.municipioOficialSelecionado} role="status">
                        <strong>{formatarMunicipioUf(novoMunicipio.nome_municipio, novoMunicipio.sigla_uf)}</strong>
                        <span>Código IBGE: {novoMunicipio.cod_municipio}</span>
                        <span>{novoMunicipio.nome_uf}</span>
                      </div>
                    )}

                    {municipiosOficiais.length > 0 && (
                      <div className={styles.municipiosOficiaisResultados} role="listbox" aria-label="Municípios encontrados">
                        {municipiosOficiais.map((municipio) => (
                          <button
                            type="button"
                            role="option"
                            aria-selected="false"
                            key={municipio.cod_municipio}
                            onClick={() => selecionarMunicipioOficial(municipio)}
                          >
                            <strong>{formatarMunicipioUf(municipio.nome_municipio, municipio.sigla_uf)}</strong>
                            <span>— {municipio.cod_municipio}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className={styles.addMunicipioLocalidades}>
                      <h3>Localidades do município</h3>

                      <div className={styles.addMunicipioLocalidadeRow}>
                        <label>
                          <span>Nome da localidade</span>
                          <input
                            value={localidadeNovoMunicipio.nome_localidade_informada}
                            onChange={(event) =>
                              setLocalidadeNovoMunicipio((current) => ({
                                ...current,
                                nome_localidade_informada: event.target.value,
                              }))
                            }
                          />
                        </label>

                        <label>
                          <span>Famílias beneficiadas</span>
                          <input
                            type="number"
                            value={localidadeNovoMunicipio.qtde_familias_ben_sugerida}
                            onChange={(event) =>
                              setLocalidadeNovoMunicipio((current) => ({
                                ...current,
                                qtde_familias_ben_sugerida: event.target.value,
                              }))
                            }
                          />
                        </label>

                        <button type="button" onClick={adicionarLocalidadeNovoMunicipio}>
                          <Plus size={16} />
                          Adicionar localidade
                        </button>
                      </div>

                      {localidadesNovoMunicipio.length > 0 && (
                        <ul className={styles.localidadesTemporarias}>
                          {localidadesNovoMunicipio.map((localidade, localidadeIndex) => (
                            <li key={`${localidade.nome_localidade}-${localidadeIndex}`}>
                              <span>
                                {localidade.nome_localidade} —{' '}
                                {valorOuTraco(localidade.qtde_familias_ben_sugerida)} famílias
                              </span>
                              <button
                                type="button"
                                onClick={() => removerLocalidadeNovoMunicipio(localidadeIndex)}
                              >
                                remover
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <button type="button" onClick={adicionarMunicipio}>
                      <Plus size={16} />
                      Adicionar
                    </button>

                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => {
                        setMostrarFormularioMunicipio(false)
                        setNovoMunicipio(MUNICIPIO_NOVO_INICIAL)
                        setBuscaMunicipioOficial('')
                        setMunicipiosOficiais([])
                        setMunicipioOficialSelecionado(null)
                        setErroMunicipioOficial('')
                        setLocalidadeNovoMunicipio(LOCALIDADE_NOVA_INICIAL)
                        setLocalidadesNovoMunicipio([])
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </section>
              )}

              <section className={styles.municipiosList}>
                {municipios.length === 0 ? (
                  <div className={styles.emptyState}>
                    Nenhum município encontrado para este instrumento.
                  </div>
                ) : (
                  municipios.map((municipio) => {
                    const formLocalidade =
                      novaLocalidadePorMunicipio[municipio.cod_municipio] ??
                      LOCALIDADE_NOVA_INICIAL

                    const isNovaLocalidadeAberta = Boolean(
                      novaLocalidadeAbertaPorMunicipio[municipio.cod_municipio]
                    )

                    const isAberto = municipioAberto === municipio.cod_municipio
                    const mostrarConfirmacao = municipio.obras_saneamento.some(
                      (obra) => obra.relacao_instrumento !== 'nao_analisada'
                    )

                    return (
                      <article
                        className={`${styles.municipioCard} ${
                          isAberto ? styles.municipioCardAberto : ''
                        }`}
                        key={municipio.cod_municipio}
                      >
                        <div
                          className={styles.municipioSummary}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isAberto}
                          onClick={() =>
                            setMunicipioAberto(isAberto ? null : municipio.cod_municipio)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setMunicipioAberto(isAberto ? null : municipio.cod_municipio)
                            }
                          }}
                        >
                          <div className={styles.municipioTitleGroup}>
                            <div className={styles.municipioTitleLine}>
                              <h2>{formatarMunicipioUf(municipio.nome, municipio.uf)}</h2>

                              <div className={styles.summaryMeta}>
                                <span className={styles.statusChip}>
                                  {statusVisualMunicipio(municipio)}
                                </span>
                                <span>{municipio.localidades.length} localidade(s)</span>
                                <span>{municipio.obras_saneamento.length} outra(s) obra(s)</span>
                              </div>

                              {municipio.origem_registro === 'adicionado_tecnico' && (
                                <span className={styles.addedChip}>Incluído nesta revisão</span>
                              )}
                            </div>

                            <p>Código IBGE: {municipio.cod_municipio}</p>
                          </div>

                          <div className={styles.summaryActions}>
                            <button
                              type="button"
                              className={styles.reviewButton}
                              onClick={(event) => {
                                event.stopPropagation()
                                setMunicipioAberto(isAberto ? null : municipio.cod_municipio)
                              }}
                            >
                              <ChevronDown
                                size={18}
                                className={isAberto ? styles.chevronOpen : ''}
                              />
                              {isAberto ? 'Fechar' : 'Abrir'}
                            </button>
                          </div>
                        </div>

                        {isAberto && (
                          <div className={styles.municipioContent}>
                            <div className={styles.reviewGrid}>
                              {municipio.origem_registro !== 'adicionado_tecnico' && (
                                <div className={styles.municipioAcaoLinha}>
                                  <div className={styles.sectionHeader}>
                                    <span className={styles.sectionHeaderTitle}>Revisão do Município</span>
                                    <span className={styles.sectionHeaderSeparator} aria-hidden="true"/>
                                    <span className={styles.sectionHeaderMeta}>
                                      {formatarDataConferencia(municipio.revisao_municipio_conferida_em)}
                                    </span>
                                  </div>
                                  {canEditRevision ? (
                                    <div
                                      className={styles.acaoTextualInline}
                                      role="group"
                                      aria-label="Revisão do Município"
                                    >
                                      {ACOES_MUNICIPIO.map((acao, acaoIndex) => {
                                        const isActive = municipio.acao_sugerida === acao.value

                                        return (
                                          <span key={acao.value} className={styles.acaoTextualItem}>
                                            <button
                                              type="button"
                                              className={`${styles.acaoTextualButton} ${
                                                isActive ? styles.acaoTextualButtonActive : ''
                                              }`}
                                              aria-pressed={isActive}
                                              onClick={() =>
                                                atualizarAcaoMunicipio(
                                                  municipio.cod_municipio,
                                                  acao.value
                                                )
                                              }
                                            >
                                              {acao.label}
                                            </button>

                                            {acaoIndex < ACOES_MUNICIPIO.length - 1 && (
                                              <span className={styles.acaoTextualSeparator}>|</span>
                                            )}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <span>{ACOES_MUNICIPIO.find((acao) => acao.value === municipio.acao_sugerida)?.label || 'Não revisado'}</span>
                                  )}
                                </div>
                              )}

                              {municipio.acao_sugerida === 'remover' && canEditRevision && (
                                <label className={styles.justificativaMunicipio}>
                                  <span>Justificativa</span>
                                  <textarea
                                    value={municipio.justificativa ?? ''}
                                    onChange={(event) =>
                                      atualizarMunicipio(
                                        municipio.cod_municipio,
                                        'justificativa',
                                        event.target.value
                                      )
                                    }
                                    rows={3}
                                  />
                                </label>
                              )}
                              {municipio.acao_sugerida === 'remover' && !canEditRevision && municipio.justificativa && (
                                <div className={styles.readOnlyValue}>
                                  <span>Justificativa</span>
                                  <p>{municipio.justificativa}</p>
                                </div>
                              )}
                            </div>

                            <div className={`${styles.subsection} ${styles.obrasSection}`}>
                              <div className={styles.sectionHeader}>
                                <h3>Localidades beneficiadas</h3>
                                <span className={styles.sectionHeaderSeparator} aria-hidden="true"/>
                                <span className={styles.sectionHeaderMeta}>
                                  {resumoConferenciaSecao(municipio.localidades, 'localidades')}
                                </span>
                              </div>

                              <div className={styles.tableScroller}>
                                <table className={`${styles.table} ${styles.localidadesTable}`}>
                                  <thead>
                                    <tr>
                                      <th>Localidade</th>
                                      <th>Revisão da Localidade</th>
                                      <th>Famílias Beneficiadas</th>
                                      <th>Observação</th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {municipio.localidades.length === 0 ? (
                                      <tr>
                                        <td colSpan={4} className={styles.emptyCell}>
                                          Nenhuma localidade cadastrada.
                                        </td>
                                      </tr>
                                    ) : (
                                      municipio.localidades.map((localidade) => {
                                        const isAdicionada =
                                          localidade.origem_registro === 'adicionado_tecnico'
                                        const isCorrigir =
                                          localidade.acao_sugerida === 'corrigir'
                                        const chaveJustificativaLocalidade =
                                          chaveLocalidade(localidade)
                                        const mostrarJustificativa = Boolean(
                                          justificativasLocalidadeAbertas[chaveJustificativaLocalidade]
                                        )

                                        return (
                                          <tr
                                            key={chaveJustificativaLocalidade}
                                          >
                                            <td>
                                              <div className={styles.localidadeCell}>
                                                <span>
                                                  {valorOuTraco(localidade.nome_localidade)}
                                                </span>
                                              </div>
                                            </td>

                                            <td>
                                              {isAdicionada ? (
                                                <span className={styles.addedChip}>
                                                  Incluída nesta revisão
                                                </span>
                                              ) : !canEditRevision ? (
                                                <span>
                                                  {ACOES_LOCALIDADE_EXISTENTE.find(
                                                    (acao) => acao.value === localidade.acao_sugerida
                                                  )?.label || 'Não revisada'}
                                                </span>
                                              ) : (
                                                <div
                                                  className={styles.acaoTextualInline}
                                                  role="group"
                                                  aria-label="Ação da localidade"
                                                >
                                                  {ACOES_LOCALIDADE_EXISTENTE.map(
                                                    (acao, acaoIndex) => {
                                                      const isActive =
                                                        localidade.acao_sugerida === acao.value

                                                      return (
                                                        <span
                                                          key={acao.value}
                                                          className={styles.acaoTextualItem}
                                                        >
                                                          <button
                                                            type="button"
                                                            className={`${
                                                              styles.acaoTextualButton
                                                            } ${
                                                              isActive
                                                                ? styles.acaoTextualButtonActive
                                                                : ''
                                                            }`}
                                                            aria-pressed={isActive}
                                                            onClick={() =>
                                                              atualizarAcaoLocalidade(
                                                                municipio.cod_municipio,
                                                                chaveJustificativaLocalidade,
                                                                acao.value
                                                              )
                                                            }
                                                          >
                                                            {acao.label}
                                                          </button>

                                                          {acaoIndex <
                                                            ACOES_LOCALIDADE_EXISTENTE.length -
                                                              1 && (
                                                            <span
                                                              className={
                                                                styles.acaoTextualSeparator
                                                              }
                                                            >
                                                              |
                                                            </span>
                                                          )}
                                                        </span>
                                                      )
                                                    }
                                                  )}
                                                </div>
                                              )}
                                            </td>

                                            <td>
                                              {isAdicionada ? (
                                                valorOuTraco(
                                                  localidade.qtde_familias_ben_sugerida
                                                )
                                              ) : isCorrigir && canEditRevision ? (
                                                <div className={styles.familiasCell}>
                                                  <span>
                                                    Atual:{' '}
                                                    {valorOuTraco(
                                                      localidade.qtde_familias_ben_original
                                                    )}
                                                  </span>
                                                  <label>
                                                    <span>Novo valor: </span>
                                                    <input
                                                      type="number"
                                                      value={
                                                        localidade.qtde_familias_ben_sugerida ??
                                                        ''
                                                      }
                                                      onChange={(event) =>
                                                        atualizarFamiliasLocalidade(
                                                          municipio.cod_municipio,
                                                          chaveJustificativaLocalidade,
                                                          event.target.value
                                                        )
                                                      }
                                                    />
                                                  </label>
                                                </div>
                                              ) : isCorrigir ? (
                                                valorOuTraco(
                                                  localidade.qtde_familias_ben_sugerida ??
                                                    localidade.qtde_familias_ben_original
                                                )
                                              ) : (
                                                valorOuTraco(
                                                  localidade.qtde_familias_ben_original
                                                )
                                              )}
                                            </td>

                                            <td>
                                              {!canEditRevision ? (
                                                valorOuTraco(localidade.justificativa)
                                              ) : mostrarJustificativa ? (
                                                <div className={styles.justificativaAberta}>
                                                  <textarea
                                                    value={localidade.justificativa ?? ''}
                                                    onChange={(event) =>
                                                      atualizarLocalidade(
                                                        municipio.cod_municipio,
                                                        chaveJustificativaLocalidade,
                                                        'justificativa',
                                                        event.target.value
                                                      )
                                                    }
                                                    rows={2}
                                                  />
                                                  <button
                                                    type="button"
                                                    className={styles.justificativaFechar}
                                                    title="Fechar justificativa"
                                                    aria-label="Fechar justificativa da localidade"
                                                    onClick={() =>
                                                      alternarJustificativaLocalidade(chaveJustificativaLocalidade)
                                                    }
                                                  >
                                                    <X size={14} />
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  className={styles.justificativaToggle}
                                                  title="Adicionar justificativa"
                                                  aria-label="Adicionar justificativa da localidade"
                                                  onClick={() =>
                                                    alternarJustificativaLocalidade(
                                                      chaveJustificativaLocalidade
                                                    )
                                                  }
                                                >
                                                  <Plus size={14} />
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        )
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {canEditRevision && (!isNovaLocalidadeAberta ? (
                                <button
                                  type="button"
                                  className={`${styles.secondaryButton} ${styles.addLocalidadeToggle}`}
                                  onClick={() =>
                                    setNovaLocalidadeAbertaPorMunicipio((current) => ({
                                      ...current,
                                      [municipio.cod_municipio]: true,
                                    }))
                                  }
                                >
                                  <Plus size={16} />
                                  Adicionar localidade
                                </button>
                              ) : (
                                <div className={styles.addLocalidadeGrid}>
                                  <label>
                                    <span>Nome da localidade</span>
                                    <input
                                      value={formLocalidade.nome_localidade_informada}
                                      onChange={(event) =>
                                        atualizarNovaLocalidade(
                                          municipio.cod_municipio,
                                          'nome_localidade_informada',
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>

                                  <label>
                                    <span>Famílias beneficiadas</span>
                                    <input
                                      type="number"
                                      value={formLocalidade.qtde_familias_ben_sugerida}
                                      onChange={(event) =>
                                        atualizarNovaLocalidade(
                                          municipio.cod_municipio,
                                          'qtde_familias_ben_sugerida',
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => adicionarLocalidade(municipio.cod_municipio)}
                                  >
                                    <Plus size={16} />
                                    Adicionar Localidade
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={() => {
                                      setNovaLocalidadeAbertaPorMunicipio((current) => ({
                                        ...current,
                                        [municipio.cod_municipio]: false,
                                      }))
                                      setNovaLocalidadePorMunicipio((current) => ({
                                        ...current,
                                        [municipio.cod_municipio]: LOCALIDADE_NOVA_INICIAL,
                                      }))
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className={styles.revisaoDuasColunas}>
                              <div className={`${styles.subsection} ${styles.localidadesSection}`}>
                                <div className={styles.sectionHeader}>
                                  <h3>Revisão de sobreposição de ação/obras</h3>
                                  <span className={styles.sectionHeaderSeparator} aria-hidden="true"/>
                                  <span className={styles.sectionHeaderMeta}>
                                    {resumoConferenciaSecao(municipio.obras_saneamento, 'obras')}
                                  </span>
                                </div>

                                <div className={styles.tableScroller}>
                                  <table
                                    className={`${styles.table} ${styles.obrasTable} ${
                                      mostrarConfirmacao
                                        ? styles.obrasTableComConfirmacao
                                        : styles.obrasTableSemConfirmacao
                                    }`}
                                  >
                                    <colgroup>
                                      <col className={styles.colObra} />
                                      <col className={styles.colOrgao} />
                                      <col className={styles.colRelacao} />
                                      {mostrarConfirmacao && (
                                        <col className={styles.colConfirmacao} />
                                      )}
                                      <col className={styles.colObservacao} />
                                      <col className={styles.colLinks} />
                                    </colgroup>
                                    <thead>
                                      <tr>
                                        <th className={styles.colunaObra}>Obra</th>
                                        <th>Órgão Responsável</th>
                                        <th>Avaliação</th>
                                        {mostrarConfirmacao && <th>Confirmação</th>}
                                        <th>Observação</th>
                                        <th>Links</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {municipio.obras_saneamento.length === 0 ? (
                                        <tr>
                                          <td
                                            colSpan={mostrarConfirmacao ? 6 : 5}
                                            className={styles.emptyCell}
                                          >
                                            Nenhuma obra encontrada.
                                          </td>
                                        </tr>
                                      ) : (
                                        municipio.obras_saneamento.map((obra) => {
                                          const chaveJustificativaObra = chaveObra(obra)
                                          const mostrarJustificativaObra = Boolean(
                                            justificativasObraAbertas[chaveJustificativaObra]
                                          )

                                          return (
                                            <tr key={chaveJustificativaObra}>
                                              <td className={styles.colunaObra}>
                                                {valorOuTraco(obra.descricao)}
                                              </td>
                                              <td>{valorOuTraco(obra.orgao)}</td>
                                              <td>
                                                {canEditRevision ? (
                                                  <select
                                                    value={obra.relacao_instrumento}
                                                    onChange={(event) =>
                                                      atualizarObra(
                                                        municipio.cod_municipio,
                                                        obra.id_obra,
                                                        'relacao_instrumento',
                                                        event.target.value
                                                      )
                                                    }
                                                  >
                                                    {RELACOES_INSTRUMENTO.map((relacao) => (
                                                      <option
                                                        key={relacao.value}
                                                        value={relacao.value}
                                                      >
                                                        {relacao.label}
                                                      </option>
                                                    ))}
                                                  </select>
                                                ) : (
                                                  RELACOES_INSTRUMENTO.find(
                                                    (relacao) => relacao.value === obra.relacao_instrumento
                                                  )?.label || 'Não analisada'
                                                )}
                                              </td>
                                              {mostrarConfirmacao && (
                                                <td>
                                                  {obra.relacao_instrumento ===
                                                  'nao_analisada' ? (
                                                    <span className={styles.confirmacaoNeutra}>
                                                      —
                                                    </span>
                                                  ) : canEditRevision ? (
                                                    <select
                                                      value={obra.confirmacao_status}
                                                      onChange={(event) =>
                                                        atualizarObra(
                                                          municipio.cod_municipio,
                                                          obra.id_obra,
                                                          'confirmacao_status',
                                                          event.target.value
                                                        )
                                                      }
                                                    >
                                                      {confirmacoesPermitidas(
                                                        obra.relacao_instrumento
                                                      ).map((confirmacao) => (
                                                        <option
                                                          key={confirmacao.value}
                                                          value={confirmacao.value}
                                                        >
                                                          {confirmacao.label}
                                                        </option>
                                                      ))}
                                                    </select>
                                                  ) : (
                                                    confirmacoesPermitidas(obra.relacao_instrumento).find(
                                                      (confirmacao) => confirmacao.value === obra.confirmacao_status
                                                    )?.label || '—'
                                                  )}
                                                </td>
                                              )}
                                              <td>
                                                {!canEditRevision ? (
                                                  valorOuTraco(obra.justificativa)
                                                ) : mostrarJustificativaObra ? (
                                                  <div className={styles.justificativaAberta}>
                                                    <textarea
                                                      value={obra.justificativa ?? ''}
                                                      onChange={(event) =>
                                                        atualizarObra(
                                                          municipio.cod_municipio,
                                                          obra.id_obra,
                                                          'justificativa',
                                                          event.target.value
                                                        )
                                                      }
                                                      rows={2}
                                                    />
                                                    <button
                                                      type="button"
                                                      className={styles.justificativaFechar}
                                                      title="Fechar justificativa"
                                                      aria-label="Fechar justificativa da obra"
                                                      onClick={() =>
                                                        alternarJustificativaObra(chaveJustificativaObra)
                                                      }
                                                    >
                                                      <X size={14} />
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <button
                                                  type="button"
                                                  className={styles.justificativaToggle}
                                                  title="Adicionar justificativa"
                                                  aria-label="Adicionar justificativa da obra"
                                                  onClick={() =>
                                                    alternarJustificativaObra(
                                                      chaveJustificativaObra
                                                    )
                                                  }
                                                >
                                                  <Plus size={14} />
                                                </button>
                                              )}
                                            </td>
                                              <td>
                                                <div className={styles.linksColumn}>
                                                  {obra.link_transferegov && (
                                                    <a
                                                      href={obra.link_transferegov}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                    >
                                                      Transferegov
                                                    </a>
                                                  )}
                                                  {obra.link_obrasgov && (
                                                    <a
                                                      href={obra.link_obrasgov}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                    >
                                                      Obrasgov
                                                    </a>
                                                  )}
                                                </div>
                                              </td>
                                          </tr>
                                          )
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {erroMunicipio[municipio.cod_municipio] && (
                              <div className={styles.municipioError} role="alert">
                                {erroMunicipio[municipio.cod_municipio]}
                              </div>
                            )}

                          </div>
                        )}
                      </article>
                    )
                  })
                )}
              </section>

                </div>

              {publicoAlvo.length > 0 && (
                <section className={`${styles.panel} ${styles.publicoAlvoSection}`} aria-labelledby="revisao-geral-titulo">
                  <div className={styles.sectionHeader}>
                    <h2>Público alvo</h2>
                    <span className={styles.sectionHeaderSeparator} aria-hidden="true"/>
                    <span className={styles.sectionHeaderMeta}>
                      {publicoAlvoTemAlteracoes(publicoAlvo)
                        ? 'Alterações não salvas'
                        : `${formatarDataConferencia(dataConferenciaPublicoAlvo(publicoAlvo))}${formatarValidade(validadeConferenciaPublicoAlvo(publicoAlvo)) ? ` · ${formatarValidade(validadeConferenciaPublicoAlvo(publicoAlvo))}` : ''}`}
                    </span>
                  </div>

                  <div className={styles.publicoAlvoList}>
                    {publicoAlvo.map((item) => {
                      const chave = chavePublicoAlvo(item)
                      const chaveEdicaoPopulacao = chaveEdicaoPublicoAlvo(
                        chave,
                        'populacao_beneficiada_revisada'
                      )
                      const chaveEdicaoDescricao = chaveEdicaoPublicoAlvo(
                        chave,
                        'desc_populacao_beneficiada_revisada'
                      )
                      const editandoPopulacao =
                        Object.prototype.hasOwnProperty.call(
                          edicoesPublicoAlvo,
                          chaveEdicaoPopulacao
                        )
                      const editandoDescricao =
                        Object.prototype.hasOwnProperty.call(
                          edicoesPublicoAlvo,
                          chaveEdicaoDescricao
                        )

                      return (
                        <article className={styles.publicoAlvoItem} key={chave}>
                          <div className={styles.publicoAlvoHeader}>
                            <div>
                              <h3>{valorOuTraco(item.nome_obra)}</h3>
                            </div>
                          </div>

                          <div className={styles.publicoAlvoGrid}>
                            <div className={styles.publicoAlvoCampo}>
                              <span>População beneficiada</span>
                              {canEditRevision && editandoPopulacao ? (
                                <div className={styles.campoRevisaoInline}>
                                  <input
                                    value={edicoesPublicoAlvo[chaveEdicaoPopulacao]}
                                    onChange={(event) =>
                                      atualizarRascunhoPublicoAlvo(
                                        chaveEdicaoPopulacao,
                                        event.target.value
                                      )
                                    }
                                  />
                                  <div className={styles.acoesRevisaoInline}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        aplicarEdicaoPublicoAlvo(
                                          item.id_projeto_investimento,
                                          'populacao_beneficiada_revisada',
                                          chaveEdicaoPopulacao
                                        )
                                      }
                                    >
                                      Aplicar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        fecharEdicaoPublicoAlvo(chaveEdicaoPopulacao)
                                      }
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.valorRevisavelCell}>
                                  <strong>
                                    {valorOuTraco(
                                      valorExibicaoPublicoAlvo(
                                        item,
                                        'populacao_beneficiada_original',
                                        'populacao_beneficiada_revisada'
                                      )
                                    )}
                                  </strong>
                                  {canEditRevision && <button
                                    type="button"
                                    className={`${styles.acaoTextualButton} ${styles.corrigirInlineButton}`}
                                    onClick={() =>
                                      iniciarEdicaoPublicoAlvo(
                                        item,
                                        'populacao_beneficiada_original',
                                        'populacao_beneficiada_revisada'
                                      )
                                    }
                                  >
                                    Corrigir
                                  </button>}
                                </div>
                              )}
                            </div>

                            <div className={styles.publicoAlvoCampo}>
                              <span>Descrição da população beneficiada</span>
                              {canEditRevision && editandoDescricao ? (
                                <div className={styles.campoRevisaoInline}>
                                  <textarea
                                    value={edicoesPublicoAlvo[chaveEdicaoDescricao]}
                                    onChange={(event) =>
                                      atualizarRascunhoPublicoAlvo(
                                        chaveEdicaoDescricao,
                                        event.target.value
                                      )
                                    }
                                    rows={3}
                                  />
                                  <div className={styles.acoesRevisaoInline}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        aplicarEdicaoPublicoAlvo(
                                          item.id_projeto_investimento,
                                          'desc_populacao_beneficiada_revisada',
                                          chaveEdicaoDescricao
                                        )
                                      }
                                    >
                                      Aplicar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        fecharEdicaoPublicoAlvo(chaveEdicaoDescricao)
                                      }
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.valorRevisavelCell}>
                                  <strong className={styles.valorOriginalTextoLongo}>
                                    {valorOuTraco(
                                      valorExibicaoPublicoAlvo(
                                        item,
                                        'desc_populacao_beneficiada_original',
                                        'desc_populacao_beneficiada_revisada'
                                      )
                                    )}
                                  </strong>
                                  {canEditRevision && <button
                                    type="button"
                                    className={`${styles.acaoTextualButton} ${styles.corrigirInlineButton}`}
                                    onClick={() =>
                                      iniciarEdicaoPublicoAlvo(
                                        item,
                                        'desc_populacao_beneficiada_original',
                                        'desc_populacao_beneficiada_revisada'
                                      )
                                    }
                                  >
                                    Corrigir
                                  </button>}
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              )}
              </div>
            </fieldset>
          )}
        </div>

        {instrumento && (
          <aside className={styles.rightColumn}>
            <section className={styles.panel}>
              <button
                type="button"
                className={styles.instrumentDetailsToggle}
                aria-expanded={detalhesInstrumentoAbertos}
                aria-controls="dados-instrumento-detalhes"
                onClick={() => setDetalhesInstrumentoAbertos((abertos) => !abertos)}
              >
                <span>
                  <strong>Dados do instrumento</strong>
                  <small>
                    {formatarValorTecnico(instrumento.tipo_instrumento)}
                    {' · '}{instrumento.nr_proposta ? `Proposta ${instrumento.nr_proposta}` : 'Sem proposta'}
                    {' · '}{valorOuTraco(instrumento.nome_proponente || instrumento.orgao)}
                    {' · '}{valorOuTraco(instrumento.uf)}
                  </small>
                </span>
                <span className={styles.instrumentDetailsAction}>
                  {detalhesInstrumentoAbertos ? 'Ocultar detalhes' : 'Exibir detalhes'}
                  <ChevronDown size={16} aria-hidden="true" />
                </span>
              </button>

              {detalhesInstrumentoAbertos && (
              <dl className={styles.readonlyGrid} id="dados-instrumento-detalhes">
                <div>
                  <dt>Identificador Buscado</dt>
                  <dd>{valorOuTraco(instrumento.identificador_busca)}</dd>
                </div>

                <div>
                  <dt>Tipo</dt>
                  <dd>{formatarValorTecnico(instrumento.tipo_instrumento)}</dd>
                </div>

                <div>
                  <dt>Nº da Proposta</dt>
                  <dd>{valorOuTraco(instrumento.nr_proposta)}</dd>
                </div>

                <div>
                  <dt>Nº do Instrumento</dt>
                  <dd>{valorOuTraco(instrumento.nr_instrumento)}</dd>
                </div>

                <div>
                  <dt>Nº do TED</dt>
                  <dd>{valorOuTraco(instrumento.nr_ted)}</dd>
                </div>

                <div>
                  <dt>Tipo de Obra</dt>
                  <dd>{formatarValorTecnico(instrumento.tipo_obra)}</dd>
                </div>

                <div className={`${styles.fullItem} ${styles.instrumentObject}`}>
                  <dt>Objeto</dt>
                  <dd>{valorOuTraco(instrumento.objeto)}</dd>
                </div>

                <div>
                  <dt>Nome do Proponente</dt>
                  <dd>{valorOuTraco(instrumento.nome_proponente || instrumento.orgao)}</dd>
                </div>

                <div className={styles.compactItem}>
                  <dt>UF</dt>
                  <dd>{valorOuTraco(instrumento.uf)}</dd>
                </div>

                <div className={styles.fullItem}>
                  <dt>Situação Atual</dt>
                  <dd>{valorOuTraco(instrumento.situacao_atual)}</dd>
                </div>

                {(instrumento.link_transferegov || instrumento.link_saci) && (
                  <div className={`${styles.fullItem} ${styles.linksItem}`}>
                    <dt>Links</dt>
                    <dd className={styles.officialLinks}>
                      {instrumento.link_transferegov && (
                        <a
                          className={styles.officialLink}
                          href={instrumento.link_transferegov}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Transferegov
                        </a>
                      )}

                      {instrumento.link_transferegov && instrumento.link_saci && (
                        <span aria-hidden="true">·</span>
                      )}

                      {instrumento.link_saci && (
                        <a
                          className={styles.officialLink}
                          href={instrumento.link_saci}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          SACI
                        </a>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              )}
            </section>
          </aside>
        )}
      </div>

    </main>
  )
}
