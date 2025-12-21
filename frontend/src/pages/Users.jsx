import { useState, useEffect } from 'react'
import PageShell from '@/components/ui/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { apiFetch } from '@/api'

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [tenants, setTenants] = useState([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', password: '', tenant_id: '', role: 'lawyer' })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [usersRes, tenantsRes] = await Promise.all([
                apiFetch('/users/'),
                apiFetch('/tenants/')
            ])

            if (usersRes.ok) setUsers(await usersRes.json())
            if (tenantsRes.ok) setTenants(await tenantsRes.json())

        } catch (error) {
            console.error("Erro", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.name || !formData.email || !formData.password || !formData.tenant_id) {
            alert("Preencha todos os dados")
            return
        }

        try {
            const res = await apiFetch('/users/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                alert('Usuário criado!')
                setIsCreating(false)
                setFormData({ name: '', email: '', password: '', tenant_id: '', role: 'lawyer' })
                fetchInitialData()
            } else {
                const err = await res.json()
                alert('Erro: ' + (err.detail || 'Erro ao criar'))
            }
        } catch (e) { console.error(e) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return
        try {
            const res = await apiFetch(`/users/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id))
            } else {
                alert('Erro ao excluir usuário')
            }
        } catch (e) { console.error(e) }
    }

    return (
        <PageShell
            title="Usuários"
            description="Gestão de usuários e acesso aos escritórios."
            actionLabel={isCreating ? "Cancelar" : "Novo Usuário"}
            onAction={() => setIsCreating(!isCreating)}
        >
            {isCreating && (
                <div className="mb-6 p-6 border rounded-lg bg-slate-50 w-full max-w-2xl text-left">
                    <h3 className="font-bold mb-4 text-lg">Cadastrar Novo Usuário</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome</label>
                            <input
                                className="w-full p-2 border rounded"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email (Login)</label>
                            <input
                                className="w-full p-2 border rounded"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Senha</label>
                            <input
                                type="password"
                                className="w-full p-2 border rounded"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Escritório (Tenant)</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={formData.tenant_id}
                                onChange={e => setFormData({ ...formData, tenant_id: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Permissão</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="lawyer">Advogado (Acesso Padrão)</option>
                                <option value="tenant_admin">Admin do Escritório</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleCreate}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
                        >
                            Criar Usuário
                        </button>
                    </div>
                </div>
            )}

            {loading ? <div className="text-center">Carregando...</div> : (
                <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {users.map(u => (
                        <Card key={u.id} className="text-left hover:shadow-md transition-shadow relative group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold text-slate-800 pr-8">
                                    {u.name}
                                </CardTitle>
                                <Badge variant="outline">{u.role}</Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}
                                    title="Excluir Usuário"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600">{u.email}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Escritório ID: {u.tenant_id ? u.tenant_id.substring(0, 8) + '...' : 'Global'}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </PageShell>
    )
}
