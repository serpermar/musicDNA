import type { Question, UserResponse } from '@musicdna/shared';

/**
 * Motor del cuestionario.
 * Esta capa es pura: no conoce la base de datos, el API ni Spotify.
 * La lógica de preguntas adaptativas y de sesiones se ampliará en la Fase 3.
 */

export interface QuizProgress {
  answered: number;
  total: number;
  percent: number;
}

export function getProgress(answered: number, total: number): QuizProgress {
  const safeTotal = Math.max(0, total);
  const safeAnswered = Math.min(Math.max(0, answered), safeTotal);
  const percent = safeTotal === 0 ? 0 : Math.round((safeAnswered / safeTotal) * 100);

  return { answered: safeAnswered, total: safeTotal, percent };
}

export function isQuestionAnswered(
  question: Question,
  responses: readonly UserResponse[],
): boolean {
  return responses.some((response) => response.questionId === question.id);
}

export function getNextQuestionIndex(
  questions: readonly Question[],
  responses: readonly UserResponse[],
  currentIndex: number,
): number {
  for (let index = currentIndex + 1; index < questions.length; index += 1) {
    const question = questions[index];
    if (question && !isQuestionAnswered(question, responses)) return index;
  }
  return -1;
}

/** Punto de extensión para reglas adaptativas. Implementar en la Fase 3. */
export function shouldAskQuestion(
  _question: Question,
  _responses: readonly UserResponse[],
): boolean {
  return true;
}
