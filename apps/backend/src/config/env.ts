import 'dotenv/config';
import { z } from 'zod';

/**
 * Validación centralizada de variables de entorno.
 * Ningún secreto se expone al frontend.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(4000),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    BETTER_AUTH_URL: z.string().url().default('http://localhost:4000'),

    // En producción la base de datos y el secreto de sesión son obligatorios.
    DATABASE_URL: z.string().url().optional(),
    SESSION_SECRET: z.string().min(32).optional(),

    // Spotify se integra en la Fase 7.
    SPOTIFY_CLIENT_ID: z.string().optional(),
    SPOTIFY_CLIENT_SECRET: z.string().optional(),
    SPOTIFY_REDIRECT_URI: z.string().url().optional(),
    // Cadena vacía equivale a "no configurado" para poder copiar .env.example tal cual.
    SPOTIFY_TOKEN_KEY: z.union([z.string().min(16), z.literal('')]).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') return;

    // Spotify es opcional, pero si se configura debe hacerlo con el juego completo.
    const spotifyConfigured = Boolean(
      value.SPOTIFY_CLIENT_ID?.trim() ||
      value.SPOTIFY_CLIENT_SECRET?.trim() ||
      value.SPOTIFY_REDIRECT_URI?.trim(),
    );
    if (spotifyConfigured) {
      const requiredSpotify: Array<keyof typeof value> = [
        'SPOTIFY_CLIENT_ID',
        'SPOTIFY_CLIENT_SECRET',
        'SPOTIFY_REDIRECT_URI',
        'SPOTIFY_TOKEN_KEY',
      ];
      for (const key of requiredSpotify) {
        if (!value[key] || String(value[key]).trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} es obligatoria cuando se habilita Spotify`,
          });
        }
      }
    }

    if (!value.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL es obligatoria en producción',
      });
    }
    if (!value.SESSION_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message: 'SESSION_SECRET es obligatoria en producción',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida');
}

export const env = parsed.data;

/** Secreto usado por Better Auth. En desarrollo/test hay un valor temporal. */
export const authSecret = env.SESSION_SECRET ?? 'musicdna-dev-only-secret-change-me-1234567890';

/** Clave para cifrar los tokens de Spotify en reposo (AES-256-GCM). */
export const spotifyTokenKey = env.SPOTIFY_TOKEN_KEY || 'musicdna-dev-only-spotify-key-change-me';

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export type Env = typeof env;
