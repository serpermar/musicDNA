import type { Question, Quiz, UserResponse } from '@musicdna/shared';
import { describe, expect, it } from 'vitest';
import { ALGORITHM_VERSION, PERSONALITIES, calculateProfile } from './index';

function makeQuiz(): Quiz {
  const questions: Question[] = [
    {
      id: 'q-energy',
      key: 'energy',
      prompt: 'Energía',
      type: 'SCALE',
      category: 'energy',
      weight: 1,
      position: 0,
      options: [],
    },
    {
      id: 'q-mood',
      key: 'mood',
      prompt: 'Ánimo',
      type: 'SINGLE_CHOICE',
      category: 'personality',
      weight: 1,
      position: 1,
      options: [
        {
          id: 'a-calm',
          label: 'Calma',
          value: 'calm',
          position: 0,
          scores: { energy: 0.2, emotional: 0.6, traits: { introspective: 2 } },
        },
        {
          id: 'a-electric',
          label: 'Eléctrico',
          value: 'electric',
          position: 1,
          scores: {
            energy: 0.9,
            emotional: 0.4,
            traits: { electronic: 2, curious: 1.5 },
            genres: { electronic: 2, indie: 1 },
          },
        },
      ],
    },
    {
      id: 'q-decade',
      key: 'decade',
      prompt: 'Década',
      type: 'SINGLE_CHOICE',
      category: 'decades',
      weight: 1,
      position: 2,
      options: [
        { id: 'a-80s', label: '80s', value: '1980s', position: 0, scores: { decade: '1980s' } },
      ],
    },
    {
      id: 'q-genres',
      key: 'genres',
      prompt: 'Géneros',
      type: 'MULTIPLE_CHOICE',
      category: 'genres',
      weight: 2,
      position: 3,
      options: [
        {
          id: 'a-indie',
          label: 'Indie',
          value: 'indie',
          position: 0,
          scores: { genres: { indie: 2 } },
        },
        {
          id: 'a-jazz',
          label: 'Jazz',
          value: 'jazz',
          position: 1,
          scores: { genres: { jazz: 1 } },
        },
      ],
    },
  ];

  return { id: 'quiz-1', slug: 'core', title: 'Core', version: 1, questions };
}

describe('music-engine · calculateProfile', () => {
  it('agrega afinidades, energía, emoción y década favorita', () => {
    const responses: UserResponse[] = [
      { questionId: 'q-energy', numericValue: 70 },
      { questionId: 'q-mood', answerId: 'a-electric' },
      { questionId: 'q-decade', answerId: 'a-80s' },
      { questionId: 'q-genres', answerIds: ['a-indie', 'a-jazz'] },
    ];

    const result = calculateProfile(makeQuiz(), responses);

    expect(result.genres).toEqual([
      { key: 'indie', score: 100, rank: 1 },
      { key: 'electronic', score: 40, rank: 2 },
      { key: 'jazz', score: 40, rank: 3 },
    ]);
    expect(result.favoriteDecade).toBe('1980s');
    expect(result.energyScore).toBe(80);
    expect(result.emotionalScore).toBe(40);
    expect(result.traits.map((trait) => trait.key)).toEqual(['electronic', 'curious']);
    expect(result.algorithmVersion).toBe(ALGORITHM_VERSION);
  });

  it('selecciona un arquetipo coherente con las puntuaciones', () => {
    const responses: UserResponse[] = [
      { questionId: 'q-energy', numericValue: 90 },
      { questionId: 'q-mood', answerId: 'a-electric' },
    ];

    const result = calculateProfile(makeQuiz(), responses);
    expect(result.personality.slug).toBe('explorador-nocturno');
    expect(result.personality.name).toBe('El Explorador Nocturno');
    expect(result.personality.description.length).toBeGreaterThan(0);
  });

  it('usa un arquetipo equilibrado cuando no hay señales suficientes', () => {
    const result = calculateProfile(makeQuiz(), []);
    expect(result.personality.slug).toBe('equilibrista-eclectico');
    expect(result.energyScore).toBe(50);
    expect(result.emotionalScore).toBe(50);
    expect(result.genres).toEqual([]);
  });

  it('ignora respuestas desconocidas y opciones que no pertenecen a la pregunta', () => {
    const result = calculateProfile(makeQuiz(), [
      { questionId: 'no-existe', answerId: 'a-electric' },
      { questionId: 'q-mood', answerId: 'invalida' },
      { questionId: 'q-decade', answerId: 'a-80s' },
    ]);

    expect(result.favoriteDecade).toBe('1980s');
    expect(result.genres).toEqual([]);
  });

  it('mantiene un catálogo de arquetipos único y con fallback', () => {
    const slugs = PERSONALITIES.map((personality) => personality.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.at(-1)).toBe('equilibrista-eclectico');
  });
});
