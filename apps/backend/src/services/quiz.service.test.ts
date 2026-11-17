import type { Quiz, Question, QuizSession, UserResponse } from '@musicdna/shared';
import { describe, expect, it } from 'vitest';
import { createQuizService, type QuizRepositoryPort } from './quiz.service';

function makeQuiz(): Quiz {
  const questions: Question[] = [
    {
      id: 'q-energy',
      key: 'energy',
      prompt: '¿Cuánta energía?',
      type: 'SCALE',
      category: 'energy',
      weight: 1,
      position: 0,
      options: [],
    },
    {
      id: 'q-genre',
      key: 'genre',
      prompt: '¿Qué género?',
      type: 'SINGLE_CHOICE',
      category: 'genres',
      weight: 1,
      position: 1,
      options: [{ id: 'a-indie', label: 'Indie', value: 'indie', position: 0 }],
    },
    {
      id: 'q-deep',
      key: 'deep',
      prompt: '¿Prefieres directos?',
      type: 'TWO_OPTION',
      category: 'energy',
      weight: 1,
      position: 2,
      isAdaptive: true,
      metadata: { showIf: { questionId: 'q-energy', numericMin: 60 } },
      options: [{ id: 'a-yes', label: 'Sí', value: 'yes', position: 0 }],
    },
  ];

  return { id: 'quiz-1', slug: 'test-quiz', title: 'Quiz de prueba', version: 1, questions };
}

function makeRepository(quiz: Quiz) {
  const sessions = new Map<string, QuizSession>();
  const responses = new Map<string, UserResponse[]>();

  const repository: QuizRepositoryPort = {
    async findActiveQuiz() {
      return quiz;
    },
    async findQuizById(id) {
      return id === quiz.id ? quiz : null;
    },
    async findQuizBySlug(slug) {
      return slug === quiz.slug ? quiz : null;
    },
    async createSession(userId, quizId) {
      const session: QuizSession = {
        id: 'session-1',
        quizId,
        userId,
        status: 'IN_PROGRESS',
        currentQuestionIndex: 0,
        startedAt: new Date().toISOString(),
        completedAt: null,
      };
      sessions.set(session.id, session);
      responses.set(session.id, []);
      return session;
    },
    async findSession(id) {
      return sessions.get(id) ?? null;
    },
    async findResponses(sessionId) {
      return responses.get(sessionId) ?? [];
    },
    async saveResponse(sessionId, response) {
      const list = responses.get(sessionId) ?? [];
      const index = list.findIndex((item) => item.questionId === response.questionId);
      if (index === -1) list.push(response);
      else list[index] = response;
      responses.set(sessionId, list);
      return response;
    },
    async updateProgress(id, currentQuestionIndex) {
      const session = sessions.get(id);
      if (!session) throw new Error('Sesión no encontrada en el fake');
      const updated = { ...session, currentQuestionIndex };
      sessions.set(id, updated);
      return updated;
    },
    async completeSession(id) {
      const session = sessions.get(id);
      if (!session) throw new Error('Sesión no encontrada en el fake');
      const updated: QuizSession = {
        ...session,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      };
      sessions.set(id, updated);
      return updated;
    },
  };

  return { repository, sessions };
}

const USER_ID = 'user-1';

describe('quiz.service', () => {
  it('resuelve el quiz activo y crea una sesión para el usuario', async () => {
    const { repository, sessions } = makeRepository(makeQuiz());
    const service = createQuizService(repository);

    expect(await service.getActiveQuiz()).toMatchObject({ slug: 'test-quiz' });
    const session = await service.createSession(USER_ID, {});

    expect(session).toMatchObject({ userId: USER_ID, quizId: 'quiz-1', currentQuestionIndex: 0 });
    expect(sessions.get('session-1')).toBeDefined();
  });

  it('aplica reglas adaptativas a la vista de la sesión', async () => {
    const { repository } = makeRepository(makeQuiz());
    const service = createQuizService(repository);
    await service.createSession(USER_ID, {});

    await service.submitResponse('session-1', USER_ID, {
      questionId: 'q-energy',
      numericValue: 30,
    });
    const low = await service.getSession('session-1', USER_ID);
    expect(low.view.questions.map((question) => question.id)).toEqual(['q-energy', 'q-genre']);

    await service.updateProgress('session-1', USER_ID, 0);
    await service.submitResponse('session-1', USER_ID, {
      questionId: 'q-energy',
      numericValue: 80,
    });
    const high = await service.getSession('session-1', USER_ID);
    expect(high.view.questions.map((question) => question.id)).toEqual([
      'q-energy',
      'q-genre',
      'q-deep',
    ]);
  });

  it('avanza a la siguiente pregunta tras guardar una respuesta válida', async () => {
    const { repository, sessions } = makeRepository(makeQuiz());
    const service = createQuizService(repository);
    await service.createSession(USER_ID, {});

    const result = await service.submitResponse('session-1', USER_ID, {
      questionId: 'q-energy',
      numericValue: 80,
    });

    expect(result.response).toMatchObject({ questionId: 'q-energy', numericValue: 80 });
    expect(result.nextQuestionIndex).toBe(1);
    expect(result.progress).toEqual({ answered: 1, total: 3, percent: 33 });
    expect(sessions.get('session-1')?.currentQuestionIndex).toBe(1);
  });

  it('rechaza respuestas fuera de turno, inválidas y de otros usuarios', async () => {
    const { repository } = makeRepository(makeQuiz());
    const service = createQuizService(repository);
    await service.createSession(USER_ID, {});

    await expect(
      service.submitResponse('session-1', USER_ID, {
        questionId: 'q-genre',
        answerId: 'a-indie',
      }),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      service.submitResponse('session-1', USER_ID, {
        questionId: 'q-energy',
        numericValue: 140,
      }),
    ).rejects.toMatchObject({ status: 400 });

    await expect(service.getSession('session-1', 'otro-usuario')).rejects.toMatchObject({
      status: 403,
    });
    await expect(service.getSession('sesion-inexistente', USER_ID)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('solo completa el quiz cuando no faltan preguntas visibles', async () => {
    const { repository, sessions } = makeRepository(makeQuiz());
    const service = createQuizService(repository);
    await service.createSession(USER_ID, {});

    await expect(service.completeSession('session-1', USER_ID)).rejects.toMatchObject({
      status: 400,
    });

    await service.submitResponse('session-1', USER_ID, {
      questionId: 'q-energy',
      numericValue: 30,
    });
    await service.submitResponse('session-1', USER_ID, {
      questionId: 'q-genre',
      answerId: 'a-indie',
    });

    const completed = await service.completeSession('session-1', USER_ID);
    expect(completed.session.status).toBe('COMPLETED');
    expect(completed.completion).toEqual({ canComplete: true, missingQuestionIds: [] });
    expect(sessions.get('session-1')?.status).toBe('COMPLETED');

    const again = await service.completeSession('session-1', USER_ID);
    expect(again.session.status).toBe('COMPLETED');
  });
});
