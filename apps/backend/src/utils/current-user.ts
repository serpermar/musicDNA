import type { Request } from 'express';
import { unauthorized } from './http-error';

/** ID del usuario autenticado por los middlewares de Better Auth. */
export function currentUserId(request: Request): string {
  const userId = request.authSession?.user?.id;
  if (!userId) throw unauthorized();
  return userId;
}
