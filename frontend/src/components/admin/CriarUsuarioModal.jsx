import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { adminUsuariosApi } from '@/api/adminUsuarios'
import styles from '@/pages/admin/usuarios/AdminUsuarios.module.css'

const INICIAL = { nome: '', email: '', perfil: 'tecnico', id_setor: '' }

export default function CriarUsuarioModal({ onClose, onCreated }) {
  const [form, setForm] = useState(INICIAL)
  const [setores, setSetores] = useState([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    // Setores são carregados ao abrir porque o identificador selecionado integra
    // o payload de criação de técnicos.
    adminUsuariosApi.listarSetores().then(setSetores).catch(() => setErro('Não foi possível carregar os setores.'))
  }, [])

  async function enviar(event) {
    event.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      await adminUsuariosApi.criar({
        nome: form.nome,
        email: form.email,
        perfil: form.perfil,
        id_setor: form.perfil === 'tecnico' ? Number(form.id_setor) : null,
      })
      onCreated()
    } catch (error) {
      const detail = error?.response?.data?.detail
      setErro(typeof detail === 'string' ? detail : 'Não foi possível criar o usuário.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={styles.modalBackdrop} role="presentation">
      <section className={`${styles.modal} ${styles.formModal}`} role="dialog" aria-modal="true" aria-labelledby="criar-usuario-title">
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar"><X /></button>
        <h2 id="criar-usuario-title">Adicionar usuário</h2>
        <p>A conta será criada aguardando ativação por código de acesso.</p>
        {erro && <div className={styles.error} role="alert">{erro}</div>}
        <form onSubmit={enviar}>
          <label>Nome *<input required maxLength={150} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
          <label>E-mail *<input required type="email" maxLength={150} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Perfil *<select required value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value, id_setor: '' })}><option value="tecnico">Técnico</option><option value="admin">Administrador</option></select></label>
          {form.perfil === 'tecnico' && <label>Setor *<select required value={form.id_setor} onChange={(e) => setForm({ ...form, id_setor: e.target.value })}><option value="">Selecione</option>{setores.map((setor) => <option key={setor.id_setor} value={setor.id_setor}>{setor.nome}</option>)}</select></label>}
          <div className={styles.modalActions}><button type="button" className={styles.secondary} onClick={onClose}>Cancelar</button><button type="submit" className={styles.primary} disabled={salvando}>{salvando && <Loader2 className={styles.spin} />}Adicionar usuário</button></div>
        </form>
      </section>
    </div>
  )
}
