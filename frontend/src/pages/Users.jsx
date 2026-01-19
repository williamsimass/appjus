import { useState, useEffect } from 'react'
import PageShell from '@/components/ui/page-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
    Trash2, UserPlus, Shield, Mail, Building2, 
    Search, X, UserCheck, Key
} from 'lucide-react'
import { apiFetch } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from "@/components/ui/use-toast"

export default function UsersPage() {
    const { user: currentUser } = useAuth()
    const { toast } = useToast()
    const [users, setUsers] = useState([])
    const [tenants, setTenants] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        tenant_id: '', // Importante: Verifique se seu backend aceita string vazia ou requer null
        role: 'lawyer' 
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            // Busca usuários
            const usersRes = await apiFetch('/users/')
            if (usersRes.ok) {
                const usersData = await usersRes.json()
                setUsers(usersData)
            }

            // Busca Tenants (Escritórios) - Lógica original preservada
            if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin_global') {
                const tenantsRes = await apiFetch('/tenants/')
                if (tenantsRes.ok) {
                    const tenantsData = await tenantsRes.json()
                    setTenants(tenantsData)
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
            toast({ variant: "destructive", title: "Erro de carregamento" })
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        
        // Ajuste técnico: Se o tenant_id estiver vazio, enviamos null (comum em bancos SQL)
        const payload = {
            ...formData,
            tenant_id: formData.tenant_id === "" ? null : formData.tenant_id
        }

        try {
            const res = await apiFetch('/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast({ title: "Utilizador criado!", description: "O novo acesso já está ativo." })
                setIsCreating(false)
                setFormData({ name: '', email: '', password: '', tenant_id: '', role: 'lawyer' })
                fetchInitialData()
            } else {
                const errorData = await res.json()
                toast({ 
                    variant: "destructive", 
                    title: "Erro ao criar", 
                    description: errorData.detail || "Verifique os dados informados." 
                })
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erro de conexão" })
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja remover este utilizador?')) return
        try {
            const res = await apiFetch(`/users/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id))
                toast({ title: "Removido", description: "Utilizador excluído com sucesso." })
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir" })
        }
    }

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <PageShell title="Gestão de Utilizadores" description="Administre os acessos e permissões do sistema.">
            
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
                <StatCard icon={<UserCheck />} label="Total de Usuários" value={users.length} color="blue" />
                <StatCard icon={<Shield />} label="Administradores" value={users.filter(u => u.role?.includes('admin')).length} color="purple" />
                <StatCard icon={<Building2 />} label="Escritórios Ativos" value={tenants.length} color="green" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 w-full">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar por nome ou e-mail..." 
                        className="pl-10 h-11 bg-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary-dark text-white h-11 px-6 font-semibold shadow-sm">
                    <UserPlus className="h-4 w-4 mr-2" /> Novo Usuário
                </Button>
            </div>

            {/* Tabela de Usuários */}
            <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nível</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Escritório (ID)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 animate-pulse font-medium">Carregando usuários...</td></tr>
                            ) : filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{u.name}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary" className="capitalize">
                                            {u.role?.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-500 font-mono">
                                            {u.tenant_id ? u.tenant_id.substring(0, 8) + '...' : 'Acesso Global'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleDelete(u.id)} 
                                            className="text-slate-400 hover:text-red-600 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Criação (Substitui o formulário solto) */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-primary" /> Novo Usuário
                            </h3>
                            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 text-left block">Nome Completo</label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Nome do advogado" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 text-left block">E-mail Profissional</label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="email@exemplo.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 text-left block">Senha de Acesso</label>
                                <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="••••••••" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-semibold text-slate-700">Nível</label>
                                    <select 
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
                                        value={formData.role}
                                        onChange={e => setFormData({...formData, role: e.target.value})}
                                    >
                                        <option value="lawyer">Advogado</option>
                                        <option value="admin">Admin Escritório</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-sm font-semibold text-slate-700">Escritório</label>
                                    <select 
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
                                        value={formData.tenant_id}
                                        onChange={e => setFormData({...formData, tenant_id: e.target.value})}
                                    >
                                        <option value="">Nenhum (Global)</option>
                                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <Button type="submit" className="w-full bg-primary text-white font-bold h-11 mt-4">
                                Finalizar Cadastro
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </PageShell>
    )
}

function StatCard({ icon, label, value, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600'
    };
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 text-left">
            <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-slate-900">{value}</p>
            </div>
        </div>
    );
}