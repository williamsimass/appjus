import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Mail } from 'lucide-react'

export function LoginForm() {
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            navigate('/dashboard')
        }, 2000) // Simulate login
    }

    return (
        <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight">Acesse sua conta</CardTitle>
                <CardDescription>
                    Entre com seu email e senha para acessar o painel
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input id="email" type="email" placeholder="seu@email.com" className="pl-10" required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input id="password" type="password" placeholder="******" className="pl-10" required />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Lembrar-me</label>
                            </div>
                            <a href="#" className="text-sm font-medium text-primary hover:underline">Esqueceu a senha?</a>
                        </div>
                        <Button className="w-full" type="submit" disabled={loading} variant="premium">
                            {loading ? "Entrando..." : "Entrar"}
                        </Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="text-center text-sm text-gray-500">
                    Não tem uma conta? <a href="#" className="font-semibold text-primary hover:underline">Solicite acesso</a>
                </div>
            </CardFooter>
        </Card>
    )
}
