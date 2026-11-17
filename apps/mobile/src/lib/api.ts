import { createApiClient, createAuthApi, createQuizApi } from '@musicdna/api-client';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'musicdna.auth.token';
const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

let cachedToken: string | null | undefined;

/** Persistencia del bearer token: SecureStore en dispositivo y memoria en web/emulador. */
export const tokenStore = {
  async get(): Promise<string | null> {
    if (cachedToken !== undefined) return cachedToken;
    try {
      cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      cachedToken = null;
    }
    return cachedToken ?? null;
  },

  async set(token: string | null): Promise<void> {
    cachedToken = token;
    try {
      if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // En web no hay SecureStore; el token en memoria basta para la sesión.
    }
  },
};

export const api = createApiClient({
  baseUrl,
  getToken: () => tokenStore.get(),
  onToken: (token) => tokenStore.set(token),
});

export const authApi = createAuthApi(api);
export const quizApi = createQuizApi(api);
