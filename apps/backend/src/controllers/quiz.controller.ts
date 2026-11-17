import type { SubmitAnswerInput } from '@musicdna/shared';
import type { Request, RequestHandler } from 'express';
import { quizService } from '../services/quiz.service';
import { asyncHandler } from '../utils/async-handler';
import { badRequest, unauthorized } from '../utils/http-error';

function currentUserId(request: Request): string {
  const userId = request.authSession?.user?.id;
  if (!userId) throw unauthorized();
  return userId;
}

function param(request: { params: Record<string, string | string[]> }, name: string): string {
  const value = request.params[name];
  if (typeof value !== 'string') throw badRequest(`Falta el parámetro ${name}`);
  return value;
}

export const getActiveQuiz: RequestHandler = asyncHandler(async (_req, res) => {
  res.json({ quiz: await quizService.getActiveQuiz() });
});

export const getQuizById: RequestHandler = asyncHandler(async (req, res) => {
  res.json({ quiz: await quizService.getQuizById(param(req, 'quizId')) });
});

export const createQuizSession: RequestHandler = asyncHandler(async (req, res) => {
  const session = await quizService.createSession(currentUserId(req), req.body);
  res.status(201).json({ session });
});

export const getQuizSession: RequestHandler = asyncHandler(async (req, res) => {
  res.json(await quizService.getSession(param(req, 'sessionId'), currentUserId(req)));
});

export const updateQuizProgress: RequestHandler = asyncHandler(async (req, res) => {
  const progress = await quizService.updateProgress(
    param(req, 'sessionId'),
    currentUserId(req),
    req.body.currentQuestionIndex as number,
  );
  res.json({ progress });
});

export const submitQuizResponse: RequestHandler = asyncHandler(async (req, res) => {
  const input = req.body as SubmitAnswerInput;
  const sessionId = param(req, 'sessionId');

  if (input.sessionId !== sessionId) {
    throw badRequest('El sessionId del cuerpo no coincide con la ruta');
  }

  res.json(await quizService.submitResponse(sessionId, currentUserId(req), input.response));
});

export const completeQuizSession: RequestHandler = asyncHandler(async (req, res) => {
  res.json(await quizService.completeSession(param(req, 'sessionId'), currentUserId(req)));
});
