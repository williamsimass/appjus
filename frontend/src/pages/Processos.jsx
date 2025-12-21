import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '@/components/ui/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/api'

export default function ProcessosPage() {
    const navigate = useNavigate()
    const [cases, setCases] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState({
        number: '',
        court: '',
        status: 'open',
        next_deadline: '',
        client_id: ''
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [casesRes, clientsRes] = await Promise.all([
                apiFetch('/cases/'),
                apiFetch('/clients/')
            ])

            if (casesRes.ok) {
                const data = await casesRes.json()
                setCases(data)
            }
            if (clientsRes.ok) {
                const data = await clientsRes.json()
                setClients(data)
            }
        } catch (error) {
            console.error("Erro ao buscar dados", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.number) {
            alert("O número do processo é obrigatório")
            return
        }
        if (!formData.client_id) {
            alert("Selecione um cliente")
            return
        }

        // Prepare payload: convert empty deadline to null if needed, though most backends handle ISODate string
        const payload = {
            ...formData,
            next_deadline: formData.next_deadline ? new Date(formData.next_deadline).toISOString() : null
        }

        try {
            const res = await apiFetch('/cases/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const saved = await res.json()
                setCases([saved, ...cases])
                setIsCreating(false)
                setFormData({ number: '', court: '', status: 'open', next_deadline: '', client_id: '' })
                alert("Processo criado com sucesso!")
            } else {
                const err = await res.json()
                alert("Erro ao criar processo: " + (err.detail || "Erro desconhecido"))
            }
        } catch (error) {
            console.error("Erro na requisição", error)
            alert("Erro de conexão ao tentar criar processo.")
        }
    }

    return (
        <PageShell
            title="Processos"
            description="Gerencie seus processos judiciais e administrativos."
            actionLabel={isCreating ? "Cancelar" : "Novo Processo"}
            onAction={() => setIsCreating(!isCreating)}
        >
            {isCreating && (
                <div className="mb-6 p-6 border rounded-lg bg-slate-50 w-full max-w-3xl text-left">
                    <h3 className="font-bold mb-4 text-lg">Cadastrar Novo Processo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Cliente *</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={formData.client_id}
                                onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                            >
                                <option value="">Selecione o Cliente...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} {c.document ? `(${c.document})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Número do Processo *</label>
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="ex: 0000000-00.2024.8.26.0000"
                                value={formData.number}
                                onChange={e => setFormData({ ...formData, number: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tribunal</label>
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="ex: TJSP"
                                value={formData.court}
                                onChange={e => setFormData({ ...formData, court: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="open">Aberto (Em andamento)</option>
                                <option value="archived">Arquivado</option>
                                <option value="suspended">Suspenso</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Próximo Prazo</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded"
                                value={formData.next_deadline}
                                onChange={e => setFormData({ ...formData, next_deadline: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleCreate}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
                        >
                            Salvar Processo
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center">Carregando...</div>
            ) : cases.length === 0 ? (
                <div className="text-center">
                    <p className="text-slate-500 mb-4">Nenhum processo encontrado.</p>
                </div>
            ) : (
                <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {cases.map(processo => (
                        <div
                            key={processo.id}
                            onClick={() => navigate(`/dashboard/processos/${processo.id}`)}
                            className="cursor-pointer"
                        >
                            <Card className="text-left hover:shadow-md transition-shadow h-full pb-2">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-800">
                                        {processo.number}
                                    </CardTitle>
                                    <Badge variant={processo.status === 'open' ? 'default' : 'secondary'}>
                                        {processo.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-bold mb-1">{processo.court || 'Tribunal N/A'}</div>
                                    <p className="text-xs text-slate-400">
                                        Próximo Prazo: {processo.next_deadline ? new Date(processo.next_deadline).toLocaleDateString() : 'Não definido'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </PageShell>
    )
}
