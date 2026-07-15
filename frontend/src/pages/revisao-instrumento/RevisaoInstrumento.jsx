import { useState } from 'react'
import { Check, ChevronDown, Plus, Save, Search, Send, X } from 'lucide-react'
import { revisaoInstrumentoApi } from '@/api/revisaoInstrumento'
import styles from './RevisaoInstrumento.module.css'

const ACOES_MUNICIPIO = [
  { value: 'manter', label: 'Manter', icon: Check },
  { value: 'remover', label: 'Remover', icon: X },
]

const LABELS_ACAO_MUNICIPIO = {
  manter: 'Manter',
  remover: 'Remover',
  adicionar: 'Incluído nesta revisão',
}

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

const MUNICIPIO_NOVO_INICIAL = {
  cod_municipio: '',
  nome: '',
  uf: '',
}

const CONFIRMACOES_STATUS = [
  { value: 'nao_confirmada', label: 'Não confirmada' },
  { value: 'sem_conflito', label: 'Sem conflito' },
  { value: 'sobreposicao_confirmada', label: 'Sobreposição confirmada' },
]

const LOCALIDADE_NOVA_INICIAL = {
  nome_localidade_informada: '',
  qtde_familias_ben_sugerida: '',
}

function valorOuTraco(value) {
  return value === null || value === undefined || value === '' ? '-' : value
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

function getLabelAcaoMunicipio(value) {
  return LABELS_ACAO_MUNICIPIO[value] ?? formatarValorTecnico(value)
}

function formatarMunicipioUf(nome, uf) {
  if (!nome) return '-'
  if (String(nome).includes('/')) return nome
  return uf ? `${nome}/${uf}` : nome
}

function numeroOuNull(value) {
  if (value === null || value === undefined || value === '') return null

  const numero = Number(value)
  return Number.isNaN(numero) ? null : numero
}

function normalizarRelacaoInstrumento(value) {
  return RELACOES_INSTRUMENTO.some((option) => option.value === value)
    ? value
    : 'nao_analisada'
}

function normalizarConfirmacaoStatus(relacaoInstrumento, value) {
  if (relacaoInstrumento === 'nao_analisada') return null

  return CONFIRMACOES_STATUS.some((option) => option.value === value)
    ? value
    : 'nao_confirmada'
}

function normalizarObra(obra) {
  const relacaoInstrumento = normalizarRelacaoInstrumento(obra.relacao_instrumento)

  return {
    ...obra,
    relacao_instrumento: relacaoInstrumento,
    confirmacao_status: normalizarConfirmacaoStatus(
      relacaoInstrumento,
      obra.confirmacao_status
    ),
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
  const relacaoInstrumento = normalizarRelacaoInstrumento(obra.relacao_instrumento)

  return {
    id_revisao_obra: obra.id_revisao_obra ?? null,
    id_obra: obra.id_obra,
    cod_municipio: obra.cod_municipio || codMunicipio,
    descricao: obra.descricao ?? null,
    orgao: obra.orgao ?? null,
    link_transferegov: obra.link_transferegov ?? null,
    link_obrasgov: obra.link_obrasgov ?? null,
    relacao_instrumento: relacaoInstrumento,
    confirmacao_status: normalizarConfirmacaoStatus(
      relacaoInstrumento,
      obra.confirmacao_status
    ),
    justificativa: limparTexto(obra.justificativa),
  }
}

function objetosIguais(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function semIdsPersistencia(dados) {
  if (!dados) return dados

  const {
    id_revisao_localidade: _idRevisaoLocalidade,
    id_revisao_obra: _idRevisaoObra,
    ...restante
  } = dados

  return restante
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
  if (municipioTemAlteracoes(municipio)) return 'Em revisão'
  if (municipioTemHistorico(municipio) || municipio._salvoNestaSessao) return 'Revisão salva'
  return 'Revisão pendente'
}

function formatarDataConferencia(value) {
  if (!value) return 'Ainda não conferida'

  const dataParte = String(value).split(/[T ]/)[0]
  const [ano, mes, dia] = dataParte.split('-')

  if (!ano || !mes || !dia) return 'Ainda não conferida'

  return `Última conferência em ${dia}/${mes}/${ano}`
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
  const [identificador, setIdentificador] = useState('')
  const [dadosBusca, setDadosBusca] = useState(null)
  const [idRevisao, setIdRevisao] = useState(null)
  const [municipios, setMunicipios] = useState([])
  const [municipioAberto, setMunicipioAberto] = useState(null)
  const [observacaoGeral, setObservacaoGeral] = useState('')
  const [novoMunicipio, setNovoMunicipio] = useState(MUNICIPIO_NOVO_INICIAL)
  const [localidadeNovoMunicipio, setLocalidadeNovoMunicipio] = useState(LOCALIDADE_NOVA_INICIAL)
  const [localidadesNovoMunicipio, setLocalidadesNovoMunicipio] = useState([])
  const [mostrarFormularioMunicipio, setMostrarFormularioMunicipio] = useState(false)
  const [novaLocalidadePorMunicipio, setNovaLocalidadePorMunicipio] = useState({})
  const [novaLocalidadeAbertaPorMunicipio, setNovaLocalidadeAbertaPorMunicipio] = useState({})
  const [justificativasLocalidadeAbertas, setJustificativasLocalidadeAbertas] = useState({})
  const [justificativasObraAbertas, setJustificativasObraAbertas] = useState({})
  const [salvandoMunicipio, setSalvandoMunicipio] = useState({})
  const [erroMunicipio, setErroMunicipio] = useState({})

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const instrumento = dadosBusca?.instrumento ?? null

  const buscarInstrumento = async (event) => {
    event.preventDefault()

    const termo = identificador.trim()

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
    setMunicipioAberto(null)
    setObservacaoGeral('')
    setMostrarFormularioMunicipio(false)
    setNovaLocalidadeAbertaPorMunicipio({})
    setJustificativasLocalidadeAbertas({})
    setJustificativasObraAbertas({})
    setSalvandoMunicipio({})
    setErroMunicipio({})

    try {
      const data = await revisaoInstrumentoApi.buscarInstrumento(termo)
      setDadosBusca(data)
      setIdRevisao(data.id_revisao ?? null)
      setObservacaoGeral(data.observacao_geral ?? '')
      setMunicipios(copiarMunicipios(data.municipios))
    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
          'Não foi possível localizar o instrumento informado.'
      )
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

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

  const adicionarMunicipio = () => {
    const codMunicipio = numeroOuNull(novoMunicipio.cod_municipio)

    if (!codMunicipio) {
      setMessage('Informe o código IBGE do município a adicionar.')
      setMessageType('error')
      return
    }

    if (municipios.some((municipio) => municipio.cod_municipio === codMunicipio)) {
      setMessage('Este município já está na revisão.')
      setMessageType('error')
      return
    }

    const novoItem = {
      cod_municipio: codMunicipio,
      nome: novoMunicipio.nome.trim() || null,
      uf: novoMunicipio.uf.trim().toUpperCase() || null,
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
    setLocalidadeNovoMunicipio(LOCALIDADE_NOVA_INICIAL)
    setLocalidadesNovoMunicipio([])
    setMostrarFormularioMunicipio(false)
    setMessage('')
    setMessageType('')
  }

  const removerMunicipioAdicionado = (index) => {
    const municipioRemovido = municipios[index]
    setMunicipios((current) => current.filter((_, municipioIndex) => municipioIndex !== index))
    if (municipioAberto === municipioRemovido?.cod_municipio) {
      setMunicipioAberto(null)
    }
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
              confirmacao_status: normalizarConfirmacaoStatus(
                relacaoInstrumento,
                obra.confirmacao_status
              ),
            }
          } else if (campo === 'confirmacao_status') {
            atualizada = {
              ...obra,
              confirmacao_status: normalizarConfirmacaoStatus(
                obra.relacao_instrumento,
                valor
              ),
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

  const aplicarResultadoMunicipio = (payload, data) => {
    setIdRevisao(data.id_revisao)
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

          const atualizada = normalizarObra({ ...obra, ...retornoObra })

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

  const salvarMunicipio = async (
    municipio,
    idRevisaoAtual = idRevisao,
    { propagarErro = false } = {}
  ) => {
    if (!instrumento || !municipioTemAlteracoes(municipio)) return idRevisaoAtual

    const payload = montarPayloadMunicipio(municipio, idRevisaoAtual)
    const codMunicipio = municipio.cod_municipio

    setSalvandoMunicipio((current) => ({ ...current, [codMunicipio]: true }))
    setErroMunicipio((current) => ({ ...current, [codMunicipio]: '' }))
    setMessage('')
    setMessageType('')

    try {
      const data = await revisaoInstrumentoApi.salvarMunicipio(payload)
      aplicarResultadoMunicipio(payload, data)
      setMessage(`${data.mensagem} ID da revisão: ${data.id_revisao}.`)
      setMessageType('success')
      return data.id_revisao
    } catch (err) {
      const mensagem =
        err?.response?.data?.detail ||
        'Não foi possível salvar as alterações deste município.'
      setErroMunicipio((current) => ({ ...current, [codMunicipio]: mensagem }))
      setMessage(mensagem)
      setMessageType('error')
      if (propagarErro) {
        throw new Error(mensagem)
      }
      return idRevisaoAtual
    } finally {
      setSalvandoMunicipio((current) => ({ ...current, [codMunicipio]: false }))
    }
  }

  const salvarPendenciasMunicipais = async (idRevisaoInicial = idRevisao) => {
    let idAtual = idRevisaoInicial

    for (const municipio of municipios) {
      if (municipioTemAlteracoes(municipio)) {
        idAtual = await salvarMunicipio(municipio, idAtual, { propagarErro: true })
      }
    }

    return idAtual
  }

  const montarPayloadRevisao = (status, idRevisaoAtual) => ({
    id_revisao: idRevisaoAtual,
    status,
    observacao_geral: observacaoGeral.trim() || null,
    instrumento,
    municipios: [],
  })

  const salvarRevisao = async (status) => {
    if (!instrumento) return

    setIsSaving(true)
    setMessage('')
    setMessageType('')

    try {
      const idAtual = await salvarPendenciasMunicipais(idRevisao)
      const data = await revisaoInstrumentoApi.salvarRevisao(
        montarPayloadRevisao(status, idAtual)
      )
      setIdRevisao(data.id_revisao)
      setMessage(`${data.mensagem} ID da revisão: ${data.id_revisao}.`)
      setMessageType('success')
    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
          err?.message ||
          'Não foi possível salvar a revisão. Verifique sua autenticação e tente novamente.'
      )
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Revisão de Instrumento</h1>
          <p>
            Consulte, registre e envie os ajustes por instrumento da Carteira DSR. 
          </p>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <form className={styles.searchPanel} onSubmit={buscarInstrumento}>
            <label>
              <span>Instrumento, proposta ou TED</span>
              <input
                value={identificador}
                onChange={(event) => setIdentificador(event.target.value)}
                placeholder="Ex.: número do instrumento, proposta ou TED"
              />
            </label>

            <button type="submit" disabled={isLoading}>
              <Search size={18} />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {message && (
            <div
              className={messageType === 'success' ? styles.successBox : styles.errorBox}
              role={messageType === 'success' ? 'status' : 'alert'}
            >
              {message}
            </div>
          )}

          {instrumento && (
            <>
              <button
                type="button"
                className={`${styles.secondaryButton} ${styles.addMunicipioToggle}`}
                onClick={() => setMostrarFormularioMunicipio(true)}
              >
                <Plus size={16} />
                Adicionar Município
              </button>

              {mostrarFormularioMunicipio && (
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2>Adicionar município</h2>
                  </div>

                  <div className={styles.addGrid}>
                    <label>
                      <span>Código IBGE</span>
                      <input
                        type="number"
                        value={novoMunicipio.cod_municipio}
                        onChange={(event) =>
                          setNovoMunicipio((current) => ({
                            ...current,
                            cod_municipio: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label>
                      <span>Nome</span>
                      <input
                        value={novoMunicipio.nome}
                        onChange={(event) =>
                          setNovoMunicipio((current) => ({
                            ...current,
                            nome: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label>
                      <span>UF</span>
                      <input
                        maxLength={2}
                        value={novoMunicipio.uf}
                        onChange={(event) =>
                          setNovoMunicipio((current) => ({
                            ...current,
                            uf: event.target.value,
                          }))
                        }
                      />
                    </label>

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
                  municipios.map((municipio, municipioIndex) => {
                    const formLocalidade =
                      novaLocalidadePorMunicipio[municipio.cod_municipio] ??
                      LOCALIDADE_NOVA_INICIAL

                    const isNovaLocalidadeAberta = Boolean(
                      novaLocalidadeAbertaPorMunicipio[municipio.cod_municipio]
                    )

                    const isAberto = municipioAberto === municipio.cod_municipio

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
                                <span>
                                  Ação: {getLabelAcaoMunicipio(municipio.acao_sugerida)}
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
                              {municipio.origem_registro === 'adicionado_tecnico' ? (
                                <div className={styles.fieldGroup}>
                                  <span>Situação na revisão</span>
                                  <span className={styles.addedChip}>
                                    Incluído nesta revisão
                                  </span>
                                </div>
                              ) : (
                                <div className={styles.municipioAcaoLinha}>
                                  <div className={styles.sectionHeader}>
                                    <span className={styles.sectionHeaderTitle}>Revisão do Município</span>
                                    <span className={styles.sectionHeaderSeparator} aria-hidden="true"/>
                                    <span className={styles.sectionHeaderMeta}>
                                      {formatarDataConferencia(municipio.revisao_municipio_conferida_em)}
                                    </span>
                                  </div>
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
                                </div>
                              )}

                              {municipio.acao_sugerida === 'remover' && (
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
                            </div>

                            <div className={`${styles.subsection} ${styles.obrasSection}`}>
                              <div className={styles.sectionHeader}>
                                <h3>Localidades Beneficiadas</h3>
                                <span className={styles.sectionHeaderSeparator} aria-hidden="true"/>
                                <span className={styles.sectionHeaderMeta}>
                                  {formatarDataConferencia(municipio.localidades_conferidas_em)}
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
                                      municipio.localidades.map((localidade, localidadeIndex) => {
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
                                                {isAdicionada && (
                                                  <span className={styles.addedChip}>
                                                    Incluída nesta revisão
                                                  </span>
                                                )}
                                              </div>
                                            </td>

                                            <td>
                                              {isAdicionada ? (
                                                <span className={styles.addedChip}>
                                                  Incluída nesta revisão
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
                                              ) : isCorrigir ? (
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
                                              ) : (
                                                valorOuTraco(
                                                  localidade.qtde_familias_ben_original
                                                )
                                              )}
                                            </td>

                                            <td>
                                              {mostrarJustificativa ? (
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

                              {!isNovaLocalidadeAberta ? (
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
                              )}
                            </div>

                            <div className={styles.revisaoDuasColunas}>
                              <div className={`${styles.subsection} ${styles.localidadesSection}`}>
                                <div className={styles.sectionHeader}>
                                  <h3>Obras Identificadas no Município</h3>
                                  <span className={styles.sectionHeaderSeparator} aria-hidden="true"/>
                                  <span className={styles.sectionHeaderMeta}>
                                    {formatarDataConferencia(municipio.obras_conferidas_em)}
                                  </span>
                                </div>

                                <div className={styles.tableScroller}>
                                  <table className={`${styles.table} ${styles.obrasTable}`}>
                                    <thead>
                                      <tr>
                                        <th className={styles.colunaObra}>Obra</th>
                                        <th>Órgão Responsável</th>
                                        <th>Relação com o Instrumento</th>
                                        <th>Confirmação de Status</th>
                                        <th>Observação</th>
                                        <th>Links</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {municipio.obras_saneamento.length === 0 ? (
                                        <tr>
                                          <td colSpan={6} className={styles.emptyCell}>
                                            Nenhuma obra de saneamento encontrada.
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
                                              </td>
                                              <td>
                                                {obra.relacao_instrumento === 'nao_analisada' ? (
                                                  valorOuTraco(null)
                                                ) : (
                                                  <select
                                                    value={obra.confirmacao_status ?? 'nao_confirmada'}
                                                    onChange={(event) => 
                                                      atualizarObra(
                                                        municipio.cod_municipio,
                                                        obra.id_obra,
                                                        'confirmacao_status',
                                                        event.target.value
                                                      )
                                                    }
                                                  >
                                                    {CONFIRMACOES_STATUS.map((confirmacao) => (
                                                      <option key={confirmacao.value} value={confirmacao.value}>
                                                        {confirmacao.label}
                                                      </option>
                                                    ))}
                                                  </select>
                                                )}
                                              </td>
                                              <td>
                                                {mostrarJustificativaObra ? (
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

                            <div className={styles.municipioFooterActions}>
                              <button
                                type="button"
                                className={styles.municipioSaveButton}
                                disabled={
                                  salvandoMunicipio[municipio.cod_municipio] ||
                                  !municipioTemAlteracoes(municipio)
                                }
                                onClick={() => salvarMunicipio(municipio)}
                              >
                                <Save size={16} />
                                {salvandoMunicipio[municipio.cod_municipio]
                                  ? 'Salvando...'
                                  : 'Salvar alterações do município'}
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })
                )}
              </section>
            </>
          )}
        </div>

        {instrumento && (
          <aside className={styles.rightColumn}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>Dados do Instrumento</h2>
              </div>

              <dl className={styles.readonlyGrid}>
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

                <div className={styles.fullItem}>
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

                <div>
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
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>Observação geral</h2>
              </div>

              <textarea
                className={styles.textarea}
                value={observacaoGeral}
                onChange={(event) => setObservacaoGeral(event.target.value)}
                rows={4}
                placeholder="Registre observações gerais da revisão."
              />
            </section>
          </aside>
        )}
      </div>

      {instrumento && (
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => salvarRevisao('rascunho')}
            disabled={isSaving}
          >
            <Save size={18} />
            {isSaving ? 'Salvando...' : 'Salvar rascunho'}
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => salvarRevisao('enviado')}
            disabled={isSaving}
          >
            <Send size={18} />
            {isSaving ? 'Enviando...' : 'Enviar revisão'}
          </button>
        </div>
      )}
    </main>
  )
}
