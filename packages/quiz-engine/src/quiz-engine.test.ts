import type { Question } from '@musicdna/shared';
import { describe, expect, it } from 'vitest';
import { getNextQuestionIndex, getProgress, isQuestionAnswered } from './index';

function makeQuestion(id: string): Question {
  return {
    id,
    key: `q-${id}`,
    prompt: 'Pregunta de prueba',
    type: 'SINGLE_CHOICE',
    category: 'personality',
    weight: 1,
    position: 0,
    options: [],
  };
}

describe('quiz-engine', () => {
  it('calcula el progreso y lo acota al rango válido', () => {
    expect(getProgress(1, 4)).toEqual({ answered: 1, total: 4, percent: 25 });
    expect(getProgress(9, 4)).toEqual({ answered: 4, total: 4, percent: 100 });
    expect(getProgress(0, 0)).toEqual({ answered: 0, total: 0, percent: 0 });
  });

  it('detecta preguntas respondidas y devuelve la siguiente sin responder', () => {
    const questions = [makeQuestion('a'), makeQuestion('b'), makeQuestion('c')];
    const responses = [{ questionId: 'a', answerId: 'answer-1' }];

    expect(isQuestionAnswered(questions[0]!, responses)).toBe(true);
    expect(getNextQuestionIndex(questions, responses, 0)).toBe(1);
    expect(getNextQuestionIndex(questions, responses, 2)).toBe(-1);
  });
});
