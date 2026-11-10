const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'docspace_access_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(path, options = {}) {
  const { headers: suppliedHeaders = {}, ...rest } = options;
  const headers = new Headers(suppliedHeaders);
  const token = getStoredToken();

  if (token) headers.set('Authorization', `Bearer ${token}`);

  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;
  if (rest.body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      'Cannot reach the DocSpace API. Check that FastAPI is running and the API URL is correct.',
      0,
      error,
    );
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    const detail = typeof payload === 'object' && payload !== null
      ? payload.detail || payload.message
      : payload;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
      : detail || `Request failed with status ${response.status}`;
    throw new ApiError(String(message), response.status, payload);
  }

  return payload;
}

export const apiBaseUrl = API_BASE_URL;
