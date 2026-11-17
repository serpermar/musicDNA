import type { MusicProfile } from '@musicdna/shared';
import { describe, expect, it } from 'vitest';
import { buildRecommendations, compareProfiles } from './index';

function profile(overrides: Partial<MusicProfile> = {}): MusicProfile {
  return {
    id: 'profile-1',
    userId: 'user-1',
    personalityName: 'El Explorador Nocturno',
    personalitySlug: 'explorador-nocturno',
    description: 'Desc',
    dominantGenre: { genreId: 'g1', slug: 'indie', name: 'Indie', score: 100, rank: 1 },
    secondaryGenres: [
      { genreId: 'g2', slug: 'electronic', name: 'Electrónica', score: 60, rank: 2 },
    ],
    favoriteDecade: '2010s',
    energyScore: 85,
    emotionalScore: 40,
    traits: [{ traitSlug: 'curated', label: 'Curaduría', score: 90 }],
    algorithmVersion: '1.0.0',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('music-engine · buildRecommendations', () => {
  it('genera recomendaciones deterministas explicables desde el perfil', () => {
    const first = buildRecommendations(profile());
    const second = buildRecommendations(profile());

    expect(first).toEqual(second);
    expect(first.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        'Explora más de Indie',
        'Explora más de Electrónica',
        'Playlist de alta energía',
        'Viaje sonoro a los 2010s',
        'Selección para coleccionistas',
      ]),
    );
    expect(first.every((item) => item.score >= 0 && item.score <= 100)).toBe(true);
    expect(first[0]?.title).toBe('Explora más de Indie');
  });

  it('adapta la recomendación de energía a perfiles tranquilos', () => {
    const result = buildRecommendations(profile({ energyScore: 20 }));
    expect(result.map((item) => item.title)).toContain('Escucha de baja intensidad');
    expect(result.map((item) => item.title)).not.toContain('Playlist de alta energía');
  });
});

describe('music-engine · compareProfiles', () => {
  it('puntúa alto perfiles similares y comparte géneros', () => {
    const result = compareProfiles(
      {
        genres: ['indie', 'electronic'],
        energyScore: 80,
        emotionalScore: 40,
        favoriteDecade: '2010s',
        personalitySlug: 'explorador-nocturno',
      },
      {
        genres: ['indie', 'electronic', 'rock'],
        energyScore: 85,
        emotionalScore: 45,
        favoriteDecade: '2010s',
        personalitySlug: 'explorador-nocturno',
      },
    );

    expect(result.sharedGenres).toEqual(['electronic', 'indie']);
    expect(result.compatibilityScore).toBeGreaterThanOrEqual(80);
    expect(result.differences).toEqual([]);
  });

  it('explica diferencias entre perfiles opuestos', () => {
    const result = compareProfiles(
      {
        genres: ['jazz'],
        energyScore: 20,
        emotionalScore: 80,
        favoriteDecade: '1970s',
        personalitySlug: 'observador-sereno',
      },
      {
        genres: ['metal'],
        energyScore: 90,
        emotionalScore: 20,
        favoriteDecade: '2020s',
        personalitySlug: 'arquitecto-del-ritmo',
      },
    );

    expect(result.compatibilityScore).toBeLessThan(30);
    expect(result.sharedGenres).toEqual([]);
    expect(result.differences.length).toBeGreaterThan(0);
  });

  it('es simétrica', () => {
    const a = {
      genres: ['indie'],
      energyScore: 60,
      emotionalScore: 50,
      favoriteDecade: '2000s',
      personalitySlug: 'curador-sonoro',
    };
    const b = {
      genres: ['rock'],
      energyScore: 40,
      emotionalScore: 70,
      favoriteDecade: '1990s',
      personalitySlug: 'purista-analogico',
    };
    expect(compareProfiles(a, b).compatibilityScore).toBe(compareProfiles(b, a).compatibilityScore);
  });
});
