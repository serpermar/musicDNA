import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

export const router: Router = Router();

router.get('/health', healthController);

// Fase 2: /auth, /users
// Fase 3: /quizzes, /questions, /responses
// Fase 4: /profiles, /genres, /recommendations
// Fase 7: /spotify, /comparisons, /history, /admin
