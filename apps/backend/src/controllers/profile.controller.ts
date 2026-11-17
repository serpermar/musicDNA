import type { CreateProfileInput } from '@musicdna/shared';
import type { RequestHandler } from 'express';
import { profileService } from '../services/profile.service';
import { asyncHandler } from '../utils/async-handler';
import { currentUserId } from '../utils/current-user';

export const createProfile: RequestHandler = asyncHandler(async (req, res) => {
  const input = req.body as CreateProfileInput;
  const profile = await profileService.generate(currentUserId(req), input.sessionId);
  res.status(201).json({ profile });
});

export const getMyProfile: RequestHandler = asyncHandler(async (req, res) => {
  res.json({ profile: await profileService.getLatest(currentUserId(req)) });
});
