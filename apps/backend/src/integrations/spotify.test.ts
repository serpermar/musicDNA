import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAuthorizationUrl,
  createOAuthState,
  decryptToken,
  encryptToken,
  exchangeCodeForTokens,
  frontendRedirect,
  readOAuthState,
  type SpotifyConfig,
} from './spotify';

const config: SpotifyConfig = {
  clientId: 'cliente-de-prueba',
  clientSecret: 'secreto-de-prueba',
  redirectUri: 'http://localhost:4000/api/v1/spotify/callback',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('spotify · state OAuth', () => {
  it('vincula el callback al usuario que inició el flujo', () => {
    const now = 1_700_000_000_000;
    const state = createOAuthState('user-1', now);

    expect(readOAuthState(state, now + 1_000)).toBe('user-1');
    expect(() => readOAuthState(state, now + 11 * 60 * 1000)).toThrow(/caducado/);
    expect(() => readOAuthState('manipulado.invalido', now)).toThrow(/no es válido/);
  });

  it('genera estados distintos para la misma sesión', () => {
    expect(createOAuthState('user-1')).not.toBe(createOAuthState('user-1'));
  });
});

describe('spotify · cifrado de tokens', () => {
  it('cifra y descifra sin dejar el token en claro', () => {
    const encrypted = encryptToken('token-super-secreto');

    expect(encrypted.startsWith('v1:')).toBe(true);
    expect(encrypted).not.toContain('token-super-secreto');
    expect(decryptToken(encrypted)).toBe('token-super-secreto');
  });

  it('usa un IV distinto en cada cifrado y rechaza alteraciones', () => {
    expect(encryptToken('mismo-token')).not.toBe(encryptToken('mismo-token'));
    expect(() => decryptToken('v1:xxx:yyy:zzz')).toThrow(/no es válido/);
  });
});

describe('spotify · flujo OAuth', () => {
  it('construye una URL de autorización con el state firmado', () => {
    const url = new URL(buildAuthorizationUrl('user-1', config));

    expect(url.origin).toBe('https://accounts.spotify.com');
    expect(url.searchParams.get('client_id')).toBe(config.clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(config.redirectUri);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(readOAuthState(url.searchParams.get('state') ?? '')).toBe('user-1');
  });

  it('intercambia el código y obtiene el identificador de Spotify', async () => {
    const fetchMock = vi.fn(async (input: unknown) => {
      if (String(input).includes('/api/token')) {
        return jsonResponse({
          access_token: 'access-123',
          refresh_token: 'refresh-123',
          expires_in: 3600,
          scope: 'user-top-read',
        });
      }
      return jsonResponse({ id: 'spotify-123' });
    });
    vi.stubGlobal('fetch', fetchMock);

    const tokens = await exchangeCodeForTokens('code-123', config);

    expect(tokens).toMatchObject({
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      scope: 'user-top-read',
      spotifyUserId: 'spotify-123',
    });
    expect(tokens.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rechaza respuestas inválidas de Spotify', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'invalid_grant' }, 400)),
    );
    await expect(exchangeCodeForTokens('code-invalido', config)).rejects.toMatchObject({
      status: 400,
    });
  });

  it('redirige al frontend con un estado que nunca incluye tokens', () => {
    const redirect = new URL(frontendRedirect('connected', 'extra'));
    expect(redirect.searchParams.get('spotify')).toBe('connected');
    expect(redirect.searchParams.get('reason')).toBe('extra');
    expect(redirect.toString()).not.toContain('access_token');
  });
});
