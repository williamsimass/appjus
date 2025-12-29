import { useState, useEffect, useRef } from 'react'
import { clients, cases, contracts, pieces, API_URL } from '@/api'
import { Button } from '@/components/ui/button'
import { Plus, Search, FileText, Scale, Briefcase, FileCheck, X, Edit, Trash2, Eye, Upload, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useSearchParams } from 'react-router-dom'

export default function Clients() {
    const [clientList, setClientList] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingClient, setEditingClient] = useState(null)
    const [selectedClient, setSelectedClient] = useState(null) // For details view

    // URL Params for deep linking
    const [searchParams, setSearchParams] = useSearchParams()

    // Preview
    const [previewDoc, setPreviewDoc] = useState(null)

    useEffect(() => {
        const handlePreview = (e) => setPreviewDoc(e.detail)
        window.addEventListener('preview-document', handlePreview)
        return () => window.removeEventListener('preview-document', handlePreview)
    }, [])

    useEffect(() => {
        fetchClients()
        const openId = searchParams.get('open')
        if (openId) {
            // Logic to auto-select client if list loaded
            // We'll handle this in fetchClients or separate effect
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const fetchClients = async (q = '') => {
        try {
            setLoading(true)
            const res = await clients.list(q)
            if (res.ok) {
                const data = await res.json()
                setClientList(data)

                // Deep link check
                const openId = searchParams.get('open')
                if (openId && !selectedClient) {
                    const found = data.find(c => c.id === openId)
                    if (found) setSelectedClient(found)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (confirm("Tem certeza que deseja excluir este cliente?")) {
            try {
                await clients.delete(id)
                fetchClients(searchQuery)
                if (selectedClient?.id === id) setSelectedClient(null)
            } catch (error) {
                alert("Erro ao excluir")
            }
        }
    }

    const openNewClient = () => {
        setEditingClient(null)
        setIsModalOpen(true)
    }

    const openEditClient = (client) => {
        setEditingClient(client)
        setIsModalOpen(true)
    }

    const handleSaveClient = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData.entries())

        // Manual checks
        data.contract_accepted = formData.get('contract_accepted') === 'on'

        try {
            if (editingClient) {
                await clients.update(editingClient.id, data)
            } else {
                await clients.create(data)
            }
            setIsModalOpen(false)
            fetchClients(searchQuery)
        } catch (error) {
            alert("Erro ao salvar cliente: " + error.message)
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clientes</h1>
                    <p className="text-slate-500">Gerencie seus clientes, contratos e processos.</p>
                </div>
                <Button onClick={openNewClient} className="bg-slate-900 hover:bg-slate-800">
                    <Plus className="w-4 h-4 mr-2" /> Novo Cliente
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Buscar por nome, CPF/CNPJ..."
                    className="pl-9 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-lg animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clientList.map(client => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onView={() => setSelectedClient(client)}
                            onEdit={() => openEditClient(client)}
                            onDelete={() => handleDelete(client.id)}
                        />
                    ))}
                </div>
            )}

            {/* Client Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveClient} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select name="type" defaultValue={editingClient?.type || 'PF'}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PF">Pessoa Física</SelectItem>
                                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>CPF/CNPJ</Label>
                                <Input name="document" defaultValue={editingClient?.document} placeholder="Apenas números" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nome Completo</Label>
                            <Input name="name" defaultValue={editingClient?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Razão Social (Opcional)</Label>
                            <Input name="company_name" defaultValue={editingClient?.company_name} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input name="email" type="email" defaultValue={editingClient?.email} />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input name="phone" defaultValue={editingClient?.phone} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Processo</Label>
                            <Select name="process_type" defaultValue={editingClient?.process_type || 'Civil'}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Civil">Civil</SelectItem>
                                    <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                                    <SelectItem value="Criminal">Criminal</SelectItem>
                                    <SelectItem value="Tributario">Tributário</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="checkbox"
                                name="contract_accepted"
                                id="contract_accepted"
                                className="w-4 h-4"
                                defaultChecked={editingClient?.contract_accepted}
                            />
                            <Label htmlFor="contract_accepted">Contrato Aceito</Label>
                        </div>

                        <DialogFooter>
                            <Button type="submit" className="bg-slate-900">Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Details Sheet/Modal */}
            {selectedClient && (
                <ClientDetails
                    client={selectedClient}
                    onClose={() => setSelectedClient(null)}
                />
            )}

            {/* Document Preview Modal */}
            <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold">{previewDoc?.title}</h3>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" asChild>
                                <a href={previewDoc?.url} target="_blank" rel="noreferrer" download>
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-100 relative">
                        {previewDoc && (
                            <iframe
                                src={previewDoc.url}
                                className="w-full h-full"
                                title="Preview"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ClientCard({ client, onView, onEdit, onDelete }) {
    const isPF = client.type === 'PF'
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <Badge variant={isPF ? "secondary" : "default"} className="mb-2">
                        {client.type}
                    </Badge>
                    <h3 className="font-semibold text-slate-900 truncate pr-8">
                        {isPF ? client.name : (client.company_name || client.name)}
                    </h3>
                    <p className="text-sm text-slate-500">{client.document || 'Sem documento'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {client.contract_accepted ? (
                        <span title="Contrato Aceito" className="text-green-600 bg-green-50 p-1 rounded-full"><FileCheck size={16} /></span>
                    ) : (
                        <span title="Pendente" className="text-slate-300 bg-slate-50 p-1 rounded-full"><FileText size={16} /></span>
                    )}
                </div>
            </div>

            <div className="text-sm text-slate-600 space-y-1 mb-4">
                <div className='flex items-center gap-2'>
                    <span className="w-4 h-4 text-slate-400 flex justify-center text-xs">@</span>
                    <span className="truncate">{client.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-slate-400" />
                    <span>{client.process_type || 'Não definido'}</span>
                </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                <Button variant="outline" size="sm" className="flex-1" onClick={onView}>Ver Detalhes</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={onEdit}><Edit size={16} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete}><Trash2 size={16} /></Button>
            </div>
        </div>
    )
}

function ClientDetails({ client, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
                        <p className="text-sm text-slate-500">{client.email} • {client.document}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>
                </div>

                <div className="flex-1 overflow-hidden p-0">
                    <Tabs defaultValue="cases" className="h-full flex flex-col">
                        <div className="px-6 pt-4 border-b">
                            <TabsList>
                                <TabsTrigger value="cases" className="gap-2"><Scale size={16} /> Processos</TabsTrigger>
                                <TabsTrigger value="contracts" className="gap-2"><FileCheck size={16} /> Contratos</TabsTrigger>
                                <TabsTrigger value="pieces" className="gap-2"><Briefcase size={16} /> Peças Processuais</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                            <TabsContent value="cases" className="mt-0 h-full">
                                <ClientCases client={client} />
                            </TabsContent>
                            <TabsContent value="contracts" className="mt-0 h-full">
                                <ClientContracts client={client} />
                            </TabsContent>
                            <TabsContent value="pieces" className="mt-0 h-full">
                                <ClientPieces client={client} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

function ClientCases({ client }) {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const res = await cases.listByClient(client.id)
            if (res.ok) setList(await res.json())
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [client.id])

    const handleCreate = async (e) => {
        e.preventDefault()
        const data = Object.fromEntries(new FormData(e.target).entries())
        try {
            await cases.createForClient(client.id, data)
            e.target.reset()
            load()
        } catch { alert('Erro ao criar') }
    }

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'open' ? 'archived' : 'open'
        try {
            await cases.updateStatus(id, newStatus)
            load()
        } catch { alert('Erro ao atualizar status') }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="font-medium mb-3">Novo Processo</h3>
                <form onSubmit={handleCreate} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs">Número</Label>
                        <Input name="number" placeholder="0000000-00.2024.8.26.0000" required />
                    </div>
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs">Tribunal / Vara</Label>
                        <Input name="court" placeholder="TJSP - 1ª Vara Cível" required />
                    </div>
                    <div className="space-y-1 w-32">
                        <Label className="text-xs">Status</Label>
                        <Select name="status" defaultValue="open">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Aberto</SelectItem>
                                <SelectItem value="archived">Arquivado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" size="sm" className="mb-0.5"><Plus size={16} /></Button>
                </form>
            </div>

            <div className="grid gap-3">
                {list.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                        <div>
                            <div className="font-medium text-blue-600">{c.number}</div>
                            <div className="text-sm text-slate-500">{c.court}</div>
                        </div>
                        <Button
                            variant={c.status === 'open' ? 'outline' : 'secondary'}
                            size="sm"
                            className="h-6 text-xs gap-2"
                            onClick={() => toggleStatus(c.id, c.status)}
                        >
                            {c.status === 'open' ? <span className="w-2 h-2 rounded-full bg-green-500" /> : <span className="w-2 h-2 rounded-full bg-slate-500" />}
                            {c.status === 'open' ? 'Aberto' : 'Arquivado'}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ClientContracts({ client }) {
    const [list, setList] = useState([])
    const load = async () => {
        const res = await contracts.listByClient(client.id)
        if (res.ok) setList(await res.json())
    }
    useEffect(() => { load() }, [])

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            await contracts.upload(client.id, formData)
            await load()
        } catch (error) {
            console.error('Erro ao fazer upload:', error)
            alert('Erro ao enviar arquivo')
        }
    }

    const toggleAccepted = async (id, current) => {
        await contracts.updateAccepted(id, !current)
        load()
    }

    const handleView = async (contract) => {
        try {
            const url = await contracts.preview(contract.id)
            window.dispatchEvent(new CustomEvent('preview-document', {
                detail: { url, title: contract.file_name, type: contract.mime_type }
            }))
        } catch (e) {
            alert('Erro ao carregar documento')
        }
    }

    const handleDelete = async (id) => {
        if (confirm("Excluir?")) {
            await contracts.delete(id)
            load()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button asChild>
                    <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 flex gap-2 items-center relative">
                        <Plus size={16} /> Upload Contrato
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" onChange={handleUpload} />
                    </label>
                </Button>
            </div>

            <div className="grid gap-2">
                {list.map(c => (
                    <div key={c.id} className="bg-white p-3 rounded border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="text-slate-400" />
                            <div>
                                <div className="text-sm font-medium">{c.file_name}</div>
                                <div className="text-xs text-slate-500">{(c.file_size / 1024).toFixed(1)} KB</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant={c.accepted ? "default" : "outline"} size="xs" onClick={() => toggleAccepted(c.id, c.accepted)}
                                className={c.accepted ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                                {c.accepted ? "Aceito" : "Pendente"}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleView(c)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(c.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ClientPieces({ client }) {
    const [caseList, setCaseList] = useState([])
    const [pieceList, setPieceList] = useState([])
    const [selectedCaseId, setSelectedCaseId] = useState('')

    const loadCases = async () => {
        const res = await cases.listByClient(client.id)
        if (res.ok) setCaseList(await res.json())
    }
    useEffect(() => { loadCases() }, [])

    const loadPieces = async () => {
        const res = await pieces.list(selectedCaseId || null, client.id)
        if (res.ok) setPieceList(await res.json())
    }
    useEffect(() => { loadPieces() }, [selectedCaseId])

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file || !selectedCaseId) return alert('Selecione um processo primeiro')

        const fd = new FormData()
        fd.append('file', file)
        fd.append('case_id', selectedCaseId)

        try {
            await pieces.upload(fd)
            loadPieces()
        } catch (error) {
            console.error('Erro ao fazer upload:', error)
            alert('Erro ao enviar arquivo')
        }
    }

    const handleView = async (pieceId) => {
        try {
            const piece = pieceList.find(p => p.id === pieceId)
            if (!piece) return
            const url = await pieces.preview(pieceId)
            window.dispatchEvent(new CustomEvent('preview-document', {
                detail: { url, title: piece.file_name, type: piece.mime_type }
            }))
        } catch (e) {
            alert('Erro ao carregar documento')
        }
    }


    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center bg-white p-4 rounded border">
                <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                    <SelectTrigger className="w-[300px]"><SelectValue placeholder="Selecione um Processo" /></SelectTrigger>
                    <SelectContent>
                        {caseList.map(c => <SelectItem key={c.id} value={c.id}>{c.number}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button asChild disabled={!selectedCaseId}>
                    <label className={`cursor-pointer px-4 py-2 rounded-md flex gap-2 items-center text-white relative ${!selectedCaseId ? 'bg-slate-300' : 'bg-slate-900 hover:bg-slate-800'}`}>
                        <Plus size={16} /> Nova Peça
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" onChange={handleUpload} disabled={!selectedCaseId} />
                    </label>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pieceList.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded border flex justify-between items-center group">
                        <div className="flex gap-3 items-center overflow-hidden">
                            <Briefcase className="text-slate-400 shrink-0" />
                            <span className="truncate text-sm font-medium">{p.file_name}</span>
                        </div>
                        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => handleView(p.id)}>Ver</Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={async () => {
                                if (confirm('Excluir?')) { await pieces.delete(p.id); loadPieces() }
                            }}><X size={16} /></Button>
                        </div>
                    </div>
                ))}
            </div>
            {!selectedCaseId && <div className="text-center text-slate-400 py-10">Selecione um processo para gerenciar peças</div>}
        </div>
    )
}
