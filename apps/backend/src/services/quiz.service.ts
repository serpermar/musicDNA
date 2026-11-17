import {
  canCompleteQuiz,
  getNextQuestionIndex,
  getQuizView,
  isSessionOpen,
  validateResponse,
  type QuizProgress,
} from '@musicdna/quiz-engine';
import type { Quiz, QuizSession, UserResponse } from '@musicdna/shared';
import { quizRepository } from '../repositories/quiz.repository';
import { badRequest, forbidden, notFound } from '../utils/http-error';

/** Contrato mínimo que el servicio necesita del repositorio (Fase 3). */
export interface QuizRepositoryPort {
  findActiveQuiz(): Promise<Quiz | null>;
  findQuizById(id: string): Promise<Quiz | null>;
  findQuizBySlug(slug: string): Promise<Quiz | null>;
  createSession(userId: string, quizId: string): Promise<QuizSession>;
  findSession(id: string): Promise<QuizSession | null>;
  findResponses(sessionId: string): Promise<UserResponse[]>;
  saveResponse(sessionId: string, response: UserResponse): Promise<UserResponse>;
  updateProgress(id: string, currentQuestionIndex: number): Promise<QuizSession>;
  completeSession(id: string): Promise<QuizSession>;
}

export interface CreateSessionInput {
  quizId?: string;
  slug?: string;
}

export interface QuizSessionDetail {
  session: QuizSession;
  quiz: Quiz;
  view: ReturnType<typeof getQuizView>;
  responses: UserResponse[];
}

export type QuizService = ReturnType<typeof createQuizService>;

export function createQuizService(repository: QuizRepositoryPort) {
  async function requireQuiz(quizId: string): Promise<Quiz> {
    const quiz = await repository.findQuizById(quizId);
    if (!quiz) throw notFound('Quiz no encontrado');
    return quiz;
  }

  async function resolveQuiz(input: CreateSessionInput): Promise<Quiz> {
    const quiz = input.quizId
      ? await repository.findQuizById(input.quizId)
      : input.slug
        ? await repository.findQuizBySlug(input.slug)
        : await repository.findActiveQuiz();

    if (!quiz) throw notFound('Quiz no encontrado');
    return quiz;
  }

  async function requireSession(sessionId: string, userId: string): Promise<QuizSession> {
    const session = await repository.findSession(sessionId);
    if (!session) throw notFound('Sesión de quiz no encontrada');
    if (session.userId !== userId) throw forbidden('No tienes acceso a esta sesión');
    return session;
  }

  function requireOpenSession(session: QuizSession): void {
    if (session.status === 'COMPLETED' || session.status === 'ABANDONED') {
      throw badRequest('La sesión de quiz ya está cerrada');
    }
  }

  async function getActiveQuiz(): Promise<Quiz | null> {
    return repository.findActiveQuiz();
  }

  async function getQuizById(quizId: string): Promise<Quiz> {
    return requireQuiz(quizId);
  }

  async function createSession(userId: string, input: CreateSessionInput): Promise<QuizSession> {
    const quiz = await resolveQuiz(input);
    return repository.createSession(userId, quiz.id);
  }

  async function getSession(sessionId: string, userId: string): Promise<QuizSessionDetail> {
    const session = await requireSession(sessionId, userId);
    const quiz = await requireQuiz(session.quizId);
    const responses = await repository.findResponses(sessionId);

    return { session, quiz, view: getQuizView(quiz, responses), responses };
  }

  async function updateProgress(
    sessionId: string,
    userId: string,
    currentQuestionIndex: number,
  ): Promise<QuizProgress> {
    const session = await requireSession(sessionId, userId);
    requireOpenSession(session);

    const quiz = await requireQuiz(session.quizId);
    const responses = await repository.findResponses(sessionId);
    const view = getQuizView(quiz, responses);
    const target = view.questions[currentQuestionIndex];

    if (!target) {
      throw badRequest('Índice de pregunta fuera de rango');
    }

    await repository.updateProgress(sessionId, currentQuestionIndex);
    return view.progress;
  }

  async function submitResponse(
    sessionId: string,
    userId: string,
    response: UserResponse,
  ): Promise<{
    response: UserResponse;
    progress: QuizProgress;
    nextQuestionIndex: number;
  }> {
    const session = await requireSession(sessionId, userId);
    requireOpenSession(session);

    const quiz = await requireQuiz(session.quizId);
    const responses = await repository.findResponses(sessionId);
    const view = getQuizView(quiz, responses);
    const current = view.questions[session.currentQuestionIndex];

    if (!current) {
      throw badRequest('No hay preguntas pendientes en esta sesión');
    }
    if (response.questionId !== current.id) {
      throw badRequest('No es el turno de esta pregunta');
    }

    const validation = validateResponse(current, response);
    if (!validation.valid) {
      throw badRequest(validation.reason ?? 'Respuesta inválida');
    }

    const saved = await repository.saveResponse(sessionId, response);
    const nextResponses = await repository.findResponses(sessionId);
    const nextView = getQuizView(quiz, nextResponses);
    const nextQuestionIndex = getNextQuestionIndex(
      nextView.questions,
      nextResponses,
      session.currentQuestionIndex,
    );

    await repository.updateProgress(sessionId, Math.max(0, nextQuestionIndex));

    return { response: saved, progress: nextView.progress, nextQuestionIndex };
  }

  async function completeSession(
    sessionId: string,
    userId: string,
  ): Promise<{ session: QuizSession; completion: ReturnType<typeof canCompleteQuiz> }> {
    const session = await requireSession(sessionId, userId);

    if (session.status === 'COMPLETED') {
      return { session, completion: { canComplete: true, missingQuestionIds: [] } };
    }
    if (session.status === 'ABANDONED') {
      throw badRequest('La sesión de quiz ya está cerrada');
    }

    const quiz = await requireQuiz(session.quizId);
    const responses = await repository.findResponses(sessionId);
    const completion = canCompleteQuiz(quiz, responses);

    if (!completion.canComplete) {
      throw badRequest('Faltan preguntas por responder', completion.missingQuestionIds);
    }

    const completed = await repository.completeSession(sessionId);
    return { session: completed, completion };
  }

  return {
    getActiveQuiz,
    getQuizById,
    createSession,
    getSession,
    updateProgress,
    submitResponse,
    completeSession,
  };
}

/** Instancia usada por los controladores; el repositorio se inyecta en los tests. */
export const quizService = createQuizService(quizRepository);
