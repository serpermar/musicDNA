import type { Question, Quiz, QuizSession, UserResponse } from '@musicdna/shared';
import { getNextQuestionIndex, getProgress, isQuestionAnswered } from './progress';

export * from './progress';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const valid = (): ValidationResult => ({ valid: true });
const invalid = (reason: string): ValidationResult => ({ valid: false, reason });

function answerExists(question: Question, answerId: string): boolean {
  return question.options.some((option) => option.id === answerId);
}

/**
 * Valida una respuesta contra el tipo de pregunta.
 * Es pura: no consulta la base de datos ni depende de Transport.
 */
export function validateResponse(question: Question, response: UserResponse): ValidationResult {
  if (response.questionId !== question.id) {
    return invalid('La respuesta no corresponde a la pregunta actual');
  }

  switch (question.type) {
    case 'SINGLE_CHOICE':
    case 'TWO_OPTION':
    case 'VISUAL_CARD': {
      if (question.options.length === 0) return invalid('La pregunta no tiene opciones');
      if (!response.answerId) return invalid('Debes seleccionar una opción');
      if (!answerExists(question, response.answerId)) return invalid('La opción no es válida');
      if (response.answerIds?.length) return invalid('Esta pregunta solo admite una opción');
      return valid();
    }
    case 'MULTIPLE_CHOICE': {
      if (!response.answerIds?.length) return invalid('Debes seleccionar al menos una opción');
      if (new Set(response.answerIds).size !== response.answerIds.length) {
        return invalid('No puedes repetir opciones');
      }
      if (!response.answerIds.every((id) => answerExists(question, id))) {
        return invalid('Una de las opciones no es válida');
      }
      return valid();
    }
    case 'SCALE': {
      if (response.numericValue === undefined)
        return invalid('Debes indicar un valor en la escala');
      if (response.numericValue < 0 || response.numericValue > 100) {
        return invalid('El valor debe estar entre 0 y 100');
      }
      return valid();
    }
    case 'ADAPTIVE': {
      if (response.answerId && !answerExists(question, response.answerId)) {
        return invalid('La opción no es válida');
      }
      if (response.answerIds?.some((id) => !answerExists(question, id))) {
        return invalid('Una de las opciones no es válida');
      }
      if (
        response.answerId == null &&
        !response.answerIds?.length &&
        response.numericValue === undefined &&
        !response.textValue
      ) {
        return invalid('La respuesta está vacía');
      }
      return valid();
    }
    default:
      return invalid('Tipo de pregunta no soportado');
  }
}

export interface AdaptiveCondition {
  questionId: string;
  numericMin?: number;
  numericMax?: number;
}

/** Regla adaptativa mínima: muestra la pregunta solo si una respuesta previa cumple el rango. */
export function shouldAskQuestion(question: Question, responses: readonly UserResponse[]): boolean {
  const condition = question.metadata?.showIf as AdaptiveCondition | undefined;
  if (!condition?.questionId) return true;

  const prior = responses.find((response) => response.questionId === condition.questionId);
  if (prior?.numericValue === undefined) return false;

  const { numericMin, numericMax } = condition;
  if (numericMin !== undefined && prior.numericValue < numericMin) return false;
  if (numericMax !== undefined && prior.numericValue > numericMax) return false;
  return true;
}

/** Preguntas visibles tras aplicar las reglas adaptativas. */
export function getVisibleQuestions(
  questions: readonly Question[],
  responses: readonly UserResponse[],
): Question[] {
  return questions.filter((question) => shouldAskQuestion(question, responses));
}

export interface QuizView {
  questions: Question[];
  progress: ReturnType<typeof getProgress>;
  nextQuestionIndex: number;
}

/** Vista de un quiz para unas respuestas dadas: preguntas visibles, progreso y siguiente índice. */
export function getQuizView(quiz: Quiz, responses: readonly UserResponse[]): QuizView {
  const questions = getVisibleQuestions(quiz.questions, responses);
  const answered = questions.filter((question) => isQuestionAnswered(question, responses)).length;

  return {
    questions,
    progress: getProgress(answered, questions.length),
    nextQuestionIndex: getNextQuestionIndex(questions, responses, -1),
  };
}

export interface CompletionResult {
  canComplete: boolean;
  missingQuestionIds: string[];
}

/** Comprueba que todas las preguntas visibles estén respondidas. */
export function canCompleteQuiz(quiz: Quiz, responses: readonly UserResponse[]): CompletionResult {
  const missingQuestionIds = getVisibleQuestions(quiz.questions, responses)
    .filter((question) => !isQuestionAnswered(question, responses))
    .map((question) => question.id);

  return { canComplete: missingQuestionIds.length === 0, missingQuestionIds };
}

/** Indica si una sesión puede aceptar más respuestas. */
export function isSessionOpen(session: QuizSession): boolean {
  return session.status === 'IN_PROGRESS';
}
