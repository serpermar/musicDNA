import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { router as v1Router } from './routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  app.use('/api/v1', apiLimiter, v1Router);

  return app;
}
