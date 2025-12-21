export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    // Se deu 401, token não foi enviado ou expirou
    if (res.status === 401) {
        throw new Error("401 Unauthorized (token ausente ou inválido)");
    }

    return res;
}
