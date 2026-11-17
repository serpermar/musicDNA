import { describe, expect, it } from 'vitest';
import { clamp, normalizeScore, rankAffinities, weightedAverage } from './index';

describe('music-engine primitives', () => {
  it('acota y normaliza puntuaciones', () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-5)).toBe(0);
    expect(normalizeScore(5, 0, 10)).toBe(50);
    expect(normalizeScore(3, 3, 3)).toBe(0);
  });

  it('calcula medias ponderadas', () => {
    expect(weightedAverage([{ value: 100, weight: 3 }])).toBe(100);
    expect(
      weightedAverage([
        { value: 100, weight: 1 },
        { value: 0, weight: 3 },
      ]),
    ).toBe(25);
    expect(weightedAverage([])).toBe(0);
  });

  it('ordena afinidades por puntuación y asigna rangos', () => {
    expect(
      rankAffinities([
        { key: 'indie', score: 40 },
        { key: 'jazz', score: 80 },
      ]),
    ).toEqual([
      { key: 'jazz', score: 80, rank: 1 },
      { key: 'indie', score: 40, rank: 2 },
    ]);
  });
});
