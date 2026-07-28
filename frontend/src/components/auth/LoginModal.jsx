import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth'
import LoginForm from './LoginForm'
import FirstAccessForm from './FirstAccessForm'
import ForgotPassword from './ForgotPassword'
import PasswordResetForm from './PasswordResetForm'
import styles from './LoginModal.module.css'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function LoginModal() {
  const {
    closeLoginModal,
    isLoginModalOpen,
    loginRedirectTo,
  } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [view, setView] = useState('login')
  const [successMessage, setSuccessMessage] = useState('')
  const dialogRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    const isLoginRoute = location.pathname === '/login'
    setView('login')
    setSuccessMessage('')
    closeLoginModal()
    if (isLoginRoute) navigate('/', { replace: true })
  }, [closeLoginModal, isSubmitting, location.pathname, navigate])

  useEffect(() => {
    if (!isLoginModalOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) {
        event.preventDefault()
        handleClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)]
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable.at(-1)

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose, isLoginModalOpen, isSubmitting])

  function handleSuccess() {
    const destination = loginRedirectTo
    setView('login')
    setSuccessMessage('')
    closeLoginModal()
    if (destination) navigate(destination, { replace: true })
  }

  function handleBackdropPointerDown(event) {
    if (event.target === event.currentTarget) handleClose()
  }

  if (!isLoginModalOpen) return null

  return createPortal(
    <div className={styles.backdrop} onMouseDown={handleBackdropPointerDown}>
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        aria-describedby="login-modal-description"
      >
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Fechar autenticação"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          <X aria-hidden="true" />
        </button>
        {view === 'login' && (
          <LoginForm
            onSuccess={handleSuccess}
            onSubmittingChange={setIsSubmitting}
            onFirstAccess={() => {
              setSuccessMessage('')
              setView('first-access')
            }}
            onForgotPassword={() => {
              setSuccessMessage('')
              setView('forgot-password')
            }}
            successMessage={successMessage}
          />
        )}
        {view === 'first-access' && (
          <FirstAccessForm
            onBack={() => setView('login')}
            onSubmittingChange={setIsSubmitting}
            onSuccess={(message) => {
              setSuccessMessage(message)
              setView('login')
            }}
          />
        )}
        {view === 'forgot-password' && (
          <ForgotPassword
            onBack={() => setView('login')}
            onEnterCode={() => setView('password-reset')}
          />
        )}
        {view === 'password-reset' && (
          <PasswordResetForm
            onBack={() => setView('forgot-password')}
            onSubmittingChange={setIsSubmitting}
            onSuccess={(message) => {
              setSuccessMessage(message)
              setView('login')
            }}
          />
        )}
      </section>
    </div>,
    document.body,
  )
}
