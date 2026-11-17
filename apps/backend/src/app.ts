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
  app.use(helmet());
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

  // Better Auth necesita el stream del request intacto: va antes de express.json().
  app.use('/api/v1/auth', authLimiter);
  app.all('/api/v1/auth/*splat', toNodeHandler(auth));

  app.use(express.json({ limit: '1mb' }));
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
