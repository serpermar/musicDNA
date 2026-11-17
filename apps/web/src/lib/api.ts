import { createApiClient, createAuthApi, createQuizApi } from '@musicdna/api-client';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const api = createApiClient({
  baseUrl,
  credentials: 'include',
});

export const authApi = createAuthApi(api);
export const quizApi = createQuizApi(api);
