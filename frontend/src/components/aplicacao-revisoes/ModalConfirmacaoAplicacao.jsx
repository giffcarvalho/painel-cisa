import { Loader2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import styles from '@/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.module.css'

export default function ModalConfirmacaoAplicacao({ revisao, processando, onCancelar, onConfirmar }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    function fechar(event) {
      if (event.key === 'Escape' && !processando) onCancelar()
    }
    document.addEventListener('keydown', fechar)
    return () => document.removeEventListener('keydown', fechar)
  }, [onCancelar, processando])

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !processando) onCancelar()
    }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <button className={styles.closeButton} type="button" aria-label="Fechar" disabled={processando} onClick={onCancelar}>
          <X aria-hidden="true" />
        </button>
        <h2 id="confirm-title">Confirmar aplicação</h2>
        <p>
          Você está prestes a aplicar a revisão nº {revisao.id_revisao} do instrumento{' '}
          <strong>{revisao.identificador_principal}</strong>. Municípios e localidades serão aplicados
          às tabelas oficiais; as demais avaliações serão incorporadas às bases revisadas.
        </p>
        <dl className={styles.confirmCounts}>
          <div><dt>Municípios</dt><dd>{revisao.alteracoes.municipios} alteração(ões)</dd></div>
          <div><dt>Localidades</dt><dd>{revisao.alteracoes.localidades} alteração(ões)</dd></div>
          <div><dt>Público-alvo</dt><dd>{revisao.alteracoes.publico_alvo} avaliação(ões)</dd></div>
          <div><dt>Obras</dt><dd>{revisao.alteracoes.obras} relação(ões)</dd></div>
        </dl>
        <p className={styles.modalNotice}>A operação será validada novamente e executada em uma única transação.</p>
        <div className={styles.modalActions}>
          <button ref={cancelRef} type="button" className={styles.secondaryButton} disabled={processando} onClick={onCancelar}>Cancelar</button>
          <button type="button" className={styles.dangerButton} disabled={processando} onClick={onConfirmar}>
            {processando && <Loader2 className={styles.spinner} aria-hidden="true" />}
            {processando ? 'Aplicando revisão...' : 'Confirmar aplicação'}
          </button>
        </div>
      </div>
    </div>
  )
}
