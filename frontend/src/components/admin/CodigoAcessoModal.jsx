import { useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import styles from '@/pages/admin/usuarios/AdminUsuarios.module.css'

export default function CodigoAcessoModal({ codigo, expiraEm, onClose }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => { await navigator.clipboard.writeText(codigo); setCopiado(true) }
  return <div className={styles.modalBackdrop} role="presentation"><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="codigo-title">
    <button className={styles.close} onClick={onClose} aria-label="Fechar"><X /></button><h2 id="codigo-title">Código gerado com sucesso</h2>
    <code className={styles.code}>{codigo}</code><button className={styles.primary} onClick={copiar}>{copiado ? <Check /> : <Copy />}{copiado ? 'Copiado' : 'Copiar código'}</button>
    <p>Válido até {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(expiraEm))}.</p><strong>Este código será exibido apenas agora.</strong><p>Se ele for perdido, será necessário gerar um novo.</p>
  </section></div>
}
