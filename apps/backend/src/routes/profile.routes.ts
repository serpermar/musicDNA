import { createProfileSchema } from '@musicdna/shared';
import { Router } from 'express';
import { getProfileHistory } from '../controllers/social.controller';
import { createProfile, getMyProfile } from '../controllers/profile.controller';
import { requireAuth, resolveSession } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const profilesRouter: Router = Router();

profilesRouter.use(resolveSession, requireAuth);

profilesRouter.post('/', validateBody(createProfileSchema), createProfile);
profilesRouter.get('/me', getMyProfile);
profilesRouter.get('/history', getProfileHistory);
