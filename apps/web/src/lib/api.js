
const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

export async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const requestOptions = {
        ...options,
        headers,
        credentials: "include",
    };

    const isFormData =
        typeof FormData !== "undefined" &&
        options.body instanceof FormData;

    if (
        options.body != null &&
        !isFormData &&
        typeof options.body !== "string"
    ) {
        headers.set("Content-Type", "application/json");
        requestOptions.body = JSON.stringify(options.body);
    }

    const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

    let response;

    try {
        response = await fetch(url, requestOptions);
    } catch {
        throw new ApiError(
            "Unable to connect to the server. Check your connection and try again.",
            0
        );
    }

    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (response.status !== 204) {
        if (contentType.includes("application/json")) {
            data = await response.json().catch(() => null);
        } else {
            const text = await response.text().catch(() => "");
            data = text ? { message: text } : null;
        }
    }

    if (!response.ok) {
        if (
            response.status === 401 &&
            !/\/auth\/(login|register)\/?$/.test(path)
        ) {
            window.dispatchEvent(new Event("teamflow:unauthorized"));
        }
        throw new ApiError(
            data?.message || `Request failed with status ${response.status}.`,
            response.status,
            data
        );
    }

    return data;
}