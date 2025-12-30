import { useState, useEffect } from 'react'
import PageShell from '@/components/ui/page-shell'
import { pieces, cases } from '@/api'
import { Button } from '@/components/ui/button'
import { Briefcase, Eye, Trash2, Upload, Calendar, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'

export default function PecasProcessuaisPage() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [caseList, setCaseList] = useState([])
    const [selectedCase, setSelectedCase] = useState('')
    const [uploading, setUploading] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const res = await pieces.list()
            if (res.ok) setList(await res.json())
        } finally { setLoading(false) }
    }

    const fetchCases = async () => {
        const res = await cases.list()
        if (res?.ok) {
            setCaseList(await res.json())
        }
    }

    useEffect(() => { load() }, [])

    const handleUploadClick = () => {
        fetchCases()
        setIsUploadOpen(true)
        setSelectedCase('')
    }

    const handleUploadSubmit = async (e) => {
        e.preventDefault()
        const file = e.target.file.files[0]
        if (!file || !selectedCase) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('case_id', selectedCase)

        try {
            await pieces.upload(formData)
            setIsUploadOpen(false)
            load()
        } catch (error) {
            alert('Erro ao enviar')
        } finally { setUploading(false) }
    }

    const handleView = async (piece) => {
        try {
            const url = await pieces.preview(piece.id)
            window.open(url, '_blank')
        } catch (e) {
            alert('Erro ao visualizar')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm("Excluir peça?")) return
        await pieces.delete(id)
        load()
    }

    return (
        <PageShell
            title="Peças Processuais"
            description="Biblioteca central de peças jurídicas."
            actionLabel="Nova Peça"
            onAction={handleUploadClick}
        >
            {loading ? (
                <div className="p-10 text-center">Carregando...</div>
            ) : list.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">Nenhuma peça encontrada</h3>
                    <p className="text-slate-500 mb-6">Associe peças aos seus processos.</p>
                    <Button onClick={handleUploadClick} variant="outline"><Upload className="w-4 h-4 mr-2" /> Upload</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {list.map(p => (
                        <Card key={p.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                        <FileText size={20} />
                                    </div>
                                </div>
                                <CardTitle className="text-base font-semibold truncate" title={p.file_name}>
                                    {p.file_name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {(p.file_size / 1024).toFixed(1)} KB
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-3 pt-0">
                                <div className="flex items-center text-xs text-slate-500 gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(p.created_at || Date.now()).toLocaleDateString()}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleView(p)} title="Visualizar">
                                    <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(p.id)} title="Excluir">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Peça Jurídica</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUploadSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Processo Vinculado</Label>
                            <Select value={selectedCase} onValueChange={setSelectedCase}>
                                <SelectTrigger><SelectValue placeholder="Selecione o processo..." /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {caseList.map(c => <SelectItem key={c.id} value={c.id}>{c.number} ({c.court})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Arquivo (PDF/DOC)</Label>
                            <label className="relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors bg-white">
                                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-600 font-medium">
                                    {uploading ? 'Enviando...' : 'Clique para selecionar a peça'}
                                </span>
                                <span className="text-xs text-slate-400 mt-1">PDF, DOC ou DOCX (Max 10MB)</span>
                                <input
                                    type="file"
                                    name="file"
                                    accept=".pdf,.doc,.docx"
                                    required
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            const span = e.target.parentElement.querySelector('span.text-slate-600');
                                            if (span) span.innerText = e.target.files[0].name;
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {uploading ? 'Enviando...' : 'Enviar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </PageShell>
    )
}
