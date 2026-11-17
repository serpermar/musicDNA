import 'dotenv/config';
import { z } from 'zod';

/**
 * Validación centralizada de variables de entorno.
 * Ningún secreto se expone al frontend.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // La base de datos se usa a partir de la Fase 2.
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(16).optional(),

  // Spotify se integra en la Fase 7.
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REDIRECT_URI: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida');
}

export const env = parsed.data;
export type Env = typeof env;
