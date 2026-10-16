import { useState, useSyncExternalStore } from 'react'
import { Copy, X } from 'lucide-react'
import {
  assinarCodigosErro,
  copiarCodigoErro,
  dispensarCodigoErro,
  obterCodigosErro,
} from '@/api/erros'
import styles from './CodigosErro.module.css'

export default function CodigosErro() {
  const codigos = useSyncExternalStore(assinarCodigosErro, obterCodigosErro)
  const [resultado, setResultado] = useState({})
  if (!codigos.length) return null

  async function copiar(codigo) {
    try {
      await copiarCodigoErro(codigo)
      setResultado((atual) => ({ ...atual, [codigo]: 'Código copiado.' }))
    } catch {
      setResultado((atual) => ({ ...atual, [codigo]: 'Selecione o código e copie manualmente.' }))
    }
  }

  return (
    <aside className={styles.painel} aria-label="Códigos de erro para suporte">
      <strong>Códigos para suporte</strong>
      {codigos.map((codigo) => (
        <div className={styles.item} key={codigo}>
          <code>{codigo}</code>
          <div className={styles.acoes}>
            <button type="button" onClick={() => copiar(codigo)} aria-label={`Copiar código ${codigo}`}>
              <Copy size={16} aria-hidden="true" /> Copiar código
            </button>
            <button type="button" onClick={() => dispensarCodigoErro(codigo)} aria-label={`Dispensar código ${codigo}`}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <span role="status">{resultado[codigo]}</span>
        </div>
      ))}
    </aside>
  )
}
