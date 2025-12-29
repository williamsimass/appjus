import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from "@/pages/Login"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import DashboardPage from "@/pages/Dashboard"
import ProcessosPage from "@/pages/Processos"
import ProcessoDetalhesPage from "@/pages/ProcessoDetalhes"
import DocumentosPage from "@/pages/Documentos"
import ContratosPage from "@/pages/Contratos"
import PecasProcessuaisPage from "@/pages/PecasProcessuais"
import ClientesPage from "@/pages/Clientes"
import AgendaPage from "@/pages/Agenda"
import ConfiguracoesPage from "@/pages/Configuracoes"
import TenantsPage from "@/pages/Tenants"
import UsersPage from "@/pages/Users"
import ProtectedRoute from "@/components/ProtectedRoute"
import { AuthProvider } from "@/contexts/AuthContext"
import AdminRoute from "@/components/AdminRoute"

class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-50 border border-red-200 rounded text-red-800">
          <h1 className="text-2xl font-bold mb-4">Algo deu errado!</h1>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error && this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Voltar para Login
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <SimpleErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="processos" element={<ProcessosPage />} />
              <Route path="processos/:id" element={<ProcessoDetalhesPage />} />
              <Route path="documentos" element={<DocumentosPage />} />
              <Route path="contratos" element={<ContratosPage />} />
              <Route path="pecas" element={<PecasProcessuaisPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
              {/* Admin Route */}
              <Route path="tenants" element={
                <AdminRoute>
                  <TenantsPage />
                </AdminRoute>
              } />
              <Route path="users" element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              } />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </SimpleErrorBoundary>
  )
}

export default App
