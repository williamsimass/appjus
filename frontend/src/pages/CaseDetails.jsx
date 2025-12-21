import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageShell from '@/components/ui/page-shell'
import { apiFetch } from '@/api'
import DocumentsPanel from '@/components/DocumentsPanel'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Scale, Calendar, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function CaseDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [caseData, setCaseData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchCaseDetails()
    }, [id])

    const fetchCaseDetails = async () => {
        try {
            const res = await apiFetch(`/cases/${id}`)
            if (res.ok) {
                const data = await res.json()
                setCaseData(data)
            } else {
                setError('Processo não encontrado ou acesso negado.')
            }
        } catch (error) {
            console.error("Erro ao buscar detalhes do processo", error)
            setError('Erro de conexão ao buscar processo.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando detalhes do processo...</div>

    if (error || !caseData) return (
        <div className="p-8 text-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block mb-4">
                <AlertCircle className="h-6 w-6 inline-block mr-2" />
                {error || 'Processo não encontrado'}
            </div>
            <br />
            <Button variant="outline" onClick={() => navigate('/dashboard/processos')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
            </Button>
        </div>
    )

    return (
        <PageShell
            title="Detalhes do Processo"
            description={`Visualizando processo ${caseData.number}`}
        >
            <div className="mb-6">
                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-blue-600" onClick={() => navigate('/dashboard/processos')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para lista
                </Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Scale className="h-5 w-5 text-blue-600" />
                            {caseData.number}
                        </h2>
                        <p className="text-slate-500 mt-1">{caseData.court || 'Tribunal não informado'}</p>
                    </div>
                    <Badge variant={caseData.status === 'open' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                        {caseData.status === 'open' ? 'Em Andamento' : caseData.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-500">Cliente</label>
                        <p className="text-slate-900 font-medium">
                            {/* Assuming backend returns client name/details nested or we only have client_id. 
                                Ideally we show client name. If backend only sends ID, we might need a separate fetch or backend adjustment.
                                For now, checking if client object exists or using ID. */}
                            {caseData.client?.name || caseData.client_name || 'Cliente (ID: ' + caseData.client_id?.substring(0, 8) + '...)'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500">Próximo Prazo</label>
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {caseData.next_deadline ? new Date(caseData.next_deadline).toLocaleDateString() : 'Não definido'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500">Data de Criação</label>
                        <p className="text-slate-900">{new Date(caseData.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <DocumentsPanel caseId={id} />
        </PageShell>
    )
}
