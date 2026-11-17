import { updateUserSchema, uuidSchema } from '@musicdna/shared';
import { Router } from 'express';
import { z } from 'zod';
import {
  deleteCurrentUser,
  getCurrentUser,
  listSessions,
  revokeSession,
  updateCurrentUser,
} from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';

export const usersRouter: Router = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', getCurrentUser);
usersRouter.patch('/me', validateBody(updateUserSchema), updateCurrentUser);
usersRouter.delete('/me', deleteCurrentUser);
usersRouter.get('/me/sessions', listSessions);
usersRouter.delete(
  '/me/sessions/:sessionId',
  validateParams(z.object({ sessionId: uuidSchema })),
  revokeSession,
);
