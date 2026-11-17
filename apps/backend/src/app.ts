import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { corsOrigins, env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error';
import { auth } from './lib/auth';
import { router as v1Router } from './routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Solo se activa explícitamente cuando el servicio corre detrás de un proxy de confianza.
  app.set('trust proxy', env.TRUST_PROXY === '1');
  app.use(helmet());
  // Las respuestas de la API contienen datos de sesión: nunca deben ser cacheadas.
  app.use('/api/v1', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  const spotifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  // Better Auth necesita el stream del request intacto: va antes de express.json().
  app.use('/api/v1/auth', authLimiter);
  app.all('/api/v1/auth/*splat', toNodeHandler(auth));
  app.use('/api/v1/spotify', spotifyLimiter);

  // Los cuerpos legítimos son pequeños (respuestas de quiz, ids): 256 KB es suficiente.
  app.use(express.json({ limit: '256kb' }));
  app.use('/api/v1', apiLimiter, v1Router);

  app.use('/api/v1', notFoundHandler);
  app.use(errorHandler);

  if (env.NODE_ENV === 'development') {
    app.get('/', (_req, res) => {
      res.redirect('/api/v1/health');
    });
  }

  return app;
}
