import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function PageShell({ title, description, children, actionLabel, onAction }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
                    {description && <p className="text-slate-500">{description}</p>}
                </div>
                {actionLabel && (
                    <Button onClick={onAction} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        <Plus className="h-4 w-4" />
                        {actionLabel}
                    </Button>
                )}
            </div>

            <div className="border border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-center min-h-[400px] bg-slate-50/50">
                {children ? children : (
                    <>
                        <p className="text-slate-500 mb-4">Nenhum item encontrado.</p>
                        {actionLabel && <Button variant="outline" onClick={onAction}>{actionLabel}</Button>}
                    </>
                )}
            </div>
        </div>
    )
}
