
import React, { useState, useEffect, useRef } from 'react'
import PageShell from '@/components/ui/page-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bot, FileText, Send, Loader2, AlertTriangle, CheckCircle, Info, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { apiFetch, contracts as contractsApi, ai as aiApi } from '@/api'
import { useToast } from '@/components/ui/use-toast'

export default function IAPage() {
    return (
        <PageShell
            title="Inteligência Artificial (Beta)"
            description="Recursos avançados de IA para otimizar sua produtividade jurídica."
        >
            <Tabs defaultValue="contracts" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="contracts">Análise de Contratos</TabsTrigger>
                    <TabsTrigger value="assistant">Assistente Jurídico</TabsTrigger>
                </TabsList>

                <TabsContent value="contracts" className="space-y-4">
                    <ContractsTab />
                </TabsContent>

                <TabsContent value="assistant" className="space-y-4">
                    <AssistantTab />
                </TabsContent>
            </Tabs>
        </PageShell>
    )
}

function ContractsTab() {
    const [contracts, setContracts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedContract, setSelectedContract] = useState(null)
    const { toast } = useToast()

    useEffect(() => {
        loadContracts()
    }, [])

    const loadContracts = async () => {
        try {
            const res = await contractsApi.listAll()
            if (res.ok) {
                const data = await res.json()
                setContracts(data)
            }
        } catch (error) {
            console.error("Erro ao carregar contratos", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
                <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-medium">Contratos Disponíveis</CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-auto p-2 space-y-2">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5 text-slate-400" /></div>
                    ) : contracts.length === 0 ? (
                        <div className="text-center p-4 text-sm text-slate-400">Nenhum contrato encontrado.</div>
                    ) : (
                        contracts.map(c => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedContract(c)}
                                className={cn(
                                    "p-3 rounded-md border text-sm cursor-pointer hover:bg-slate-50 transition-colors",
                                    selectedContract?.id === c.id ? "bg-slate-100 border-slate-300" : "bg-white border-slate-100"
                                )}
                            >
                                <div className="font-medium truncate">{c.file_name}</div>
                                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                    <Badge variant="secondary" className="text-[10px] h-5">{c.mime_type?.includes('pdf') ? 'PDF' : 'DOCX'}</Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <div className="h-[calc(100vh-200px)] overflow-auto">
                {selectedContract ? (
                    <ContractAnalysisView contract={selectedContract} />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 border rounded-lg bg-slate-50/50">
                        <div className="text-center">
                            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>Selecione um contrato para analisar</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ContractAnalysisView({ contract }) {
    const [analysis, setAnalysis] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        setAnalysis(null)
        checkHistory()
    }, [contract.id])

    const checkHistory = async () => {
        try {
            const res = await aiApi.analyses.list(contract.id)
            if (res.ok) {
                const data = await res.json()
                if (data.length > 0) {
                    // Load most recent
                    const recent = data[0]
                    try {
                        recent.parsed = JSON.parse(recent.result_json)
                        setAnalysis(recent)
                    } catch (e) {
                        console.error("JSON Parse error", e)
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    const runAnalysis = async () => {
        setAnalyzing(true)
        try {
            const res = await aiApi.contracts.analyze(contract.id)
            if (res.ok) {
                const data = await res.json()
                // The API returns the parsed JSON directly
                setAnalysis({
                    created_at: new Date().toISOString(),
                    risk_score: data.risk_score,
                    summary: data.summary,
                    parsed: data
                })
                toast({ title: "Análise concluída", description: "O contrato foi processado pela IA." })
            } else {
                toast({ title: "Erro na análise", description: "Não foi possível analisar o contrato.", variant: "destructive" })
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Erro", description: "Erro de conexão.", variant: "destructive" })
        } finally {
            setAnalyzing(false)
        }
    }

    if (analyzing) {
        return (
            <Card className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                <div className="text-center space-y-1">
                    <h3 className="font-semibold text-lg">Analisando Contrato...</h3>
                    <p className="text-slate-500 text-sm max-w-sm">Isso pode levar até um minuto. A IA está lendo cláusulas, identificando riscos e gerando o relatório.</p>
                </div>
            </Card>
        )
    }

    if (!analysis) {
        return (
            <Card className="h-full p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                    <Bot className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-1">{contract.file_name}</h3>
                    <p className="text-sm text-slate-500 mb-4">Este contrato ainda não possui análise.</p>
                    <Button onClick={runAnalysis} className="bg-purple-600 hover:bg-purple-700">
                        <SparklesIcon className="mr-2 h-4 w-4" />
                        Analisar com IA
                    </Button>
                </div>
            </Card>
        )
    }

    const { parsed, risk_score } = analysis

    return (
        <div className="space-y-6">
            <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Relatório de Análise</CardTitle>
                            <CardDescription>Gerado em {new Date(analysis.created_at).toLocaleString()}</CardDescription>
                        </div>
                        <div className={cn(
                            "px-3 py-1 rounded-full text-sm font-bold border",
                            risk_score > 70 ? "bg-red-50 text-red-700 border-red-200" :
                                risk_score > 30 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                    "bg-green-50 text-green-700 border-green-200"
                        )}>
                            Risco: {risk_score}/100
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-md border">
                        {parsed.summary}
                    </p>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Red Flags */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            Pontos de Atenção
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {parsed.red_flags?.length > 0 ? (
                            <ul className="space-y-3">
                                {parsed.red_flags.map((item, i) => (
                                    <li key={i} className="text-sm flex gap-2 items-start text-red-700 bg-red-50 p-2 rounded border border-red-100">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Nenhum ponto crítico detectado.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Suggestions */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-600">
                            <CheckCircle className="h-4 w-4" />
                            Sugestões de Melhoria
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {parsed.suggestions?.length > 0 ? (
                            <ul className="space-y-3">
                                {parsed.suggestions.map((item, i) => (
                                    <li key={i} className="text-sm flex gap-2 items-start text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Nenhuma sugestão adicional.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {(parsed.missing_items?.length > 0) && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            Itens Ausentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                            {parsed.missing_items.map((it, i) => <li key={i}>{it}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function AssistantTab() {
    const [threads, setThreads] = useState([])
    const [activeThreadId, setActiveThreadId] = useState(null)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        loadThreads()
    }, [])

    useEffect(() => {
        if (activeThreadId) {
            loadMessages(activeThreadId)
        } else {
            setMessages([])
        }
    }, [activeThreadId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const loadThreads = async () => {
        try {
            const res = await aiApi.threads.list()
            if (res.ok) {
                const data = await res.json()
                setThreads(data)
                if (data.length > 0 && !activeThreadId) {
                    setActiveThreadId(data[0].id)
                }
            }
        } catch (e) { }
    }

    const loadMessages = async (id) => {
        try {
            const res = await aiApi.threads.messages(id)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (e) { }
    }

    const createThread = async () => {
        try {
            const res = await aiApi.threads.create()
            if (res.ok) {
                const data = await res.json()
                setThreads([data, ...threads])
                setActiveThreadId(data.id)
            }
        } catch (e) { }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim() || !activeThreadId) return

        const tempMsg = { role: "user", content: input, id: "temp-" + Date.now() }
        setMessages(prev => [...prev, tempMsg])
        setInput("")
        setSending(true)

        try {
            const res = await aiApi.threads.sendMessage(activeThreadId, input)
            if (res.ok) {
                const assistantMsg = await res.json()
                setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), tempMsg, assistantMsg])
                loadThreads() // refresh titles if changed
            } else {
                setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), tempMsg, { role: 'assistant', content: 'Erro ao processar mensagem.', id: 'err' }])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-[250px_1fr] h-[calc(100vh-200px)]">
            <Card className="flex flex-col h-full">
                <div className="p-3 border-b">
                    <Button onClick={createThread} variant="outline" className="w-full justify-start gap-2">
                        <Plus className="h-4 w-4" /> Nova Conversa
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {threads.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveThreadId(t.id)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors",
                                    activeThreadId === t.id ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {t.title || "Nova Conversa"}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            <Card className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Bot className="h-12 w-12 mb-4 opacity-20" />
                            <p>Comece uma conversa com o Assistente Jurídico</p>
                        </div>
                    ) : (
                        messages.map((m, i) => (
                            <div key={i} className={cn("flex gap-3 max-w-[80%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    m.role === 'user' ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                                )}>
                                    {m.role === 'user' ? <div className="text-xs font-bold">VC</div> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-lg text-sm text-slate-800 shadow-sm",
                                    m.role === 'user' ? "bg-blue-50 border border-blue-100" : "bg-white border text-justify"
                                )}>
                                    {m.content.split('\n').map((line, idx) => <p key={idx} className="mb-1 last:mb-0">{line}</p>)}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t bg-white">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua dúvida jurídica..."
                            disabled={sending || !activeThreadId}
                        />
                        <Button type="submit" disabled={sending || !activeThreadId || !input.trim()}>
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}

function SparklesIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M9 9h4" />
            <path d="M20 21v-4" />
            <path d="M16 16h4" />
        </svg>
    )
}

function riskColor(level) {
    switch (level?.toLowerCase()) {
        case 'alto': return 'bg-red-500'
        case 'médio': return 'bg-yellow-500'
        case 'baixo': return 'bg-green-500'
        default: return 'bg-slate-300'
    }
}
function riskTextColor(level) {
    switch (level?.toLowerCase()) {
        case 'alto': return 'text-red-600'
        case 'médio': return 'text-yellow-600'
        case 'baixo': return 'text-green-600'
        default: return 'text-slate-500'
    }
}
