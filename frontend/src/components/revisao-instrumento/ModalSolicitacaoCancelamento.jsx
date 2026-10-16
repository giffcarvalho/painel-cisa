import { Loader2, X } from 'lucide-react'
import styles from './VisualizarRevisao.module.css'

export default function ModalSolicitacaoCancelamento({ motivo, processando, onMotivo, onFechar, onEnviar }) {
  return <div className={styles.modalBackdrop} role="presentation"><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="solicitar-cancelamento-title">
    <button type="button" className={styles.modalClose} aria-label="Fechar" onClick={onFechar} disabled={processando}><X /></button>
    <h2 id="solicitar-cancelamento-title">Solicitar cancelamento da aplicação</h2>
    <p>A solicitação será encaminhada para análise administrativa. A aplicação permanecerá válida enquanto o pedido não for aprovado pelo administrador.</p>
    <label><span>Motivo da solicitação</span><textarea rows={5} maxLength={2000} required value={motivo} onChange={(event) => onMotivo(event.target.value)} /></label>
    <div className={styles.modalActions}><button type="button" onClick={onFechar} disabled={processando}>Voltar</button><button type="button" className={styles.requestCancelButton} onClick={onEnviar} disabled={processando || !motivo.trim()}>{processando && <Loader2 className={styles.spinner} />}Enviar solicitação</button></div>
  </div></div>
}
