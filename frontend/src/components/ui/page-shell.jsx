import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function PageShell({ title, description, children, actionLabel, onAction }) {
    return (
        <div className="space-y-8 p-8">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
                    {description && <p className="text-slate-500 mt-2 text-lg">{description}</p>}
                </div>
                {actionLabel && (
                    <Button onClick={onAction} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-11 px-6 text-base">
                        <Plus className="h-5 w-5" />
                        {actionLabel}
                    </Button>
                )}
            </div>

            <div className="w-full max-w-7xl mx-auto">
                {children ? (
                    children
                ) : (
                    <div className="border border-dashed border-slate-300 rounded-lg p-12 flex flex-col items-center justify-center text-center min-h-[400px] bg-slate-50/50">
                        <p className="text-slate-500 mb-4 text-lg">Nenhum item encontrado.</p>
                        {actionLabel && <Button variant="outline" onClick={onAction}>{actionLabel}</Button>}
                    </div>
                )}
            </div>
        </div>
    )
}
