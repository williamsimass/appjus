import PageShell from '@/components/ui/page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Bot, Sparkles, Brain, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function IAPage() {
    return (
        <PageShell
            title="Inteligência Artificial (Beta)"
            description="Recursos avançados de IA para otimizar sua produtividade jurídica."
        >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-slate-200">
                    <CardContent className="pt-6">
                        <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                            <Brain className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Análise de Processos</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Resumos automáticos e identificação de riscos em peças processuais.
                        </p>
                        <Button variant="outline" className="w-full" disabled>Em breve</Button>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardContent className="pt-6">
                        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                            <Bot className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Assistente de Redação</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Sugestões de jurisprudência e melhoria de texto em tempo real.
                        </p>
                        <Button variant="outline" className="w-full" disabled>Em breve</Button>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardContent className="pt-6">
                        <div className="h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Chatbot Jurídico</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Tire dúvidas sobre prazos e procedimentos internos instantaneamente.
                        </p>
                        <Button variant="outline" className="w-full" disabled>Em breve</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 flex items-center gap-4">
                <div className="p-3 bg-white rounded-full shadow-sm">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                    <h4 className="font-semibold text-purple-900">Novos recursos chegando!</h4>
                    <p className="text-sm text-purple-700">Estamos treinando nossos modelos para atender especificamente o direito brasileiro.</p>
                </div>
            </div>
        </PageShell>
    )
}
