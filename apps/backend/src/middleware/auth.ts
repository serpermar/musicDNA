import { fromNodeHeaders } from 'better-auth/node';
import type { RequestHandler } from 'express';
import { auth } from '../lib/auth';
import { unauthorized } from '../utils/http-error';

/** Resuelve la sesión (cookie o bearer token) y la adjunta a la request. */
export const resolveSession: RequestHandler = async (req, _res, next) => {
  try {
    req.authSession = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.authSession?.session || !req.authSession.user) {
    next(unauthorized());
    return;
  }
  next();
};
