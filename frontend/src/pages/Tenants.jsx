import { useState, useEffect } from 'react'
import PageShell from '@/components/ui/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { apiFetch } from '@/api'

export default function TenantsPage() {
    const [tenants, setTenants] = useState([])
    const [loading, setLoading] = useState(true)

    const [newTenantName, setNewTenantName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const [selectedTenant, setSelectedTenant] = useState(null)
    const [planForm, setPlanForm] = useState({ plan: 'free', plan_status: 'active' })
    const [isPlanOpen, setIsPlanOpen] = useState(false)

    useEffect(() => {
        fetchTenants()
    }, [])

    const fetchTenants = async () => {
        try {
            const res = await apiFetch('/tenants/')
            if (res.ok) {
                const data = await res.json()
                setTenants(data)
            }
        } catch (error) {
            console.error("Erro ao buscar tenants", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTenant = async () => {
        if (!newTenantName) return
        try {
            const res = await apiFetch('/tenants/?name=' + encodeURIComponent(newTenantName), {
                method: 'POST'
            })

            if (res.ok) {
                alert('Escritório criado com sucesso!')
                setNewTenantName('')
                setIsCreating(false)
                fetchTenants()
            } else {
                alert('Erro ao criar escritório')
            }
        } catch (error) {
            console.error("Erro", error)
        }
    }

    const handleDeleteTenant = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este escritório? Todos os dados associados serão perdidos!')) return
        try {
            const res = await apiFetch(`/tenants/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setTenants(tenants.filter(t => t.id !== id))
            } else {
                alert('Erro ao excluir escritório')
            }
        } catch (error) {
            console.error("Erro ao excluir", error)
        }
    }

    const openPlanModal = (tenant) => {
        setSelectedTenant(tenant)
        setPlanForm({
            plan: tenant.plan || 'free',
            plan_status: tenant.plan_status || 'active'
        })
        setIsPlanOpen(true)
    }

    const handleUpdatePlan = async () => {
        if (!selectedTenant) return
        try {
            // Assume api.tenants.updatePlan is available or use direct fetch
            // But let's use the one we just added or fallback
            // To be safe in this edit if api.js isn't refreshed yet (hot reload handles it usually)
            // We'll use the one from 'api' module if imported, wait... 
            // The file imports { apiFetch } from '@/api', better to import tenants object or raw fetch.
            // Let's use apiFetch directly to be atomic if possible, or assume user refreshes.
            // Correction: I see 'import { apiFetch } from ...' at top. I should use apiFetch directly for PATCH.

            const res = await apiFetch(`/tenants/${selectedTenant.id}/plan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planForm)
            })

            if (res.ok) {
                alert('Plano atualizado com sucesso!')
                setIsPlanOpen(false)
                fetchTenants()
            } else {
                alert('Erro ao atualizar plano')
            }
        } catch (error) {
            alert('Erro de conexão')
        }
    }

    return (
        <PageShell
            title="Escritórios (Tenants)"
            description="Administração global de escritórios parceiros."
            actionLabel={isCreating ? "Cancelar" : "Novo Escritório"}
            onAction={() => setIsCreating(!isCreating)}
        >
            {isCreating && (
                <div className="mb-6 p-4 border rounded-lg bg-slate-50 w-full max-w-lg">
                    <h3 className="font-bold mb-2">Novo Escritório</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 p-2 border rounded"
                            placeholder="Nome do Escritório"
                            value={newTenantName}
                            onChange={e => setNewTenantName(e.target.value)}
                        />
                        <button
                            onClick={handleCreateTenant}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold"
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Plano */}
            {isPlanOpen && selectedTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Gerenciar Plano: {selectedTenant.name}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Plano</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={planForm.plan}
                                    onChange={e => setPlanForm({ ...planForm, plan: e.target.value })}
                                >
                                    <option value="free">Free (Grátis)</option>
                                    <option value="basic">Basic</option>
                                    <option value="standard">Standard (Live Updates)</option>
                                    <option value="advanced">Advanced (AI)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Status da Assinatura</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={planForm.plan_status}
                                    onChange={e => setPlanForm({ ...planForm, plan_status: e.target.value })}
                                >
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                    <option value="trial">Trial (Teste)</option>
                                    <option value="past_due">Atrasado</option>
                                    <option value="canceled">Cancelado</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setIsPlanOpen(false)}>Cancelar</Button>
                                <Button onClick={handleUpdatePlan}>Salvar Alterações</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center">Carregando...</div>
            ) : tenants.length === 0 ? (
                <div className="text-center">Nenhum tenant encontrado.</div>
            ) : (
                <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {tenants.map(tenant => (
                        <Card key={tenant.id} className="text-left hover:shadow-md transition-shadow relative group">
                            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-bold text-slate-800">
                                        {tenant.name}
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                                            {tenant.status}
                                        </Badge>
                                        <Badge variant="outline" className={
                                            tenant.plan === 'advanced' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                                                tenant.plan === 'standard' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                                    'border-slate-200 text-slate-600'
                                        }>
                                            {tenant.plan?.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2 -mt-2"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTenant(tenant.id); }}
                                    title="Excluir Escritório"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-xs text-slate-500">
                                        <p>Status Assinatura: <span className="font-semibold">{tenant.plan_status}</span></p>
                                        <p className="mt-1">Criado: {new Date(tenant.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => openPlanModal(tenant)}>
                                        Gerenciar Plano
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </PageShell>
    )
}

