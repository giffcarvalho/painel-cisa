import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { adminUsuariosApi } from '@/api/adminUsuarios'
import AdminSummaryCards from '@/components/admin/AdminSummaryCards'
import UsersFilters from '@/components/admin/UsersFilters'
import UsersTable from '@/components/admin/UsersTable'
import UserDetailsPanel from '@/components/admin/UserDetailsPanel'
import styles from './AdminUsuarios.module.css'

const iniciais = { busca: '', ativo: '', conta_ativada: '', perfil: '' }
export default function AdminUsuarios() {
  const [dados, setDados] = useState(null); const [filtros, setFiltros] = useState(iniciais); const [selecionado, setSelecionado] = useState(null); const [carregando, setCarregando] = useState(true); const [erro, setErro] = useState('')
  const params = useMemo(() => Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '')), [filtros])
  const carregar = useCallback(async () => { setCarregando(true); setErro(''); try { setDados(await adminUsuariosApi.listar(params)) } catch (e) { setErro(e?.response?.data?.detail || 'Não foi possível carregar a administração.') } finally { setCarregando(false) } }, [params])
  useEffect(() => { const timer = setTimeout(carregar, filtros.busca ? 300 : 0); return () => clearTimeout(timer) }, [carregar, filtros.busca])
  return <main className={styles.page}><header className={styles.hero}><div><span>Administração</span><h1>Gestão de usuários</h1><p>Contas, acessos, instrumentos, pendências e revisões em um só lugar.</p></div><button type="button" onClick={carregar} disabled={carregando}><RefreshCw className={carregando ? styles.spin : ''} /> Atualizar</button></header>
    {erro && <div className={styles.error} role="alert">{erro}</div>}{dados && <><AdminSummaryCards resumo={dados.resumo} /><section className={styles.management}><UsersFilters filtros={filtros} onChange={setFiltros} />{carregando ? <div className={styles.loading}><Loader2 className={styles.spin} /> Carregando usuários...</div> : <UsersTable usuarios={dados.data} onSelect={setSelecionado} />}</section></>}{selecionado && <UserDetailsPanel idUsuario={selecionado} onClose={() => setSelecionado(null)} onChanged={carregar} />}
  </main>
}
