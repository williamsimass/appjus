import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '@/components/ui/page-shell'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch, cases } from '@/api'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Archive, ArchiveRestore, MoreVertical, Search, Globe, Clock, AlertCircle, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ProcessosPage() {
    const navigate = useNavigate()
    const [caseList, setCaseList] = useState([])
    const [clients, setClients] = useState([])
    const [tribunals, setTribunals] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [activeTab, setActiveTab] = useState("manual")

    const [formData, setFormData] = useState({
        number: '',
        court: '',
        status: 'open',
        next_deadline: '',
        client_id: '',
        tribunal_index: ''
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [casesRes, clientsRes, tribunalsRes] = await Promise.all([
                cases.list(),
                apiFetch('/clients/'),
                cases.tribunals().catch(() => ({ ok: false }))
            ])

            if (casesRes.ok) {
                const data = await casesRes.json()
                setCaseList(data)
            }
            if (clientsRes.ok) {
                const data = await clientsRes.json()
                setClients(data)
            }
            if (tribunalsRes && tribunalsRes.ok) {
                const data = await tribunalsRes.json()
                setTribunals(data)
            }
        } catch (error) {
            console.error("Erro ao buscar dados", error)
        } finally {
            setLoading(false)
        }
    }

    const formatCNJ = (value) => {
        if (!value) return ""
        // Remove non-digits
        const v = value.replace(/\D/g, "")
        // Mask: 0000000-00.0000.0.00.0000
        //       7d    -2d.4d  .1.2d.4d
        // Max 20 chars

        let r = v
        if (r.length > 20) r = r.substring(0, 20)

        // Apply mask progressively
        // 0000000-
        if (r.length > 7) r = r.substring(0, 7) + "-" + r.substring(7)
        // 0000000-00.
        if (r.length > 10) r = r.substring(0, 10) + "." + r.substring(10)
        // 0000000-00.0000.
        if (r.length > 15) r = r.substring(0, 15) + "." + r.substring(15)
        // 0000000-00.0000.0.
        if (r.length > 17) r = r.substring(0, 17) + "." + r.substring(17)
        // 0000000-00.0000.0.00.
        if (r.length > 20) r = r.substring(0, 20) + "." + r.substring(20)

        return r
    }

    const openCreate = () => {
        setEditingId(null)
        setActiveTab("manual")
        setFormData({
            number: '',
            court: '',
            status: 'open',
            next_deadline: '',
            client_id: '',
            tribunal_index: ''
        })
        setIsModalOpen(true)
    }

    const openEdit = (c, e) => {
        e.stopPropagation()
        setEditingId(c.id)
        setActiveTab("manual") // Always manual for editing existing fields
        setFormData({
            number: formatCNJ(c.number),
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
        if (!formData.client_id) return alert("Selecione um cliente")
        if (!formData.number) return alert("Informe o número do processo")

        try {
            let res;
            if (editingId) {
                const payload = {
                    ...formData,
                    number: formData.number.replace(/\D/g, ''), // Send clean
                    next_deadline: formData.next_deadline ? new Date(formData.next_deadline).toISOString() : null
                }
                res = await cases.update(editingId, payload)
            } else {
                if (activeTab === 'datajud') {
                    // Create via DataJud
                    const payload = {
                        client_id: formData.client_id,
                        number: formData.number.replace(/\D/g, '')
                    }
                    res = await cases.createFromDataJud(payload)
                } else {
                    // Manual Create
                    const payload = {
                        ...formData,
                        number: formData.number.replace(/\D/g, ''), // Send clean
                        next_deadline: formData.next_deadline ? new Date(formData.next_deadline).toISOString() : null
                    }
                    delete payload.tribunal_index
                    res = await cases.createForClient(formData.client_id, payload)
                }
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

    const openExternal = (url, e) => {
        e.stopPropagation()
        if (url) window.open(url, '_blank')
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
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
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
                            <div key={item.id} className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer h-full" onClick={(e) => {
                                if (item.external_url) openExternal(item.external_url, e);
                                else {
                                    navigator.clipboard.writeText(item.number)
                                    // Could add toast here
                                }
                            }}>
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
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/processos/${item.id}`) }} className="text-slate-600 focus:bg-slate-50 py-2">
                                                    <Eye className="w-4 h-4 mr-2" /> Detalhes
                                                </DropdownMenuItem>
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
                                        {item.formatted_number || formatCNJ(item.number)}
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-3 truncate font-medium">
                                        {item.system_name || item.court || 'Tribunal não informado'}
                                    </p>

                                    {/* DataJud Info */}
                                    <div className="space-y-2 mt-1">
                                        {item.court_name && (
                                            <div className="text-xs text-slate-600 truncate" title={item.court_name}>
                                                <span className="font-semibold text-slate-700">Vara:</span> {item.court_name}
                                            </div>
                                        )}

                                        {item.main_subject && (
                                            <div className="text-xs text-slate-600 truncate" title={item.main_subject}>
                                                <span className="font-semibold text-slate-700">Assunto:</span> {item.main_subject}
                                            </div>
                                        )}

                                        <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 mt-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Movimentação</span>
                                                {item.last_update && (
                                                    <span className="text-[10px] text-slate-500 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {new Date(item.last_update).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs font-medium text-slate-800 line-clamp-2" title={item.last_update_label || item.last_movement_title}>
                                                {item.last_update_label || item.last_movement_title || "Sem movimentações recentes"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deadline Section */}
                                    {item.next_deadline && (
                                        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-sm mt-3">
                                            <div className="flex items-center text-slate-500">
                                                <span className="font-medium mr-2 text-xs uppercase tracking-wide text-slate-400">Prazo Interno</span>
                                                <span className={new Date(item.next_deadline) < new Date() ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                                                    {new Date(item.next_deadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {item.external_url && (
                                        <div className={`mt-auto pt-3 border-t border-slate-50 flex justify-end ${item.next_deadline ? 'mt-3 border-none pt-0' : ''}`}>
                                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium group-hover:underline">
                                                Abrir Processo <Globe className="w-3 h-3" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/50 transition-all duration-500" />
                            </div>
                        ))}
                    </div>
                )
            }

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Processo' : 'Novo Processo'}</DialogTitle>
                        <DialogDescription>
                            Preencha os dados do processo abaixo.
                        </DialogDescription>
                    </DialogHeader>

                    {!editingId ? (
                        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="manual">Manual</TabsTrigger>
                                <TabsTrigger value="datajud">Importar DataJud</TabsTrigger>
                            </TabsList>

                            {/* Manual Form Content is shared below but we customize fields visibility based on tab in a simple way or keeping state clean */}
                        </Tabs>
                    ) : null}

                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Cliente</Label>
                            <select
                                className="w-full h-10 px-3 py-2 border rounded-md mt-1 bg-white text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.client_id}
                                disabled={!!editingId}
                                onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                            >
                                <option value="">Selecione um cliente...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {activeTab === 'manual' || editingId ? (
                            <>
                                <div>
                                    <Label>Número do Processo</Label>
                                    <Input
                                        value={formatCNJ(formData.number)}
                                        onChange={e => setFormData({ ...formData, number: e.target.value })}
                                        placeholder="0000000-00.0000.0.00.0000"
                                    />
                                </div>
                                <div>
                                    <Label>Tribunal / Vara</Label>
                                    <Input
                                        value={formData.court}
                                        onChange={e => setFormData({ ...formData, court: e.target.value })}
                                        placeholder="Ex: TJSP - 1ª Vara Cível"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Status</Label>
                                        <select
                                            className="w-full h-10 px-3 py-2 border rounded-md mt-1 bg-white text-sm"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="open">Aberto</option>
                                            <option value="archived">Arquivado</option>
                                            <option value="suspended">Suspenso</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Próximo Prazo</Label>
                                        <Input
                                            type="date"
                                            value={formData.next_deadline}
                                            onChange={e => setFormData({ ...formData, next_deadline: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            // DataJud Tab Content
                            <>
                                <div>
                                    <Label>Número CNJ (apenas números)</Label>
                                    <Input
                                        value={formatCNJ(formData.number)}
                                        onChange={e => setFormData({ ...formData, number: e.target.value })}
                                        placeholder="Ex: 1234567-89.2023.8.26.0100"
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Identificaremos o tribunal automaticamente pelo número.</p>
                                </div>

                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-md flex gap-3 text-sm text-blue-700">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p>Buscaremos os dados oficiais no DataJud (CNJ).</p>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageShell >
    )
}

