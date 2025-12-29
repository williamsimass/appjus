import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageShell from '@/components/ui/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiFetch, cases, pieces, documents, contracts } from '@/api'
import { ArrowLeft, Save, Archive, Trash2, Calendar, FolderOpen, FileText, ScrollText } from 'lucide-react'

export default function ProcessoDetalhes() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [caseData, setCaseData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Data for Tabs
    const [casePieces, setCasePieces] = useState([])
    const [caseDocs, setCaseDocs] = useState([]) // Need logic to filter docs by case if backend supports it, otherwise generic placeholder

    // Edit Form State
    const [formData, setFormData] = useState({
        number: '',
        court: '',
        next_deadline: '',
        status: ''
    })

    useEffect(() => {
        if (id) {
            fetchDetails()
            fetchRelatedData()
        }
    }, [id])

    const fetchDetails = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await cases.get(id)
            if (!res.ok) {
                if (res.status === 404) throw new Error("Processo não encontrado ou acesso negado.")
                throw new Error("Erro ao carregar dados do processo.")
            }
            const data = await res.json()
            setCaseData(data)
            setFormData({
                number: data.number,
                court: data.court || '',
                next_deadline: data.next_deadline ? data.next_deadline.split('T')[0] : '',
                status: data.status
            })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchRelatedData = async () => {
        // Fetch Pieces for this case
        try {
            const res = await pieces.list(id) // api.js supports caseId param
            if (res.ok) setCasePieces(await res.json())
        } catch (e) {
            console.error("Failed to load pieces", e)
        }

        // TODO: Fetch Docs and Contracts linked to this case if models allow
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = {
                ...formData,
                next_deadline: formData.next_deadline ? new Date(formData.next_deadline).toISOString() : null
            }
            const res = await cases.update(id, payload)
            if (!res.ok) throw new Error("Falha ao salvar alterações")

            const updated = await res.json()
            setCaseData(updated)
            alert("Alterações salvas com sucesso!")
        } catch (err) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleArchive = async () => {
        if (!confirm("Tem certeza que deseja alterar o status de arquivamento?")) return
        const newStatus = caseData.status === 'open' ? 'archived' : 'open'
        try {
            await cases.updateStatus(id, newStatus)
            fetchDetails()
        } catch (err) {
            alert("Erro ao alterar status")
        }
    }

    const handleDelete = async () => {
        if (!confirm("ATENÇÃO: Isso excluirá o processo permanentemente!")) return
        try {
            await cases.delete(id)
            navigate('/dashboard/processos')
        } catch (err) {
            alert("Erro ao excluir processo")
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Ops!</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <Button onClick={() => navigate('/dashboard/processos')} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/processos')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">{formData.number}</h1>
                            <Badge variant={caseData.status === 'open' ? 'default' : 'secondary'} className={caseData.status === 'open' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}>
                                {caseData.status === 'open' ? 'Em Andamento' : 'Arquivado'}
                            </Badge>
                        </div>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            Cliente: <span className="font-semibold text-slate-700">{caseData.client?.name || 'Cliente desconhecido'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        {saving ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
                    </Button>
                    <Button variant="outline" onClick={handleArchive}>
                        <Archive className="w-4 h-4 mr-2" /> {caseData.status === 'open' ? 'Arquivar' : 'Reabrir'}
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Detalhes do Processo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-500 mb-1 block">Número do Processo</label>
                                <input
                                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500 mb-1 block">Tribunal</label>
                                <input
                                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                                    value={formData.court}
                                    onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500 mb-1 block">Próximo Prazo</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                                        value={formData.next_deadline}
                                        onChange={(e) => setFormData({ ...formData, next_deadline: e.target.value })}
                                    />
                                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500 mb-1 block">Status</label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="open">Aberto (Em Andamento)</option>
                                    <option value="archived">Arquivado</option>
                                    <option value="suspended">Suspenso</option>
                                </select>
                            </div>
                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <p className="text-xs text-slate-400">Criado em: {new Date(caseData.created_at).toLocaleDateString()}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="pecas" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="pecas" className="gap-2"><FolderOpen className="w-4 h-4" /> Peças Processuais</TabsTrigger>
                            <TabsTrigger value="documentos" className="gap-2"><FileText className="w-4 h-4" /> Documentos</TabsTrigger>
                            <TabsTrigger value="prazos" className="gap-2"><Calendar className="w-4 h-4" /> Prazos</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pecas" className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Histórico de Peças</CardTitle></CardHeader>
                                <CardContent>
                                    {casePieces.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500 text-sm">Nenhuma peça processual vinculada.</div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {casePieces.map(piece => (
                                                <li key={piece.id} className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center hover:bg-slate-100 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-white rounded flex items-center justify-center text-blue-600 shadow-sm"><FileText className="h-4 w-4" /></div>
                                                        <div>
                                                            <p className="font-medium text-sm text-slate-800">{piece.title}</p>
                                                            <p className="text-xs text-slate-500">{new Date(piece.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="documentos">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Documentos do Processo</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-500">Gestão de documentos vinculados a este processo será implementada em breve.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="prazos">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Agenda de Prazos</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-500">Integração com Agenda & Prazos será exibida aqui.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
