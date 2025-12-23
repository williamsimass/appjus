import { useState, useEffect } from 'react'
import PageShell from '@/components/ui/page-shell'
import { documents, tenants } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    FileText, Trash2, Upload, X, File as FileIcon, Loader2,
    Image as ImageIcon, FileType
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DocumentosPage() {
    const { user } = useAuth()
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])

    // Super Admin state
    const [allTenants, setAllTenants] = useState([])
    const [selectedTenantId, setSelectedTenantId] = useState('')

    const isSuperAdmin = ["super_admin", "admin_global", "admin"].includes(user?.role)

    useEffect(() => {
        loadDocuments()
        if (isSuperAdmin) {
            loadTenants()
        }
    }, [isSuperAdmin])

    const loadDocuments = async () => {
        try {
            const res = await documents.list()
            if (res.ok) {
                const data = await res.json()
                setDocs(data)
            }
        } catch (error) {
            console.error("Failed to load documents", error)
        } finally {
            setLoading(false)
        }
    }

    const loadTenants = async () => {
        try {
            const res = await tenants.list()
            if (res.ok) {
                const data = await res.json()
                setAllTenants(data)
            }
        } catch (error) {
            console.error("Failed to load tenants", error)
        }
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFiles(Array.from(e.target.files))
        }
    }

    const validateAndSetFiles = (files) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ]

        const validFiles = files.filter(file => {
            if (!allowedTypes.includes(file.type)) {
                console.warn(`Skipping invalid file type: ${file.name}`)
                return false
            }
            return true
        })

        if (validFiles.length < files.length) {
            alert('Alguns arquivos não foram adicionados pois não são permitidos. Use PDF, DOC, DOCX, JPG ou PNG.')
        }

        setSelectedFiles(prev => [...prev, ...validFiles])
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return

        if (isSuperAdmin && !selectedTenantId) {
            alert("Por favor, selecione um escritório (tenant) para vincular este arquivo.")
            return
        }

        setIsUploading(true)

        let successCount = 0
        let errors = []

        for (const file of selectedFiles) {
            const formData = new FormData()
            formData.append("file", file)
            if (selectedTenantId) {
                formData.append("tenant_id", selectedTenantId)
            }

            try {
                const res = await documents.upload(formData)
                if (res.ok) {
                    successCount++
                } else {
                    const errorText = await res.text()
                    errors.push(`${file.name}: ${errorText}`)
                }
            } catch (error) {
                errors.push(`${file.name}: Erro de rede`)
            }
        }

        setIsUploading(false)

        if (successCount > 0) {
            await loadDocuments()
            if (errors.length === 0) {
                closeModal()
            } else {
                // Some failed, remove successful ones from list? 
                // Simple approach: Alert errors, keep modal open with remaining?
                // For now, clear all if any success to force refresh logic, or just alert.
                alert(`Enviados com sucesso: ${successCount}. Falhas:\n${errors.join('\n')}`)
            }
        } else if (errors.length > 0) {
            alert(`Falha ao enviar:\n${errors.join('\n')}`)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm("Tem certeza que deseja excluir este arquivo?")) return

        // Optimistic update
        const originalDocs = [...docs]
        setDocs(docs.filter(d => d.id !== id))

        try {
            const res = await documents.delete(id)
            if (!res.ok) {
                // Revert on failure
                setDocs(originalDocs)
                console.error("Failed to delete")
                alert("Erro ao excluir arquivo.")
            }
        } catch (error) {
            setDocs(originalDocs)
            console.error("Failed to delete", error)
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedFiles([])
        setSelectedTenantId('')
    }

    // Format bytes to human readable
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    const getFileIcon = (mimeType, name) => {
        // Fallback checks on extension if mimeType is generic or missing
        const lowerName = name?.toLowerCase() || ''

        if (mimeType?.includes('pdf') || lowerName.endsWith('.pdf')) {
            return <FileIcon className="h-8 w-8 text-red-500" />
        }
        if (mimeType?.includes('word') || lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
            return <FileText className="h-8 w-8 text-blue-500" />
        }
        if (mimeType?.includes('image') || (['.jpg', '.jpeg', '.png'].some(ext => lowerName.endsWith(ext)))) {
            return <ImageIcon className="h-8 w-8 text-purple-500" /> // Using Purple/Green as requested
        }

        return <FileType className="h-8 w-8 text-slate-400" />
    }

    return (
        <PageShell
            title="Documentos"
            description="Biblioteca de documentos e arquivos do escritório."
            actionLabel="Upload de Arquivo"
            onAction={() => setIsModalOpen(true)}
        >
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
            ) : docs.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">Nenhum documento encontrado.</p>
                    <Button onClick={() => setIsModalOpen(true)}>Enviar primeiro arquivo</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full text-left">
                    {docs.map((doc) => (
                        <Card key={doc.id} className="relative group p-4 hover:shadow-md transition-shadow flex items-start space-x-4 border-slate-200">
                            <div className="p-2 bg-slate-50 rounded-lg">
                                {getFileIcon(doc.type || doc.mime_type, doc.name || doc.file_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate" title={doc.name || doc.file_name}>
                                    {doc.name || doc.file_name}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {formatBytes(doc.size || doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                                {isSuperAdmin && doc.tenant_id && (
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                        Tenant: {doc.tenant_id}
                                        {/* Ideally we map tenant_id to name if available */}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(doc.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 transition-opacity"
                                title="Excluir"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </Card>
                    ))}
                </div>
            )}

            {/* Upload Modal Overlay */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-slate-900">Upload de Arquivo</h3>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Tenant Selector for Super Admin */}
                                {isSuperAdmin && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Selecione o Escritório</label>
                                        <select
                                            className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedTenantId}
                                            onChange={(e) => setSelectedTenantId(e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {allTenants.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Drag & Drop Area */}
                                {!selectedFiles.length ? (
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <div className="p-4 bg-blue-50 rounded-full mb-4">
                                            <Upload className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">Clique ou arraste arquivos aqui</p>
                                        <p className="text-xs text-slate-500 mt-1">PDF, DOCX, JPG, PNG (Múltiplos)</p>
                                        <input
                                            type="file"
                                            className="hidden"
                                            id="file-upload"
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            multiple
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
                                        >
                                            Selecionar Arquivos
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-slate-700">{selectedFiles.length} arquivos selecionados</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                id="file-upload-add"
                                                onChange={handleFileChange}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                multiple
                                            />
                                            <label htmlFor="file-upload-add" className="text-xs text-blue-600 cursor-pointer hover:underline">
                                                + Adicionar
                                            </label>
                                        </div>
                                        {selectedFiles.map((file, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-200">
                                                <div className="flex items-center space-x-3 overflow-hidden">
                                                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm shrink-0">
                                                        {getFileIcon(file.type, file.name)}
                                                    </div>
                                                    <div className="text-left overflow-hidden min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                                                        <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <Button variant="outline" onClick={closeModal} disabled={isUploading}>
                                    Cancelar
                                </Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                                    onClick={handleUpload}
                                    disabled={selectedFiles.length === 0 || isUploading || (isSuperAdmin && !selectedTenantId)}
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Enviar"
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    )
}
