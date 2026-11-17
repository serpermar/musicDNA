/**
 * Cliente HTTP tipado, compartido por web y móvil.
 * Web usa cookies (credentials: 'include'); móvil usa bearer token.
 */

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  credentials?: RequestCredentials;
  /** Se llama con el token devuelto por Better Auth en la cabecera `set-auth-token`. */
  onToken?: (token: string | null) => void | Promise<void>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/$/, '');

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await options.getToken?.();
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      credentials: options.credentials ?? 'include',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    const payload: unknown = await response.json().catch(() => null);

    const issuedToken = response.headers.get('set-auth-token');
    if (issuedToken && options.onToken) {
      await options.onToken(issuedToken);
    }

    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`, response.status, payload);
    }
    return payload as T;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
  };
}

export { createAuthApi, type AuthApi } from './auth';
export { createQuizApi, type QuizApi } from './quiz';
export { createSocialApi, type SocialApi } from './social';
