const TOKEN_KEY = 'yaosgmail_token';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to store token in localStorage', e);
  }
};

export const removeStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Failed to remove token from localStorage', e);
  }
};

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; message?: string; status?: number }> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = endpoint.startsWith('/api')
      ? endpoint
      : endpoint.startsWith('/')
      ? `/api${endpoint}`
      : `/api/${endpoint}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await res.json().catch(() => ({
      success: false,
      message: 'Terjadi kendala jaringan atau server. Silakan coba lagi.',
    }));

    if (!res.ok || !json.success) {
      return {
        data: null,
        error: json.message || 'Terjadi kendala jaringan atau server. Silakan coba lagi.',
        status: res.status,
      };
    }

    return {
      data: json.data !== undefined ? json.data : (json as unknown as T),
      error: null,
      message: json.message,
      status: res.status,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Terjadi kendala jaringan atau server. Silakan coba lagi.',
      status: 0,
    };
  }
}

export const api = {
  get: <T = any>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
};
