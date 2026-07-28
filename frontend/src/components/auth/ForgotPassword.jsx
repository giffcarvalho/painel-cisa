import styles from '@/pages/login/Login.module.css'

export default function ForgotPassword({ onBack, onEnterCode }) {
  return (
    <>
      <div className={styles.brand}>
        <h1 id="login-modal-title" className={styles.title}>Esqueci minha senha</h1>
        <p id="login-modal-description" className={styles.subtitle}>
          Para redefinir sua senha, entre em contato com a equipe responsável pelo Painel DSR.
          Após a confirmação da sua identidade, seu acesso será liberado para a definição de
          uma nova senha.
        </p>
      </div>
      <div className={styles.form}>
        <button type="button" className={styles.button} onClick={onBack}>
          Voltar ao login
        </button>
        <button type="button" className={styles.backButton} onClick={onEnterCode}>
          Inserir código de acesso
        </button>
      </div>
    </>
  )
}
