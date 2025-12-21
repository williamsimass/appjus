import { useAuth } from '@/contexts/AuthContext'
import { User, Mail, Shield } from 'lucide-react'
import PageShell from '@/components/ui/page-shell'

export default function ConfiguracoesPage() {
    const { user } = useAuth()

    const getRoleLabel = (role) => {
        if (!role) return 'Usuário'
        if (role === 'super_admin' || role === 'admin_global') return 'Super Administrador'
        if (role === 'tenant_admin') return 'Administrador do Escritório'
        if (role === 'lawyer') return 'Advogado'
        return role // Fallback
    }

    return (
        <PageShell
            title="Configurações"
            description="Ajustes do sistema e visualizar perfil."
        >
            <div className="w-full max-w-2xl text-left bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-bold text-lg border-b pb-4 mb-6 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Perfil do Usuário
                </h3>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Nome Completo</label>
                            <p className="text-slate-900 font-medium text-base">{user?.name || 'Não informado'}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                            <div className="flex items-center gap-2 text-slate-900">
                                <Mail className="h-4 w-4 text-slate-400" />
                                {user?.email || 'Não informado'}
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-500 mb-1">Nível de Acesso</label>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
                                    {getRoleLabel(user?.role)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                O seu nível de acesso determina quais funcionalidades você pode utilizar no sistema.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageShell>
    )
}
