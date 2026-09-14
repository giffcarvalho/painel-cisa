import { Search } from 'lucide-react'
import styles from '@/pages/admin/usuarios/AdminUsuarios.module.css'

export default function UsersFilters({ filtros, onChange }) {
  const change = (key) => (event) => onChange({ ...filtros, [key]: event.target.value })
  return <section className={styles.filters} aria-label="Filtros de usuários">
    <label className={styles.search}><Search /><input value={filtros.busca} onChange={change('busca')} placeholder="Buscar por nome, e-mail ou código técnico" /></label>
    <select aria-label="Status do usuário" value={filtros.ativo} onChange={change('ativo')}><option value="">Todos os usuários</option><option value="true">Ativos</option><option value="false">Desativados</option></select>
    <select aria-label="Status da conta" value={filtros.conta_ativada} onChange={change('conta_ativada')}><option value="">Todas as contas</option><option value="true">Contas ativadas</option><option value="false">Aguardando ativação</option></select>
    <select aria-label="Perfil" value={filtros.perfil} onChange={change('perfil')}><option value="">Todos os perfis</option><option value="tecnico">Técnicos</option><option value="admin">Administradores</option></select>
  </section>
}
