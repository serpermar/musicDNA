import type { Question, UserResponse } from '@musicdna/shared';
import { describe, expect, it } from 'vitest';
import {
  canCompleteQuiz,
  getNextQuestionIndex,
  getProgress,
  getQuizView,
  isQuestionAnswered,
  validateResponse,
} from './index';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    key: 'q-1',
    prompt: 'Pregunta de prueba',
    type: 'SINGLE_CHOICE',
    category: 'personality',
    weight: 1,
    position: 0,
    options: [{ id: 'a-1', label: 'Opción', value: 'option', position: 0 }],
    ...overrides,
  };
}

describe('quiz-engine', () => {
  it('calcula el progreso y lo acota al rango válido', () => {
    expect(getProgress(1, 4)).toEqual({ answered: 1, total: 4, percent: 25 });
    expect(getProgress(9, 4)).toEqual({ answered: 4, total: 4, percent: 100 });
    expect(getProgress(0, 0)).toEqual({ answered: 0, total: 0, percent: 0 });
  });

  it('detecta preguntas respondidas y devuelve la siguiente sin responder', () => {
    const questions = [
      makeQuestion({ id: 'a' }),
      makeQuestion({ id: 'b' }),
      makeQuestion({ id: 'c' }),
    ];
    const responses: UserResponse[] = [{ questionId: 'a', answerId: 'a-1' }];

    expect(isQuestionAnswered(questions[0]!, responses)).toBe(true);
    expect(getNextQuestionIndex(questions, responses, 0)).toBe(1);
    expect(getNextQuestionIndex(questions, responses, 2)).toBe(-1);
  });

  it('valida respuestas de selección única y escala', () => {
    const single = makeQuestion();
    const scale = makeQuestion({ id: 'q-2', type: 'SCALE', options: [] });

    expect(validateResponse(single, { questionId: 'q-1', answerId: 'a-1' }).valid).toBe(true);
    expect(validateResponse(single, { questionId: 'q-1', answerId: 'otra' }).valid).toBe(false);
    expect(validateResponse(scale, { questionId: 'q-2', numericValue: 80 }).valid).toBe(true);
    expect(validateResponse(scale, { questionId: 'q-2', numericValue: 140 }).valid).toBe(false);
  });

  it('valida selección múltiple sin duplicados', () => {
    const question = makeQuestion({
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'a-1', label: 'Uno', value: 'one', position: 0 },
        { id: 'a-2', label: 'Dos', value: 'two', position: 1 },
      ],
    });

    expect(validateResponse(question, { questionId: 'q-1', answerIds: ['a-1', 'a-2'] }).valid).toBe(
      true,
    );
    expect(validateResponse(question, { questionId: 'q-1', answerIds: ['a-1', 'a-1'] }).valid).toBe(
      false,
    );
  });

  it('aplica reglas adaptativas basadas en una respuesta previa', () => {
    const gate = makeQuestion({ id: 'gate', type: 'SCALE', options: [] });
    const conditional = makeQuestion({
      id: 'conditional',
      metadata: { showIf: { questionId: 'gate', numericMin: 60 } },
    });
    const quiz = {
      id: 'quiz',
      slug: 'test',
      title: 'Test',
      version: 1,
      questions: [gate, conditional],
    };

    expect(getQuizView(quiz, [{ questionId: 'gate', numericValue: 40 }]).questions).toHaveLength(1);
    expect(getQuizView(quiz, [{ questionId: 'gate', numericValue: 80 }]).questions).toHaveLength(2);
  });

  it('solo permite completar si no faltan preguntas visibles', () => {
    const quiz = {
      id: 'quiz',
      slug: 'test',
      title: 'Test',
      version: 1,
      questions: [makeQuestion({ id: 'a' }), makeQuestion({ id: 'b' })],
    };

    const incomplete = canCompleteQuiz(quiz, [{ questionId: 'a', answerId: 'a-1' }]);
    expect(incomplete.canComplete).toBe(false);
    expect(incomplete.missingQuestionIds).toEqual(['b']);

    const complete = canCompleteQuiz(quiz, [
      { questionId: 'a', answerId: 'a-1' },
      { questionId: 'b', answerId: 'a-1' },
    ]);
    expect(complete.canComplete).toBe(true);
  });
});
