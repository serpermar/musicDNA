import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { z } from 'zod';
import { authSecret, corsOrigins, env, spotifyTokenKey } from '../config/env';
import { badRequest, HttpError } from '../utils/http-error';

/**
 * Integración opcional con Spotify.
 * Los tokens se cifran en reposo y nunca se devuelven al frontend.
 */

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const PROFILE_URL = 'https://api.spotify.com/v1/me';
const SCOPES = 'user-top-read user-library-read playlist-read-private';
const STATE_TTL_MS = 10 * 60 * 1000;
const CIPHER_VERSION = 'v1';

interface OAuthState {
  userId: string;
  expiresAt: number;
  nonce: string;
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  scope: string | null;
  spotifyUserId: string | null;
  expiresAt: Date;
}

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  scope: z.string().optional(),
});

const profileResponseSchema = z.object({ id: z.string().min(1) });

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value).toString('base64url');
}

function signState(payload: string): string {
  return createHmac('sha256', authSecret).update(payload).digest('base64url');
}

/** State firmado y con caducidad: vincula el callback al usuario que inició el flujo. */
export function createOAuthState(userId: string, now = Date.now()): string {
  const payload: OAuthState = {
    userId,
    expiresAt: now + STATE_TTL_MS,
    nonce: randomBytes(16).toString('base64url'),
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  return `${encoded}.${signState(encoded)}`;
}

/** Devuelve el userId del state o lanza un error si está manipulado o caducado. */
export function readOAuthState(state: string, now = Date.now()): string {
  const [encoded, signature, ...rest] = state.split('.');
  if (!encoded || !signature || rest.length > 0)
    throw badRequest('El state de Spotify no es válido');

  const expected = Buffer.from(signState(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw badRequest('El state de Spotify no es válido');
  }

  let payload: OAuthState;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthState;
  } catch {
    throw badRequest('El state de Spotify no es válido');
  }
  if (
    typeof payload.userId !== 'string' ||
    !payload.userId ||
    typeof payload.expiresAt !== 'number' ||
    !Number.isFinite(payload.expiresAt) ||
    payload.expiresAt <= now
  ) {
    throw badRequest('El state de Spotify ha caducado');
  }

  return payload.userId;
}

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function spotifyConfig(): SpotifyConfig {
  const { SPOTIFY_CLIENT_ID: clientId, SPOTIFY_CLIENT_SECRET: clientSecret } = env;
  const redirectUri = env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new HttpError('Spotify no está configurado en este servidor', 503, 'SPOTIFY_UNAVAILABLE');
  }
  return { clientId, clientSecret, redirectUri };
}

/** URL de autorización de Spotify, con state firmado. */
export function buildAuthorizationUrl(
  userId: string,
  config: SpotifyConfig = spotifyConfig(),
): string {
  const { clientId, redirectUri } = config;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state: createOAuthState(userId),
    show_dialog: 'true',
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function deriveKey(): Buffer {
  return createHash('sha256').update(spotifyTokenKey).digest();
}

/** Cifra un token con AES-256-GCM; cada llamada usa un IV distinto. */
export function encryptToken(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [
    CIPHER_VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

/** Descifra un token generado por encryptToken (útil para tareas de importación). */
export function decryptToken(payload: string): string {
  const [version, ivPart, tagPart, dataPart, ...rest] = payload.split(':');
  if (version !== CIPHER_VERSION || !ivPart || !tagPart || !dataPart || rest.length > 0) {
    throw badRequest('El token cifrado de Spotify no es válido');
  }
  try {
    const decipher = createDecipheriv('aes-256-gcm', deriveKey(), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw badRequest('El token cifrado de Spotify no es válido');
  }
}

/** Intercambia el código de autorización por tokens de Spotify. */
export async function exchangeCodeForTokens(
  code: string,
  config: SpotifyConfig = spotifyConfig(),
): Promise<SpotifyTokens> {
  const { clientId, clientSecret, redirectUri } = config;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!response.ok) throw badRequest('Spotify rechazó el código de autorización');

  const parsed = tokenResponseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw badRequest('Spotify devolvió unos tokens inválidos');

  return {
    accessToken: parsed.data.access_token,
    refreshToken: parsed.data.refresh_token,
    scope: parsed.data.scope ?? null,
    spotifyUserId: await fetchSpotifyUserId(parsed.data.access_token),
    expiresAt: new Date(Date.now() + parsed.data.expires_in * 1000),
  };
}

async function fetchSpotifyUserId(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(PROFILE_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const parsed = profileResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data.id : null;
  } catch {
    return null;
  }
}

/** Destino del navegador tras el callback; solo orígenes permitidos por CORS. */
export function frontendRedirect(status: 'connected' | 'error', reason?: string): string {
  const target = new URL(corsOrigins[0] ?? 'http://localhost:5173');
  target.searchParams.set('spotify', status);
  if (reason) target.searchParams.set('reason', reason);
  return target.toString();
}
