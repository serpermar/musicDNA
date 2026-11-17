import type { RequestHandler } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/async-handler';

/** Perfil mínimo de la sesión actual; los endpoints de Better Auth están montados por app.ts. */
export const getAuthMe: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.getSessionUser(req);
  res.json({ user });
});
