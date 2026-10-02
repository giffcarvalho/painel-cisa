import { Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import styles from '@/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.module.css'

export default function ModalDevolverRevisao({ revisao, processando, erro, onFechar, onConfirmar }) {
  const [comentario, setComentario] = useState('')
  const campoRef = useRef(null)

  useEffect(() => {
    campoRef.current?.focus()
    function fechar(event) {
      if (event.key === 'Escape' && !processando) onFechar()
    }
    document.addEventListener('keydown', fechar)
    return () => document.removeEventListener('keydown', fechar)
  }, [onFechar, processando])

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !processando) onFechar()
    }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="devolver-title">
        <button className={styles.closeButton} type="button" aria-label="Fechar" disabled={processando} onClick={onFechar}><X /></button>
        <h2 id="devolver-title">Devolver para correção</h2>
        <p>A revisão nº {revisao.id_revisao} será devolvida ao monitor responsável. A versão enviada permanecerá intacta e um novo rascunho será preparado.</p>
        <label className={styles.reasonField}>
          Comentário para o monitor
          <textarea ref={campoRef} rows="5" maxLength="4000" value={comentario} disabled={processando}
            onChange={(event) => setComentario(event.target.value)} />
        </label>
        {erro && <div className={styles.errorMessage} role="alert">{erro}</div>}
        <p className={styles.modalNotice}>O comentário é obrigatório e ficará registrado no histórico da revisão.</p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} disabled={processando} onClick={onFechar}>Cancelar</button>
          <button type="button" className={styles.primaryButton} disabled={processando || !comentario.trim()} onClick={() => onConfirmar(comentario.trim())}>
            {processando && <Loader2 className={styles.spinner} />}
            {processando ? 'Devolvendo...' : 'Confirmar devolução'}
          </button>
        </div>
      </div>
    </div>
  )
}
