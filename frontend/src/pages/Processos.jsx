import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '@/components/ui/page-shell'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch, cases } from '@/api'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Archive, ArchiveRestore, MoreVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function ProcessosPage() {
    const navigate = useNavigate()
    const [caseList, setCaseList] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
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
                cases.list(),
                apiFetch('/clients/')
            ])

            if (casesRes.ok) {
                const data = await casesRes.json()
                setCaseList(data)
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

    const openCreate = () => {
        setEditingId(null)
        setFormData({ number: '', court: '', status: 'open', next_deadline: '', client_id: '' })
        setIsModalOpen(true)
    }

    const openEdit = (c, e) => {
        e.stopPropagation()
        setEditingId(c.id)
        setFormData({
            number: c.number,
            court: c.court,
            status: c.status,
            next_deadline: c.next_deadline ? c.next_deadline.split('T')[0] : '',
            client_id: c.client_id
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id, e) => {
        e.stopPropagation()
        if (confirm("Tem certeza que deseja excluir este processo?")) {
            await cases.delete(id)
            fetchInitialData()
        }
    }

    const handleArchiveToggle = async (c, e) => {
        e.stopPropagation()
        const newStatus = c.status === 'open' ? 'archived' : 'open'
        await cases.updateStatus(c.id, newStatus)
        fetchInitialData()
    }

    const handleSave = async () => {
        if (!formData.number || !formData.client_id) return alert("Preencha campos obrigatórios")

        const payload = {
            ...formData,
            next_deadline: formData.next_deadline ? new Date(formData.next_deadline).toISOString() : null
        }

        try {
            let res;
            if (editingId) {
                res = await cases.update(editingId, payload)
            } else {
                res = await cases.createForClient(formData.client_id, payload)
            }

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                const msg = errData.detail || "Erro desconhecido ao salvar"
                throw new Error(msg)
            }

            setIsModalOpen(false)
            fetchInitialData()
        } catch (err) {
            console.error(err)
            alert(`Erro ao salvar: ${err.message}`)
        }
    }

    return (
        <PageShell
            title="Processos"
            description="Gerencie seus processos judiciais e administrativos."
            actionLabel="Novo Processo"
            onAction={openCreate}
        >
            {/* Search Bar Visual Only */}
            <div className="mb-8 w-full max-w-7xl mx-auto flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar processos..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600"
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>

            {
                loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-slate-500">Carregando processos...</p>
                    </div>
                ) : caseList.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 p-12 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-blue-100/50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                            <Archive className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum processo encontrado</h3>
                        <p className="text-slate-500 max-w-md mb-6">Comece adicionando seu primeiro processo para acompanhar prazos e movimentações.</p>
                        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                            Criar Novo Processo
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {caseList.map(item => (
                            <div key={item.id} className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer" onClick={() => navigate(`/dashboard/processos/${item.id}`)}>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="secondary" className={`px-2.5 py-0.5 rounded-md font-medium text-xs ${item.status === 'open'
                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {item.status === 'open' ? 'Em Andamento' : 'Arquivado'}
                                        </Badge>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors -mr-2 -mt-2"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="h-5 w-5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 shadow-xl border-slate-100">
                                                <DropdownMenuItem onClick={(e) => openEdit(item, e)} className="text-slate-600 focus:bg-slate-50 py-2">
                                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleArchiveToggle(item, e)} className="text-slate-600 focus:bg-slate-50 py-2">
                                                    {item.status === 'open' ? <Archive className="w-4 h-4 mr-2" /> : <ArchiveRestore className="w-4 h-4 mr-2" />}
                                                    {item.status === 'open' ? 'Arquivar' : 'Reabrir'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 py-2" onClick={(e) => handleDelete(item.id, e)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug truncate" title={item.number}>
                                        {item.number}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium truncate mb-6" title={item.court}>
                                        {item.court || 'Tribunal não informado'}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
                                        <div className="flex items-center text-slate-500">
                                            <span className="font-medium mr-2 text-xs uppercase tracking-wide text-slate-400">Prazo</span>
                                            {item.next_deadline ? (
                                                <span className={new Date(item.next_deadline) < new Date() ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                                                    {new Date(item.next_deadline).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/50 transition-all duration-500" />
                            </div>
                        ))}
                    </div>
                )
            }

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Processo' : 'Novo Processo'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Cliente</label>
                            <select
                                className="w-full p-2 border rounded mt-1 bg-white"
                                value={formData.client_id}
                                disabled={!!editingId} // Disable client change on edit usually safer
                                onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Número</label>
                            <input className="w-full p-2 border rounded mt-1" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Tribunal</label>
                            <input className="w-full p-2 border rounded mt-1" value={formData.court} onChange={e => setFormData({ ...formData, court: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <select className="w-full p-2 border rounded mt-1 bg-white" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="open">Aberto</option>
                                    <option value="archived">Arquivado</option>
                                    <option value="suspended">Suspenso</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Próximo Prazo</label>
                                <input type="date" className="w-full p-2 border rounded mt-1" value={formData.next_deadline} onChange={e => setFormData({ ...formData, next_deadline: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageShell >
    )
}
