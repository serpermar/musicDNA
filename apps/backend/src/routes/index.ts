import { Router } from 'express';
import { getAuthMe } from '../controllers/auth.controller';
import { healthController } from '../controllers/health.controller';
import { requireAuth, resolveSession } from '../middleware/auth';
import { profilesRouter } from './profile.routes';
import { quizzesRouter, quizSessionsRouter } from './quiz.routes';
import {
  comparisonsRouter,
  recommendationsRouter,
  sharesRouter,
  spotifyRouter,
} from './social.routes';
import { usersRouter } from './users.routes';

export const router: Router = Router();

router.get('/health', healthController);

// Perfil mínimo de la sesión; el resto de endpoints de Better Auth se montan en app.ts.
router.get('/auth/me', resolveSession, requireAuth, getAuthMe);
router.use('/users', resolveSession, usersRouter);

// Fase 3: catálogo de quizzes y sesiones de respuesta.
router.use('/quizzes', quizzesRouter);
router.use('/quiz-sessions', quizSessionsRouter);

// Fase 4: perfiles musicales calculados.
router.use('/profiles', profilesRouter);

// Fase 7: recomendaciones, compartir, comparador y estado de Spotify.
router.use('/recommendations', recommendationsRouter);
router.use('/shares', sharesRouter);
router.use('/comparisons', comparisonsRouter);
router.use('/spotify', spotifyRouter);

// Pendiente: /genres y /admin.
