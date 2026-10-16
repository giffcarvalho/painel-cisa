import { X } from 'lucide-react'
import styles from '@/pages/admin/usuarios/AdminUsuarios.module.css'

export default function ModalBase({ titulo, onClose, children, ocupado = false }) {
  return <div className={styles.modalBackdrop}>
    <section className={`${styles.modal} ${styles.formModal}`} role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" className={styles.close} onClick={onClose} disabled={ocupado} aria-label="Fechar"><X /></button>
      <h2>{titulo}</h2>{children}
    </section>
  </div>
}
