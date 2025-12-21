import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!user || user.role !== 'super_admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
