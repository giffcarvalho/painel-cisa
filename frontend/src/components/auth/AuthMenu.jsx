import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, History, LogIn, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth'
import styles from './AuthMenu.module.css'

const PROFILE_LABELS = {
  admin: 'Administrador',
  administrador: 'Administrador',
  tecnico: 'Técnico',
  técnica: 'Técnica',
  tecnica: 'Técnica',
}

function getDisplayName(usuario) {
  return (
    usuario?.nome_completo
    || usuario?.nomeCompleto
    || usuario?.full_name
    || usuario?.nome
    || usuario?.email
    || 'Usuário'
  )
}

function getInitials(name, email) {
  const source = name && name !== 'Usuário' ? name : email

  if (!source) return 'US'

  const emailPrefix = source.includes('@') ? source.split('@')[0] : source
  const parts = emailPrefix.trim().split(/[\s._-]+/).filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toLocaleUpperCase('pt-BR')
  }

  return `${parts[0][0]}${parts.at(-1)[0]}`.toLocaleUpperCase('pt-BR')
}

function formatProfile(profile) {
  if (!profile) return ''

  const normalized = String(profile).trim().toLocaleLowerCase('pt-BR')
  return PROFILE_LABELS[normalized]
    || normalized.charAt(0).toLocaleUpperCase('pt-BR') + normalized.slice(1)
}

export default function AuthMenu({ className = '', compactOnMobile = false }) {
  const { isAuthenticated, logout, openLoginModal, usuario } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const menuId = `auth-menu-${useId().replace(/:/g, '')}`

  const displayName = useMemo(() => getDisplayName(usuario), [usuario])
  const initials = useMemo(
    () => getInitials(displayName, usuario?.email),
    [displayName, usuario?.email],
  )
  const profile = useMemo(() => formatProfile(usuario?.perfil), [usuario?.perfil])

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        containerRef.current?.querySelector('button')?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleLogout() {
    setIsOpen(false)
    logout()
    navigate('/', { replace: true })
  }

  function handleMinhasRevisoes() {
    setIsOpen(false)
    navigate('/minhas-revisoes')
  }

  if (!isAuthenticated) {
    return (
      <div className={`${styles.container} ${className}`}>
        <button
          type="button"
          className={`${styles.loginButton} ${compactOnMobile ? styles.compactOnMobile : ''}`}
          aria-label="Entrar no painel"
          onClick={() => openLoginModal()}
        >
          <LogIn aria-hidden="true" />
          <span>Entrar no painel</span>
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`${styles.container} ${className}`}>
      <button
        type="button"
        className={styles.profileButton}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.avatar} aria-hidden="true">{initials}</span>
        <span className={styles.buttonName}>{displayName}</span>
        <ChevronDown
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div id={menuId} className={styles.dropdown} role="menu">
          <div className={styles.identity}>
            <strong>{displayName}</strong>
            {profile && <span>{profile}</span>}
          </div>
          <div className={styles.divider} />
          <button type="button" className={styles.menuButton} role="menuitem" onClick={handleMinhasRevisoes}>
            <History aria-hidden="true" />
            Minhas revisões
          </button>
          <button type="button" className={styles.logoutButton} role="menuitem" onClick={handleLogout}>
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
