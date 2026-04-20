const API_BASE = import.meta.env.VITE_API_URL;

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {

  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),

  post: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  del: <T>(path: string) =>
    apiRequest<T>(path, { method: "DELETE" }),
};