import { getStoredToken, removeStoredToken } from '../utils/storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: any;
}

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: any;

  constructor(message: string, code: string = 'API_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    if (response.status === 401) {
      removeStoredToken();
    }

    const text = await response.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new ApiError(
        response.statusText || 'Unexpected server response format',
        'INVALID_RESPONSE',
        response.status
      );
    }

    if (!response.ok) {
      const code = json?.error?.code || json?.code || 'API_ERROR';
      const message = json?.error?.message || json?.message || json?.error || response.statusText || 'An error occurred';
      throw new ApiError(message, code, response.status, json?.error?.details || json?.details);
    }

    // Support both standardized envelope { success: true, data: ... }
    // and legacy/direct backend payloads { team: ... }, { submission: ... }, etc.
    if (json && typeof json === 'object') {
      if ('data' in json && (json.success === undefined || json.success === true)) {
        return json.data;
      }
      if (json.team) return json.team as T;
      if (json.submission) return json.submission as T;
      if (json.event) return json.event as T;
      if (json.user) return json.user as T;
    }

    return json as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network communication failure', 'NETWORK_ERROR', 0);
  }
}

export const apiClient = {
  get: <T>(url: string, headers?: HeadersInit) => request<T>(url, { method: 'GET', headers }),
  post: <T>(url: string, body?: any, headers?: HeadersInit) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined, headers }),
  patch: <T>(url: string, body?: any, headers?: HeadersInit) =>
    request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, headers }),
  delete: <T>(url: string, headers?: HeadersInit) => request<T>(url, { method: 'DELETE', headers }),
};
