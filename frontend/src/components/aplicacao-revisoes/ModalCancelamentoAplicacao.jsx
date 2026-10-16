import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import styles from '@/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.module.css'

const ROTULOS = {
  adicionado: ['adicionado', 'adicionados'],
  removido: ['removido', 'removidos'],
  corrigido: ['corrigido', 'corrigidos'],
  incorporado: ['incorporada', 'incorporadas'],
}

function linhasResumo(resumo) {
  const grupos = [
    ['municipios', 'município', 'municípios'],
    ['localidades', 'localidade', 'localidades'],
    ['publico_alvo', 'avaliação de Público-alvo', 'avaliações de Público-alvo'],
    ['obras', 'avaliação de Obras', 'avaliações de Obras'],
  ]
  return grupos.flatMap(([campo, singular, plural]) => Object.entries(resumo?.[campo] || {})
    .filter(([, quantidade]) => Number(quantidade) > 0)
    .map(([resultado, quantidade]) => {
      const genero = ROTULOS[resultado]
      const rotulo = Number(quantidade) === 1 ? singular : plural
      const acao = genero?.[Number(quantidade) === 1 ? 0 : 1] || resultado.replaceAll('_', ' ')
      return `${quantidade} ${rotulo} ${acao}`
    }))
}

export default function ModalCancelamentoAplicacao({ execucao, validacao, processando, onFechar, onConfirmar }) {
  const [motivo, setMotivo] = useState('')
  const resumo = linhasResumo(validacao?.resumo)
  const habilitado = Boolean(motivo.trim()) && !processando

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !processando) onFechar()
    }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="cancelamento-title">
        <button type="button" className={styles.closeButton} onClick={onFechar} disabled={processando} aria-label="Fechar"><X /></button>
        <h2 id="cancelamento-title">Cancelar aplicação #{execucao.id_execucao}</h2>
        <p>O sistema tentará desfazer as alterações realizadas por esta execução nas tabelas definitivas e bases revisadas. O histórico da revisão e da aplicação será preservado.</p>
        <div className={styles.cancelSummary}>
          <strong>Resumo do que será revertido</strong>
          {resumo.length ? <ul>{resumo.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Nenhuma escrita externa; a vigência das avaliações será revertida.</p>}
        </div>
        <label className={styles.reasonField}>
          <span>Motivo do cancelamento</span>
          <textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} maxLength={2000} rows={4} disabled={processando} required />
        </label>
        <p className={styles.modalNotice}>A possibilidade e o estado de todos os registros serão validados novamente dentro de uma única transação.</p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onFechar} disabled={processando}>Voltar</button>
          <button type="button" className={styles.dangerButton} onClick={() => onConfirmar(motivo.trim())} disabled={!habilitado}>
            {processando && <Loader2 className={styles.spinner} />} Confirmar cancelamento e desfazer aplicação
          </button>
        </div>
      </div>
    </div>
  )
}
