import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Gavel, Scale, DollarSign } from 'lucide-react'
import { apiFetch } from '@/api'

export default function DashboardPage() {
    const navigate = useNavigate()

    const [stats, setStats] = useState({
        cases: 0,
        clients: 0,
        audiences: 0,
        revenue: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token')

            if (!token) {
                navigate('/login')
                return
            }

            const [casesRes, clientsRes] = await Promise.all([
                apiFetch('/cases/'),
                apiFetch('/clients/'),
            ])

            // If apiFetch throws 401, we land in catch.
            // But we should check .ok just in case of other errors (500 etc)
            // apiFetch returns the response object.

            const casesData = casesRes.ok ? await casesRes.json() : []
            const clientsData = clientsRes.ok ? await clientsRes.json() : []

            setStats({
                cases: Array.isArray(casesData) ? casesData.length : 0,
                clients: Array.isArray(clientsData) ? clientsData.length : 0,
                audiences: 0, // Mock for now
                revenue: 0, // Mock for now
            })
        } catch (error) {
            console.error('Dashboard functionality limited', error)
            if (error.message && error.message.includes("401")) {
                localStorage.removeItem('token')
                navigate('/login')
            }
        } finally {
            setLoading(false)
        }
    }

    const kpiCards = [
        { label: 'Processos Ativos', icon: Gavel, color: 'text-blue-600', bg: 'bg-blue-100', value: stats.cases },
        { label: 'Novos Clientes', icon: Users, color: 'text-green-600', bg: 'bg-green-100', value: stats.clients },
        { label: 'Audiências Hoje', icon: Scale, color: 'text-purple-600', bg: 'bg-purple-100', value: stats.audiences },
        { label: 'Receita', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100', value: 'R$ ' + stats.revenue },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
                <p className="text-slate-500">Visão geral do escritório.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((stat, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">{stat.label}</CardTitle>
                            <div className={`p-2 rounded-full ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{loading ? '...' : stat.value}</div>
                            <p className="text-xs text-slate-500 flex items-center mt-1">
                                <span className="text-slate-400">{loading ? 'Carregando dados...' : 'Atualizado agora'}</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 h-[400px]">
                    <CardHeader>
                        <CardTitle>Processos Recentes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-full pb-12">
                        <p className="text-slate-400 text-sm">Nenhum processo recente encontrado.</p>
                    </CardContent>
                </Card>

                <Card className="col-span-3 h-[400px]">
                    <CardHeader>
                        <CardTitle>Próximas Audiências</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-full pb-12">
                        <p className="text-slate-400 text-sm">Nenhuma audiência agendada.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
