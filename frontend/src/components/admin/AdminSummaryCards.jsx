import { Users, UserCheck, UserX, KeyRound, ClipboardCheck } from 'lucide-react'
import styles from '@/pages/admin/usuarios/AdminUsuarios.module.css'

export default function AdminSummaryCards({ resumo }) {
  const cards = [
    ['Total de usuários', resumo.total_usuarios, Users],
    ['Usuários ativos', resumo.usuarios_ativos, UserCheck],
    ['Desativados', resumo.usuarios_desativados, UserX],
    ['Aguardando ativação', resumo.contas_aguardando_ativacao, KeyRound],
    ['Revisões nos últimos 7 dias', resumo.revisoes_recentes, ClipboardCheck],
  ]
  return <section className={styles.summary}>{cards.map(([label, value, Icon]) => (
    <article key={label} className={styles.summaryCard}><Icon /><div><strong>{value}</strong><span>{label}</span></div></article>
  ))}</section>
}
