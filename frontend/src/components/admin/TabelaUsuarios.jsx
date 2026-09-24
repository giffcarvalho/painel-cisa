import { ChevronRight } from 'lucide-react'
import styles from '@/pages/admin/usuarios/AdminUsuarios.module.css'

export const BadgeStatus = ({ ativo }) => <span className={`${styles.badge} ${ativo ? styles.success : styles.muted}`}>{ativo ? 'Ativo' : 'Desativado'}</span>
export const BadgeConta = ({ ativa }) => <span className={`${styles.badge} ${ativa ? styles.info : styles.warning}`}>{ativa ? 'Ativada' : 'Aguardando ativação'}</span>
const data = (valor) => valor ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor)) : 'Nunca acessou'

export default function TabelaUsuarios({ usuarios, onSelect }) {
  if (!usuarios.length) return <div className={styles.empty}>Nenhum usuário encontrado com os filtros atuais.</div>
  return <div className={styles.tableWrap}><table className={styles.table}>
    <thead><tr><th>Usuário</th><th>Perfil</th><th>Status</th><th>Conta</th><th>Último acesso</th><th>Instrumentos</th><th>Revisões</th><th /></tr></thead>
    <tbody>{usuarios.map((usuario) => <tr key={usuario.id_usuario} onClick={() => onSelect(usuario.id_usuario)}>
      <td><strong>{usuario.nome}</strong><small>{usuario.email}<br />Código: {usuario.codigo_tecnico ?? '—'} · {usuario.setor || 'Sem setor'}</small></td>
      <td>{usuario.perfil === 'admin' ? 'Administrador' : 'Técnico'}</td><td><BadgeStatus ativo={usuario.ativo} /></td><td><BadgeConta ativa={usuario.conta_ativada} /></td>
      <td>{data(usuario.ultimo_acesso_em)}</td><td>{usuario.perfil === 'admin' ? 'Acesso global' : usuario.instrumentos_ativos}</td><td>{usuario.revisoes_enviadas} enviadas<br /><small>{usuario.rascunhos} rascunho(s)</small></td><td><button aria-label={`Abrir ${usuario.nome}`}><ChevronRight /></button></td>
    </tr>)}</tbody>
  </table></div>
}
