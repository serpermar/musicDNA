import type { RequestHandler } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/async-handler';

export const getCurrentUser: RequestHandler = asyncHandler(async (req, res) => {
  res.json(await userService.getCurrent(req));
});

export const updateCurrentUser: RequestHandler = asyncHandler(async (req, res) => {
  res.json(await userService.update(req, req.body));
});

export const listSessions: RequestHandler = asyncHandler(async (req, res) => {
  res.json({ sessions: await userService.listSessions(req) });
});

export const revokeSession: RequestHandler = asyncHandler(async (req, res) => {
  await userService.revokeSession(req, req.params.sessionId as string);
  res.status(204).end();
});

export const deleteCurrentUser: RequestHandler = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req);
  res.status(204).end();
});
