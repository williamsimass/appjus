import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    const SESSION_DURATION = 3600 * 1000; // 1 hour

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    const checkSessionTimeout = () => {
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime && (Date.now() - parseInt(loginTime) > SESSION_DURATION)) {
            console.warn("Sessão expirada. Deslogando...");
            logout();
        }
    };

    const fetchMe = async (currentToken) => {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                console.log("AuthContext: fetchMe user data:", userData); // DEBUG
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
            } else {
                if (response.status === 401) {
                    console.warn("Token inválido (401). Deslogando...");
                    logout();
                } else {
                    console.error("Erro ao buscar usuário:", response.status);
                    // Do not logout on 500 or other errors, keep session alive
                }
            }
        } catch (error) {
            console.error("Erro de rede ao buscar usuário:", error);
            // Do not logout on network error
        } finally {
            setLoading(false);
        }
    };

    const login = (newToken, userData = null) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('loginTime', Date.now().toString());
        setToken(newToken);

        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        }

        navigate('/dashboard');
    };

    useEffect(() => {
        checkSessionTimeout();
        const interval = setInterval(checkSessionTimeout, 60000); // Check every minute

        if (token) {
            fetchMe(token);
        } else {
            setLoading(false);
        }

        return () => clearInterval(interval);
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
