export const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api/v1`;

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

export const documents = {
    list: () => apiFetch("/documents/"),
    upload: (formData) => apiFetch("/documents/", {
        method: "POST",
        body: formData,
    }),
    delete: (id) => apiFetch(`/documents/${id}`, { method: "DELETE" }),
    download: (id) => apiFetch(`/documents/${id}/content`).then(res => {
        if (!res.ok) throw new Error("Failed to download");
        return res.blob();
    }),
};

export const tenants = {
    list: () => apiFetch("/tenants/"),
};

export const clients = {
    list: (query) => apiFetch(`/clients/${query ? `?q=${query}` : ""}`),
    create: (data) => apiFetch("/clients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }),
    update: (id, data) => apiFetch(`/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`/clients/${id}`, { method: "DELETE" }),
};

export const cases = {
    list: () => apiFetch('/cases/'),
    get: (id) => apiFetch(`/cases/${id}`),
    listByClient: (clientId) => apiFetch(`/clients/${clientId}/cases`),
    createForClient: (clientId, data) => apiFetch(`/clients/${clientId}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }),
    updateStatus: (id, status) => apiFetch(`/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    }),
    update: (id, data) => apiFetch(`/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }),
    delete: (id) => apiFetch(`/cases/${id}`, { method: "DELETE" }),
    createFromDataJud: (data) => apiFetch("/cases/from-datajud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }),
    tribunals: () => apiFetch("/cases/tribunals"),
};

export const contracts = {
    listAll: () => apiFetch('/contracts/'),
    listByClient: (clientId) => apiFetch(`/contracts/clients/${clientId}/contracts`),
    upload: (clientId, formData) => apiFetch(`/contracts/clients/${clientId}/contracts`, {
        method: "POST",
        body: formData,
    }),
    updateAccepted: (id, accepted) => apiFetch(`/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted })
    }),
    download: (id) => apiFetch(`/contracts/${id}/download`).then(res => {
        if (!res.ok) throw new Error("Failed to download");
        return res.blob();
    }),
    delete: (id) => apiFetch(`/contracts/${id}`, { method: "DELETE" }),
    viewUrl: (id) => `${API_URL}/contracts/${id}/view`, // Keep for ref, but use preview() for blob
    preview: async (id) => {
        const res = await apiFetch(`/contracts/${id}/view`)
        if (!res.ok) throw new Error('Falha ao carregar preview')
        const blob = await res.blob()
        return window.URL.createObjectURL(blob)
    }
};

export const pieces = {
    list: (caseId, clientId) => {
        const params = new URLSearchParams();
        if (caseId) params.append("case_id", caseId);
        if (clientId) params.append("client_id", clientId);
        return apiFetch(`/pieces/?${params.toString()}`);
    },
    upload: (formData) => apiFetch("/pieces/", {
        method: "POST",
        body: formData,
    }),
    delete: (id) => apiFetch(`/pieces/${id}`, { method: "DELETE" }),
    download: (id) => apiFetch(`/pieces/${id}/download`).then(res => {
        if (!res.ok) throw new Error("Failed to download");
        return res.blob();
    }),
    viewUrl: (id) => `${API_URL}/pieces/${id}/view`, // Direct URL for iframe/new tab
    preview: async (id) => {
        const res = await apiFetch(`/pieces/${id}/view`)
        if (!res.ok) throw new Error('Falha ao carregar preview')
        const blob = await res.blob()
        return window.URL.createObjectURL(blob)
    }
};

export const search = {
    query: (q) => apiFetch(`/search/?q=${encodeURIComponent(q)}`),
};
