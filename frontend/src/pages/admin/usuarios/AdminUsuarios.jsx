import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { adminUsuariosApi } from '@/api/adminUsuarios'
import AdminSummaryCards from '@/components/admin/AdminSummaryCards'
import UsersFilters from '@/components/admin/UsersFilters'
import UsersTable from '@/components/admin/UsersTable'
import UserDetailsPanel from '@/components/admin/UserDetailsPanel'
import CreateUserModal from '@/components/admin/CreateUserModal'
import styles from './AdminUsuarios.module.css'

const iniciais = { busca: '', ativo: '', conta_ativada: '', perfil: '' }
export default function AdminUsuarios() {
  const [dados, setDados] = useState(null); const [filtros, setFiltros] = useState(iniciais); const [selecionado, setSelecionado] = useState(null); const [carregando, setCarregando] = useState(true); const [erro, setErro] = useState('')
  const [criando, setCriando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const params = useMemo(() => Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '')), [filtros])
  const carregar = useCallback(async () => { setCarregando(true); setErro(''); try { setDados(await adminUsuariosApi.listar(params)) } catch (e) { setErro(e?.response?.data?.detail || 'Não foi possível carregar a administração.') } finally { setCarregando(false) } }, [params])
  useEffect(() => { const timer = setTimeout(carregar, filtros.busca ? 300 : 0); return () => clearTimeout(timer) }, [carregar, filtros.busca])
  return <main className={styles.page}><header className={styles.hero}><div><span>Administração</span><h1>Gestão de usuários</h1><p>Contas, acessos, instrumentos, pendências e revisões em um só lugar.</p></div><div className={styles.heroActions}><button type="button" className={styles.primary} onClick={() => setCriando(true)}><Plus /> Adicionar usuário</button><button type="button" onClick={carregar} disabled={carregando}><RefreshCw className={carregando ? styles.spin : ''} /> Atualizar</button></div></header>
    {erro && <div className={styles.error} role="alert">{erro}</div>}{mensagem && <div className={styles.successMessage} role="status">{mensagem}</div>}{dados && <><AdminSummaryCards resumo={dados.resumo} /><section className={styles.management}><UsersFilters filtros={filtros} onChange={setFiltros} />{carregando ? <div className={styles.loading}><Loader2 className={styles.spin} /> Carregando usuários...</div> : <UsersTable usuarios={dados.data} onSelect={setSelecionado} />}</section></>}{selecionado && <UserDetailsPanel key={selecionado} idUsuario={selecionado} onClose={() => setSelecionado(null)} onChanged={carregar} />}{criando && <CreateUserModal onClose={() => setCriando(false)} onCreated={() => { setCriando(false); setMensagem('Usuário criado e aguardando ativação.'); carregar() }} />}
  </main>
}
