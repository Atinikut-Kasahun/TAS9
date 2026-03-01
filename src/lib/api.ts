export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8081/api";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const headers: Record<string, string> = {
        "Accept": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };

    // Only set Content-Type for JSON body – not for FormData
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    // Merge caller-provided headers
    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    // Robust URL construction
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    let response: Response;
    try {
        response = await fetch(`${baseUrl}${cleanEndpoint}`, {
            ...options,
            headers,
        });
    } catch (networkError) {
        // Backend unreachable – throw a clean, user-friendly error
        throw new Error("Unable to connect to the server. Please make sure the backend is running.");
    }

    if (!response.ok) {
        let errorMessage = `Server error ${response.status}`;
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorMessage;
        } catch { /* body not JSON */ }
        throw new Error(errorMessage);
    }

    // Some endpoints return 204 No Content
    const contentType = response.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) {
        return null;
    }

    return response.json();
}

export const auth = {
    login: (credentials: any) => apiFetch("/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    }),
    logout: () => apiFetch("/logout", { method: "POST" }),
    me: () => apiFetch("/user"),
};
