import { useState, useEffect } from 'react'
import { apiFetch, API_URL } from '@/api'
import { FileText, Download, Trash2, Upload, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DocumentsPanel({ caseId }) {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (caseId) {
            fetchDocuments()
        }
    }, [caseId])

    const fetchDocuments = async () => {
        try {
            const res = await apiFetch(`/cases/${caseId}/documents`)
            if (res.ok) {
                const data = await res.json()
                setDocuments(data)
            }
        } catch (error) {
            console.error("Erro ao buscar documentos", error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        setError('')

        const formData = new FormData()
        formData.append('file', file)

        try {
            // Note: apiFetch automatically handles Authorization.
            // When passing FormData, do NOT set Content-Type header manually,
            // let the browser set it with the boundary.
            const res = await apiFetch(`/cases/${caseId}/documents`, {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                await fetchDocuments() // Refresh list
            } else {
                const err = await res.json()
                setError(err.detail || 'Erro ao enviar documento')
            }
        } catch (error) {
            console.error("Erro no upload", error)
            setError('Erro de conexão ao enviar documento')
        } finally {
            setUploading(false)
            // Reset input
            e.target.value = null
        }
    }

    const handleDownload = async (doc) => {
        try {
            // If API requires auth for download, we should fetch as blob
            const res = await apiFetch(`/documents/${doc.id}/download`)
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = doc.file_name // Suggest filename
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert('Erro ao baixar documento')
            }
        } catch (error) {
            console.error("Erro no download", error)
        }
    }

    const handleDelete = async (docId) => {
        if (!confirm('Tem certeza que deseja excluir este documento?')) return

        try {
            const res = await apiFetch(`/documents/${docId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setDocuments(documents.filter(d => d.id !== docId))
            } else {
                alert('Erro ao excluir documento')
            }
        } catch (error) {
            console.error("Erro ao excluir", error)
        }
    }

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos do Processo
                </CardTitle>
                <div>
                    <input
                        type="file"
                        id="doc-upload"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label
                        htmlFor="doc-upload"
                        className={`cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Upload className="h-4 w-4" />
                        {uploading ? 'Enviando...' : 'Anexar Documento'}
                    </label>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-4 text-slate-500">Carregando documentos...</div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500">Nenhum documento anexado a este processo.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-white p-2 rounded border">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate max-w-[200px] sm:max-w-md" title={doc.file_name}>
                                            {doc.file_name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {(doc.file_size / 1024).toFixed(0)} KB • {new Date(doc.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDownload(doc)}
                                        title="Baixar"
                                    >
                                        <Download className="h-4 w-4 text-slate-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(doc.id)}
                                        title="Excluir"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
