import PageShell from '@/components/ui/page-shell'

export default function ContratosPage() {
    return (
        <PageShell
            title="Contratos + IA"
            description="Geração e análise de contratos com Inteligência Artificial."
            actionLabel="Novo Contrato"
        >
            <div className="text-center max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">Assistente de Contratos IA</h3>
                <p className="text-slate-500 mt-2">Comece um novo contrato do zero ou faça upload para análise automática.</p>
            </div>
        </PageShell>
    )
}
