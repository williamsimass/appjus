import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Settings, Scale, Briefcase, Calendar, Building, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Scale, label: 'Processos', href: '/dashboard/processos' },
    { icon: FileText, label: 'Documentos', href: '/dashboard/documentos' },
    { icon: FileText, label: 'Contratos + IA', href: '/dashboard/contratos' },
    { icon: Briefcase, label: 'Peças Processuais', href: '/dashboard/pecas' },
    { icon: Users, label: 'Clientes', href: '/dashboard/clientes' },
    { icon: Calendar, label: 'Agenda & Prazos', href: '/dashboard/agenda' },
    { icon: Settings, label: 'Configurações', href: '/dashboard/configuracoes' },
]

export function Sidebar() {
    const location = useLocation()
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
            <div className="p-6 flex items-center gap-2 border-b border-slate-800">
                <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center font-bold text-white">J</div>
                <span className="font-bold text-lg tracking-tight">JuridicoSaaS</span>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-accent/10 text-accent"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-accent" : "text-slate-400 group-hover:text-white")} />
                            {item.label}
                        </Link>
                    )
                })}

                {/* Admin GLobal Section */}
                {(user?.role === 'super_admin' || user?.role === 'admin_global') && (
                    <>
                        <div className="px-3 pt-4 pb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Admin Global
                            </p>
                        </div>
                        <Link
                            to="/dashboard/tenants"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                                location.pathname === '/dashboard/tenants'
                                    ? "bg-accent/10 text-accent"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Building className="h-5 w-5 text-slate-400 group-hover:text-white" />
                            Escritórios
                        </Link>
                        <Link
                            to="/dashboard/users"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                                location.pathname === '/dashboard/users'
                                    ? "bg-accent/10 text-accent"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Users className="h-5 w-5 text-slate-400 group-hover:text-white" />
                            Usuários
                        </Link>
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 p-2 rounded-md bg-slate-800/50">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="font-semibold text-sm">
                            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{user?.name || 'Usuário'}</span>
                        <span className="text-xs text-slate-400 capitalize">{(user?.role === 'super_admin' || user?.role === 'admin_global') ? 'Super Administrador' : user?.role || 'User'}</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="mt-2 w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </button>
            </div>
        </aside>
    )
}
