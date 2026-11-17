import type { AuthSession } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      authSession?: AuthSession;
    }
  }
}

export {};
