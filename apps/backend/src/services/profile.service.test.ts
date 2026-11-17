import type { MusicProfile, Quiz, QuizSession, UserResponse } from '@musicdna/shared';
import { describe, expect, it, vi } from 'vitest';
import type { CreateProfileData } from '../repositories/profile.repository';
import { createProfileService, type ProfileRepositoryPort } from './profile.service';

const USER_ID = 'user-1';
const SESSION_ID = 'session-1';

function makeSession(status: QuizSession['status'] = 'COMPLETED'): QuizSession {
  return {
    id: SESSION_ID,
    quizId: 'quiz-1',
    userId: USER_ID,
    status,
    currentQuestionIndex: -1,
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: status === 'COMPLETED' ? '2026-01-01T00:10:00.000Z' : null,
  };
}

function makeQuiz(): Quiz {
  return {
    id: 'quiz-1',
    slug: 'core',
    title: 'Core',
    version: 1,
    questions: [
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
        id: 'q-genre',
        key: 'genre',
        prompt: 'Género',
        type: 'SINGLE_CHOICE',
        category: 'genres',
        weight: 1,
        position: 1,
        options: [
          {
            id: 'a-indie',
            label: 'Indie',
            value: 'indie',
            position: 0,
            scores: { genres: { indie: 2 }, traits: { curated: 2 }, decade: '2010s' },
          },
        ],
      },
    ],
  };
}

const responses: UserResponse[] = [
  { questionId: 'q-energy', numericValue: 80 },
  { questionId: 'q-genre', answerId: 'a-indie' },
];

function makeProfile(): MusicProfile {
  return {
    id: 'profile-1',
    userId: USER_ID,
    personalityName: 'El Curador Sonoro',
    personalitySlug: 'curador-sonoro',
    description: 'Desc',
    dominantGenre: { genreId: 'genre-1', slug: 'indie', name: 'Indie', score: 100, rank: 1 },
    secondaryGenres: [],
    favoriteDecade: '2010s',
    energyScore: 80,
    emotionalScore: 50,
    traits: [{ traitSlug: 'curated', label: 'Curaduría', score: 100 }],
    algorithmVersion: '1.0.0',
    createdAt: '2026-01-01T00:10:00.000Z',
  };
}

function makeRepository(overrides: Partial<ProfileRepositoryPort> = {}) {
  const createProfile = vi.fn(async (input: CreateProfileData) => {
    void input;
    return makeProfile();
  });

  const repository: ProfileRepositoryPort = {
    async findSession() {
      return makeSession();
    },
    async findQuiz() {
      return makeQuiz();
    },
    async findResponses() {
      return responses;
    },
    async findGenresBySlugs() {
      return [{ id: 'genre-1', slug: 'indie', name: 'Indie' }];
    },
    async findTraitsBySlugs() {
      return [{ id: 'trait-1', slug: 'curated', label: 'Curaduría' }];
    },
    async findLatestProfile() {
      return makeProfile();
    },
    createProfile,
    ...overrides,
  };

  return { repository, createProfile };
}

describe('profile.service', () => {
  it('calcula y persiste el perfil de una sesión completada', async () => {
    const { repository, createProfile } = makeRepository();
    const service = createProfileService(repository);

    const profile = await service.generate(USER_ID, SESSION_ID);

    expect(profile.personalitySlug).toBe('curador-sonoro');
    expect(createProfile).toHaveBeenCalledTimes(1);
    const input = createProfile.mock.calls[0]?.[0];
    expect(input?.calculation.energyScore).toBe(80);
    expect(input?.calculation.favoriteDecade).toBe('2010s');
    expect(input?.genres).toEqual([{ id: 'genre-1', score: 100, rank: 1 }]);
    expect(input?.traits).toEqual([{ id: 'trait-1', score: 100 }]);
  });

  it('rechaza sesiones incompletas, ajenas e inexistentes', async () => {
    const incomplete = makeRepository({
      async findSession() {
        return makeSession('IN_PROGRESS');
      },
    });
    const foreign = makeRepository({
      async findSession() {
        return { ...makeSession(), userId: 'otro-usuario' };
      },
    });
    const missing = makeRepository({
      async findSession() {
        return null;
      },
    });

    await expect(
      createProfileService(incomplete.repository).generate(USER_ID, SESSION_ID),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      createProfileService(foreign.repository).generate(USER_ID, SESSION_ID),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      createProfileService(missing.repository).generate(USER_ID, SESSION_ID),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('devuelve el último perfil del usuario', async () => {
    const { repository } = makeRepository();
    const service = createProfileService(repository);
    expect((await service.getLatest(USER_ID))?.id).toBe('profile-1');
  });
});
