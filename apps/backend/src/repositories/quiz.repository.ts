import type {
  Question,
  QuestionType,
  Quiz,
  QuizSession,
  QuizSessionStatus,
  UserResponse,
} from '@musicdna/shared';
import { prisma } from '../lib/prisma';

type QuizRow = NonNullable<Awaited<ReturnType<typeof loadQuiz>>>;

async function loadQuiz(where: { id?: string; slug?: string; isActive?: boolean }) {
  return prisma.quiz.findFirst({
    where,
    orderBy: [{ version: 'desc' }],
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { position: 'asc' },
        include: {
          answers: { where: { isActive: true }, orderBy: { position: 'asc' } },
        },
      },
    },
  });
}

function mapQuestion(row: QuizRow['questions'][number]): Question {
  return {
    id: row.id,
    key: row.key,
    prompt: row.prompt,
    helpText: row.helpText,
    type: row.type as QuestionType,
    category: row.category,
    weight: Number(row.weight),
    position: row.position,
    isAdaptive: row.isAdaptive,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    options: row.answers.map((answer) => ({
      id: answer.id,
      label: answer.label,
      value: answer.value,
      position: answer.position,
      scores: answer.scores as Record<string, unknown>,
    })),
  };
}

function mapQuiz(row: QuizRow): Quiz {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    version: row.version,
    questions: row.questions.map(mapQuestion),
  };
}

type SessionRow = NonNullable<Awaited<ReturnType<typeof prisma.quizSession.findUnique>>>;

function mapSession(row: SessionRow): QuizSession {
  return {
    id: row.id,
    quizId: row.quizId,
    userId: row.userId,
    status: row.status as QuizSessionStatus,
    currentQuestionIndex: row.currentQuestionIndex,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

type ResponseRow = Awaited<ReturnType<typeof prisma.userResponse.findMany>>[number];

function mapResponse(row: ResponseRow): UserResponse {
  return {
    questionId: row.questionId,
    ...(row.answerId ? { answerId: row.answerId } : {}),
    ...(row.answerIds.length > 0 ? { answerIds: row.answerIds } : {}),
    ...(row.numericValue !== null ? { numericValue: Number(row.numericValue) } : {}),
    ...(row.textValue ? { textValue: row.textValue } : {}),
  };
}

export const quizRepository = {
  findActiveQuiz() {
    return loadQuiz({ isActive: true }).then((row) => (row ? mapQuiz(row) : null));
  },

  findQuizById(id: string) {
    return loadQuiz({ id }).then((row) => (row ? mapQuiz(row) : null));
  },

  findQuizBySlug(slug: string) {
    return loadQuiz({ slug, isActive: true }).then((row) => (row ? mapQuiz(row) : null));
  },

  async createSession(userId: string, quizId: string) {
    const row = await prisma.quizSession.create({
      data: { userId, quizId, status: 'IN_PROGRESS', currentQuestionIndex: 0 },
    });
    return mapSession(row);
  },

  async findSession(id: string) {
    const row = await prisma.quizSession.findUnique({ where: { id } });
    return row ? mapSession(row) : null;
  },

  async findResponses(sessionId: string) {
    const rows = await prisma.userResponse.findMany({
      where: { quizSessionId: sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapResponse);
  },

  async saveResponse(sessionId: string, response: UserResponse) {
    await prisma.userResponse.upsert({
      where: {
        quizSessionId_questionId: { quizSessionId: sessionId, questionId: response.questionId },
      },
      create: {
        quizSessionId: sessionId,
        questionId: response.questionId,
        answerId: response.answerId ?? null,
        answerIds: response.answerIds ?? [],
        numericValue: response.numericValue ?? null,
        textValue: response.textValue ?? null,
      },
      update: {
        answerId: response.answerId ?? null,
        answerIds: response.answerIds ?? [],
        numericValue: response.numericValue ?? null,
        textValue: response.textValue ?? null,
      },
    });
    return response;
  },

  async updateProgress(id: string, currentQuestionIndex: number) {
    const row = await prisma.quizSession.update({
      where: { id },
      data: { currentQuestionIndex },
    });
    return mapSession(row);
  },

  async completeSession(id: string) {
    const row = await prisma.quizSession.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    return mapSession(row);
  },
};
