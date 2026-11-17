import { Router } from 'express';
import { getAuthMe } from '../controllers/auth.controller';
import { healthController } from '../controllers/health.controller';
import { requireAuth, resolveSession } from '../middleware/auth';
import { usersRouter } from './users.routes';

export const router: Router = Router();

router.get('/health', healthController);

// Perfil mínimo de la sesión; el resto de endpoints de Better Auth se montan en app.ts.
router.get('/auth/me', resolveSession, requireAuth, getAuthMe);
router.use('/users', resolveSession, usersRouter);

// Fase 3: /quizzes, /questions, /responses
// Fase 4: /profiles, /genres, /recommendations
// Fase 7: /spotify, /comparisons, /history, /admin
