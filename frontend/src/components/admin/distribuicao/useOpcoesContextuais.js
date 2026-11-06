import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { distribuicaoApi } from '@/api/distribuicaoInstrumentos'
import { chaveFiltros, configurarConsultaOpcoes } from './filtrosContextuais'

export default function useOpcoesContextuais(filtros, ativo) {
  const chave = chaveFiltros(filtros)
  const [estavel, setEstavel] = useState(chave)

  useEffect(() => {
    const timer = setTimeout(() => setEstavel(chave), 200)
    return () => clearTimeout(timer)
  }, [chave])

  return useQuery({
    ...configurarConsultaOpcoes(chave, distribuicaoApi.opcoesContextuais),
    enabled: ativo && chave === estavel,
  })
}
