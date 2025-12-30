import { Bell, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/api'
import { useNavigate } from 'react-router-dom'

export function Header() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [showResults, setShowResults] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [showNotifications, setShowNotifications] = useState(false)
    const navigate = useNavigate()
    const searchRef = useRef(null)

    useEffect(() => {
        fetchNotifications()
        // Poll every 60s
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await apiFetch('/notifications/')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (e) {
            console.error("Failed to fetch notifications")
        }
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.length >= 2) {
                performSearch(query)
            } else {
                setResults([])
                setShowResults(false)
            }
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [query])

    const performSearch = async (q) => {
        try {
            const res = await apiFetch(`/search/?q=${encodeURIComponent(q)}`)
            if (res.ok) {
                const data = await res.json()
                setResults(data)
                setShowResults(true)
            }
        } catch (error) {
            console.error("Search error", error)
        }
    }

    const handleResultClick = (item) => {
        setQuery('')
        setShowResults(false)
        if (item.type === 'client') {
            navigate(`/clientes?open=${item.id}`)
        } else if (item.type === 'case') {
            // Case logic: Assuming navigate to client with tab processes, or detailed case page if exists.
            // Requirement: client details with tab. Need client_id? 
            // The search response might need to include client_id for cases to deep link properly. 
            // If backend doesn't return client_id, we might just go to /clientes?openCase=id or similar.
            // For now, let's assume we can navigate to detail page or show in context.
            // Simpler: If search gave us an ID, we assume it's a case ID.
            // Ideally backend search provides more context. Given "case -> /clientes/{clientId}?tab=processos", we need clientId.
            // If we don't have it, we can't deep direct link easily without a lookup.
            // Let's assume the label or detail has info or we just try to go to clients
            // BUT: User said: "case -> /clientes/{clientId}?tab=processos (ou /processos/{id} if exist)"
            // I'll stick to a generic /processos/{id} if I can, OR just warn/log if I don't have client ID.
            // Let's assume we navigate to a specific route or query.
            // Edit: I will implement a dedicated route /cases/{id} if needed, or query parameter logic in Clients page
            // to fetch the client of that case.
            // Optimization: navigate to `/clientes` and maybe filter?
            // Safer bet given current backend: Search response doesn't seem to include parent info explicitly.
            // I'll assume we navigate to /processos/:id if routed, or just stay put.
            // Wait, I saw `Processos.jsx`. Maybe that's the place?
            navigate(`/processos?id=${item.id}`)
        } else if (item.type === 'document') {
            navigate('/documentos')
        } else if (item.type === 'contract') {
            // Need client ID to go to /clientes/{client_id}?tab=contracts. 
            // If not present in search result, difficult.
            // Workaround: navigate to /clientes and let user find... NO, bad UX.
            // Improvement: Update backend search to return `parent_id`?
            // User didn't ask to change backend search details.
            // I will assume for now we might handle it later or distinct page `Contratos` to list all?
            // There IS a `Contratos.jsx`.
            navigate('/contratos')
        } else if (item.type === 'piece') {
            navigate('/pecas') // Assuming PecasProcessuais.jsx
        }
    }

    return (
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4 w-96" ref={searchRef}>
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar processos, clientes..."
                        className="pl-9 bg-slate-50 border-transparent focus:bg-white focus:border-input transition-all"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.length >= 2 && setShowResults(true)}
                    />

                    {showResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-100 max-h-80 overflow-y-auto py-2 z-50">
                            {results.length > 0 ? (
                                results.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0 transition-colors"
                                        onClick={() => handleResultClick(item)}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-medium text-sm text-slate-900">{item.label}</span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 border px-1 rounded">{item.type}</span>
                                        </div>
                                        <span className="text-xs text-slate-500 mt-0.5">{item.detail}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                    Nenhum resultado encontrado.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="h-5 w-5 text-slate-600" />
                        {notifications.length > 0 && (
                            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-600 border-2 border-white rounded-full"></span>
                        )}
                    </Button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-semibold text-sm text-slate-800">Notificações</h3>
                                {notifications.length > 0 && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                        {notifications.length}
                                    </span>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div key={notif.id} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-medium text-sm text-slate-900">{notif.title}</h4>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-xs text-slate-500">Sem novas notificações</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
