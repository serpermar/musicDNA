import {
  createQuizSessionSchema,
  submitAnswerSchema,
  updateProgressSchema,
  uuidSchema,
} from '@musicdna/shared';
import { Router } from 'express';
import { z } from 'zod';
import {
  completeQuizSession,
  createQuizSession,
  getActiveQuiz,
  getQuizById,
  getQuizSession,
  submitQuizResponse,
  updateQuizProgress,
} from '../controllers/quiz.controller';
import { requireAuth, resolveSession } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';

const quizIdParams = z.object({ quizId: uuidSchema });
const sessionIdParams = z.object({ sessionId: uuidSchema });

/** Catálogo de quizzes: accesible sin autenticación. */
export const quizzesRouter: Router = Router();

quizzesRouter.get('/active', getActiveQuiz);
quizzesRouter.get('/:quizId', validateParams(quizIdParams), getQuizById);

/** Sesiones de quiz: requieren sesión de Better Auth (cookie o bearer). */
export const quizSessionsRouter: Router = Router();

quizSessionsRouter.use(resolveSession, requireAuth);

quizSessionsRouter.post('/', validateBody(createQuizSessionSchema), createQuizSession);
quizSessionsRouter.get('/:sessionId', validateParams(sessionIdParams), getQuizSession);
quizSessionsRouter.patch(
  '/:sessionId/progress',
  validateParams(sessionIdParams),
  validateBody(updateProgressSchema),
  updateQuizProgress,
);
quizSessionsRouter.post(
  '/:sessionId/responses',
  validateParams(sessionIdParams),
  validateBody(submitAnswerSchema),
  submitQuizResponse,
);
quizSessionsRouter.post(
  '/:sessionId/complete',
  validateParams(sessionIdParams),
  completeQuizSession,
);
