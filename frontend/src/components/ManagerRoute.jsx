import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ManagerRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!user || !['super_admin', 'admin_global', 'tenant_admin'].includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
