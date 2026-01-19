import { useState, useEffect } from 'react'
import PageShell from '@/components/ui/page-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
    Trash2, Edit2, ShieldCheck, Users, Building2, 
    PlusCircle, X, AlertCircle, Search, LayoutGrid
} from 'lucide-react'
import { apiFetch } from '@/api'
import { useToast } from "@/components/ui/use-toast"

export default function TenantsPage() {
    const [tenants, setTenants] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const { toast } = useToast()

    const [isCreating, setIsCreating] = useState(false)
    const [newTenantName, setNewTenantName] = useState('')

    const [selectedTenant, setSelectedTenant] = useState(null)
    const [isPlanOpen, setIsPlanOpen] = useState(false)
    const [planForm, setPlanForm] = useState({ plan: 'free', plan_status: 'active', status: 'active' })

    useEffect(() => { fetchTenants() }, [])

    const fetchTenants = async () => {
        setLoading(true)
        try {
            const res = await apiFetch('/tenants/')
            if (res.ok) setTenants(await res.json())
        } catch (error) {
            toast({ variant: "destructive", title: "Erro de conexão" })
        } finally { setLoading(false) }
    }

    const handleCreateTenant = async (e) => {
        e.preventDefault()
        try {
            const url = `/tenants/?name=${encodeURIComponent(newTenantName)}`;
            const res = await apiFetch(url, { method: 'POST' })
            if (res.ok) {
                toast({ title: "Sucesso!", description: "Escritório criado com sucesso." })
                setNewTenantName(''); setIsCreating(false); fetchTenants()
            }
        } catch (error) { toast({ variant: "destructive", title: "Erro de rede" }) }
    }

    const handleUpdatePlan = async (e) => {
        e.preventDefault()
        try {
            const res = await apiFetch(`/tenants/${selectedTenant.id}/plan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planForm)
            })
            if (res.ok) {
                toast({ title: "Atualizado", description: "Configurações salvas." })
                setIsPlanOpen(false); fetchTenants()
            }
        } catch (error) { toast({ variant: "destructive", title: "Erro" }) }
    }
    
    // FUNÇÃO DE EXCLUSÃO FUNCIONANDO
    const handleDeleteTenant = async (id) => {
        if (!confirm('ATENÇÃO: Tem certeza que deseja excluir este escritório? Todos os usuários e dados associados serão permanentemente apagados!')) return
        
        try {
            const res = await apiFetch(`/tenants/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setTenants(tenants.filter(t => t.id !== id))
                toast({ title: "Removido", description: "O escritório foi excluído do sistema." })
            } else {
                toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o escritório." })
            }
        } catch (error) {
            console.error("Erro ao excluir", error)
            toast({ variant: "destructive", title: "Erro de rede" })
        }
    }

    const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <PageShell
            title="Escritórios"
            description="Gestão de parceiros e planos contratados."
            actionLabel="Novo Escritório"
            onAction={() => setIsCreating(true)}
        >
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
                <StatCard icon={<Building2 />} label="Total" value={tenants.length} color="blue" />
                <StatCard icon={<ShieldCheck />} label="Operacionais" value={tenants.filter(t => t.status === 'active').length} color="green" />
                <StatCard icon={<LayoutGrid />} label="Planos Ativos" value={tenants.filter(t => t.plan_status === 'active').length} color="purple" />
            </div>

            {/* Barra de Busca */}
            <div className="relative w-full max-w-md mb-6 text-left">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Filtrar por nome..." 
                    className="pl-10 h-11 bg-white border-slate-200 shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Listagem em Tabela Moderna */}
            <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Escritório</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plano</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assinatura</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sistema</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400 animate-pulse font-medium">Carregando dados...</td></tr>
                            ) : filteredTenants.map(tenant => (
                                <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{tenant.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono uppercase">{tenant.id.substring(0,8)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium capitalize">{tenant.plan}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={`text-[10px] h-5 font-bold uppercase ${
                                            tenant.plan_status === 'active' ? 'border-green-200 text-green-700 bg-green-50' : 
                                            tenant.plan_status === 'trial' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                                            'border-red-200 text-red-700 bg-red-50'
                                        }`}>
                                            {tenant.plan_status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`h-2 w-2 rounded-full ${tenant.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-xs font-semibold text-slate-600">{tenant.status === 'active' ? 'Ativo' : 'Suspenso'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0" 
                                                onClick={() => {
                                                    setSelectedTenant(tenant);
                                                    setPlanForm({ plan: tenant.plan, plan_status: tenant.plan_status, status: tenant.status });
                                                    setIsPlanOpen(true);
                                                }}
                                                title="Editar Plano"
                                            >
                                                <Edit2 className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 hover:bg-red-50"
                                                onClick={() => handleDeleteTenant(tenant.id)}
                                                title="Excluir Escritório"
                                            >
                                                <Trash2 className="h-4 w-4 text-slate-300 hover:text-red-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* POP-UP: NOVO ESCRITÓRIO */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95">
                        <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <PlusCircle className="h-5 w-5 text-blue-600" /> Novo Escritório
                            </h3>
                            <button onClick={() => setIsCreating(false)} className="hover:rotate-90 transition-transform">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTenant} className="p-8 space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nome Oficial</label>
                                <Input 
                                    autoFocus 
                                    value={newTenantName} 
                                    onChange={e => setNewTenantName(e.target.value)} 
                                    required 
                                    placeholder="Ex: Silva & Associados" 
                                    className="h-12 border-slate-200 focus:ring-blue-500/20" 
                                />
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-200">
                                Criar Escritório
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* POP-UP: GERENCIAR PLANO */}
            {isPlanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                        <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Gerenciar: {selectedTenant?.name}</h3>
                            <button onClick={() => setIsPlanOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleUpdatePlan} className="p-8 space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nível do Plano</label>
                                <select className="w-full h-12 border rounded-xl px-4 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20" value={planForm.plan} onChange={e => setPlanForm({...planForm, plan: e.target.value})}>
                                    <option value="free">Free</option>
                                    <option value="basic">Basic</option>
                                    <option value="standard">Standard</option>
                                    <option value="advanced">Advanced (AI)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Assinatura</label>
                                    <select className="w-full h-11 border rounded-xl px-3 bg-slate-50" value={planForm.plan_status} onChange={e => setPlanForm({...planForm, plan_status: e.target.value})}>
                                        <option value="active">Ativo</option>
                                        <option value="trial">Trial</option>
                                        <option value="past_due">Atrasado</option>
                                        <option value="canceled">Cancelado</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Sistema</label>
                                    <select className="w-full h-11 border rounded-xl px-3 bg-slate-50" value={planForm.status} onChange={e => setPlanForm({...planForm, status: e.target.value})}>
                                        <option value="active">Operacional</option>
                                        <option value="suspended">Suspenso</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg flex gap-3 border border-amber-100">
                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                    As alterações de plano afetam limites de armazenamento e acesso à IA em tempo real.
                                </p>
                            </div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold h-12 rounded-xl">Salvar Alterações</Button>
                        </form>
                    </div>
                </div>
            )}
        </PageShell>
    )
}

function StatCard({ icon, label, value, color }) {
    const colors = { blue: 'bg-blue-50 text-blue-600 border-blue-100', green: 'bg-green-50 text-green-600 border-green-100', purple: 'bg-purple-50 text-purple-600 border-purple-100' };
    return (
        <div className={`bg-white p-5 rounded-xl border ${colors[color]} shadow-sm flex items-center gap-4 text-left transition-all hover:shadow-md`}>
            <div className={`p-3 rounded-lg ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}>{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{value}</p>
            </div>
        </div>
    );
}