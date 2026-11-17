import type { CreateComparisonInput, CreateShareInput } from '@musicdna/shared';
import type { RequestHandler } from 'express';
import { socialService } from '../services/social.service';
import {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  frontendRedirect,
  readOAuthState,
} from '../integrations/spotify';
import { asyncHandler } from '../utils/async-handler';
import { currentUserId } from '../utils/current-user';
import { badRequest } from '../utils/http-error';

export const getRecommendations: RequestHandler = asyncHandler(async (req, res) => {
  res.json({ recommendations: await socialService.getRecommendations(currentUserId(req)) });
});

export const getProfileHistory: RequestHandler = asyncHandler(async (req, res) => {
  res.json({ profiles: await socialService.history(currentUserId(req)) });
});

export const createShare: RequestHandler = asyncHandler(async (req, res) => {
  const share = await socialService.createShare(currentUserId(req), req.body as CreateShareInput);
  res.status(201).json({ share, url: `/s/${share.slug}` });
});

export const getSharedProfile: RequestHandler = asyncHandler(async (req, res) => {
  const slug = req.params.slug;
  if (typeof slug !== 'string') throw badRequest('Falta el slug del enlace');
  res.json({ profile: await socialService.getSharedProfile(slug) });
});

export const createComparison: RequestHandler = asyncHandler(async (req, res) => {
  const input = req.body as CreateComparisonInput;
  const comparison = await socialService.compare(currentUserId(req), input.targetProfileId);
  res.status(201).json({ comparison });
});

export const getSpotifyStatus: RequestHandler = asyncHandler(async (req, res) => {
  res.json(await socialService.spotifyStatus(currentUserId(req)));
});

/** Inicia el OAuth: el state firmado identifica al usuario en el callback. */
export const startSpotifyAuth: RequestHandler = (req, res) => {
  res.redirect(buildAuthorizationUrl(currentUserId(req)));
};

/** Callback público de Spotify; valida el state antes de guardar los tokens cifrados. */
export const spotifyCallback: RequestHandler = asyncHandler(async (req, res) => {
  const oauthError = req.query.error;
  if (typeof oauthError === 'string' && oauthError) {
    res.redirect(frontendRedirect('error', 'Autorización cancelada'));
    return;
  }

  const state = req.query.state;
  const code = req.query.code;
  if (typeof state !== 'string' || typeof code !== 'string' || !state || !code) {
    throw badRequest('Faltan parámetros en el callback de Spotify');
  }

  const userId = readOAuthState(state);
  const tokens = await exchangeCodeForTokens(code);
  await socialService.connectSpotify(userId, tokens);
  // Nunca se devuelven tokens: solo un estado al frontend.
  res.redirect(frontendRedirect('connected'));
});

export const disconnectSpotify: RequestHandler = asyncHandler(async (req, res) => {
  await socialService.disconnectSpotify(currentUserId(req));
  res.status(204).end();
});
