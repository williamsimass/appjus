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
                                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                                        {tenant.status}
                                    </Badge>
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
                                <p className="text-sm text-slate-500">Plano: {tenant.plan}</p>
                                <p className="text-xs text-slate-400 mt-2">Criado em: {new Date(tenant.created_at).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </PageShell>
    )
}
