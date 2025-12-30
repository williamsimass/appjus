import { apiFetch } from '@/api'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Mail, Shield, Bell } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import PageShell from '@/components/ui/page-shell'

export default function ConfiguracoesPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [sending, setSending] = useState(false)
    const [notifForm, setNotifForm] = useState({ title: '', message: '' })

    const handleSendNotification = async (e) => {
        e.preventDefault()
        setSending(true)
        try {
            const res = await apiFetch('/notifications/', {
                method: 'POST',
                body: JSON.stringify(notifForm)
            })
            if (res.ok) {
                toast({
                    title: "Sucesso",
                    description: "Notificação enviada para todos os usuários.",
                })
                setNotifForm({ title: '', message: '' })
            } else {
                throw new Error()
            }
        } catch (error) {
            toast({
                variant: "destuctive",
                title: "Erro",
                description: "Falha ao enviar notificação.",
            })
        } finally {
            setSending(false)
        }
    }

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
                {/* System Notifications Section - Only for Super Admins */}
                {(user?.role === 'super_admin' || user?.role === 'admin_global') && (
                    <div className="w-full max-w-2xl text-left bg-white p-6 rounded-lg shadow-sm border mt-8">
                        <h3 className="font-bold text-lg border-b pb-4 mb-6 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-orange-600" />
                            Enviar Notificação Global
                        </h3>

                        <form onSubmit={handleSendNotification} className="space-y-4">
                            <div className="bg-orange-50 border border-orange-100 p-4 rounded-md mb-4 text-sm text-orange-800">
                                <strong>Atenção:</strong> Esta mensagem será enviada para TODOS os usuários da plataforma.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                                <Input
                                    value={notifForm.title}
                                    onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                                    placeholder="Ex: Manutenção Programada"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                                <Textarea
                                    value={notifForm.message}
                                    onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                                    placeholder="Digite a mensagem que todos os usuários verão..."
                                    className="min-h-[100px]"
                                    required
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={sending} className="bg-orange-600 hover:bg-orange-700 text-white">
                                    {sending ? 'Enviando...' : 'Enviar Notificação'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </PageShell>
    )
}
