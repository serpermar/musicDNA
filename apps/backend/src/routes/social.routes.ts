import { createComparisonSchema, createShareSchema } from '@musicdna/shared';
import { Router } from 'express';
import { z } from 'zod';
import {
  createComparison,
  createShare,
  disconnectSpotify,
  getRecommendations,
  getSharedProfile,
  getSpotifyStatus,
  spotifyCallback,
  startSpotifyAuth,
} from '../controllers/social.controller';
import { requireAuth, resolveSession } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';

const slugParams = z.object({ slug: z.string().min(1).max(64) });

/** Creación de enlaces requiere sesión; consultar un enlace es público. */
export const sharesRouter: Router = Router();
sharesRouter.get('/:slug', validateParams(slugParams), getSharedProfile);
sharesRouter.post('/', resolveSession, requireAuth, validateBody(createShareSchema), createShare);

export const comparisonsRouter: Router = Router();
comparisonsRouter.use(resolveSession, requireAuth);
comparisonsRouter.post('/', validateBody(createComparisonSchema), createComparison);

/** El callback es público (viene de Spotify); el resto requiere sesión. */
export const spotifyRouter: Router = Router();
spotifyRouter.get('/auth', resolveSession, requireAuth, startSpotifyAuth);
spotifyRouter.get('/callback', spotifyCallback);
spotifyRouter.post('/disconnect', resolveSession, requireAuth, disconnectSpotify);
spotifyRouter.get('/status', resolveSession, requireAuth, getSpotifyStatus);

export const recommendationsRouter: Router = Router();
recommendationsRouter.use(resolveSession, requireAuth);
recommendationsRouter.get('/me', getRecommendations);
