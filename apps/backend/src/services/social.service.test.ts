import type {
  MusicProfile,
  ProfileComparison,
  Recommendation,
  SharedProfile,
  SharedProfileView,
} from '@musicdna/shared';
import { describe, expect, it, vi } from 'vitest';
import type { RecommendationSeed } from '@musicdna/music-engine';
import { createSocialService, type SocialRepositoryPort } from './social.service';

type SpotifyConnectionInput = Parameters<SocialRepositoryPort['upsertSpotifyConnection']>[0];

const USER_ID = 'user-1';
const PROFILE_ID = 'profile-1';

function profile(userId = USER_ID): MusicProfile {
  return {
    id: PROFILE_ID,
    userId,
    personalityName: 'El Curador Sonoro',
    personalitySlug: 'curador-sonoro',
    description: 'Desc',
    dominantGenre: { genreId: 'g1', slug: 'indie', name: 'Indie', score: 100, rank: 1 },
    secondaryGenres: [],
    favoriteDecade: '2010s',
    energyScore: 60,
    emotionalScore: 50,
    traits: [],
    algorithmVersion: '1.0.0',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function recommendation(): Recommendation {
  return {
    id: 'rec-1',
    kind: 'GENRE',
    title: 'Explora más de Indie',
    reason: 'Motivo',
    score: 100,
    externalUrl: null,
  };
}

function share(visibility: SharedProfile['visibility'] = 'UNLISTED'): SharedProfile {
  return {
    slug: 'abc123',
    profileId: PROFILE_ID,
    visibility,
    expiresAt: null,
    viewCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function view(): SharedProfileView {
  return {
    profileId: PROFILE_ID,
    personalityName: 'El Curador Sonoro',
    personalitySlug: 'curador-sonoro',
    description: 'Desc',
    dominantGenre: profile().dominantGenre,
    secondaryGenres: [],
    favoriteDecade: '2010s',
    energyScore: 60,
    emotionalScore: 50,
    traits: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function comparison(): ProfileComparison {
  return {
    id: 'comparison-1',
    sourceProfileId: PROFILE_ID,
    targetProfileId: 'profile-2',
    compatibilityScore: 80,
    sharedGenres: ['indie'],
    differences: [],
    description: 'Desc',
  };
}

function makeRepository() {
  const replaceRecommendations = vi.fn(
    async (
      _profileId: string,
      _seeds: readonly RecommendationSeed[],
      _genreIds: ReadonlyMap<string, string>,
    ) => [recommendation()],
  );
  const createShare = vi.fn(async () => share());
  const registerShareView = vi.fn(async () => undefined);
  const saveComparison = vi.fn(async () => comparison());
  const upsertSpotifyConnection = vi.fn(async (_input: SpotifyConnectionInput) => undefined);
  const disconnectSpotify = vi.fn(async () => undefined);

  const repository: SocialRepositoryPort = {
    async findLatestProfile() {
      return profile();
    },
    async findProfileById() {
      return profile();
    },
    async listProfilesByUser() {
      return [profile()];
    },
    async listRecommendations() {
      return [];
    },
    replaceRecommendations,
    async findGenresBySlugs() {
      return [{ id: 'g1', slug: 'indie' }];
    },
    createShare,
    async findSharedProfile() {
      return { share: share(), profile: profile() };
    },
    toSharedProfileView: () => view(),
    registerShareView,
    async isProfilePublic() {
      return true;
    },
    saveComparison,
    async spotifyStatus() {
      return 'DISCONNECTED';
    },
    upsertSpotifyConnection,
    disconnectSpotify,
  };

  return {
    repository,
    replaceRecommendations,
    createShare,
    registerShareView,
    saveComparison,
    upsertSpotifyConnection,
    disconnectSpotify,
  };
}

describe('social.service', () => {
  it('genera y persiste recomendaciones la primera vez', async () => {
    const { repository, replaceRecommendations } = makeRepository();
    const result = await createSocialService(repository).getRecommendations(USER_ID);

    expect(result).toEqual([recommendation()]);
    expect(replaceRecommendations).toHaveBeenCalledTimes(1);
    const [, seeds, genreIds] = replaceRecommendations.mock.calls[0]!;
    expect(seeds.length).toBeGreaterThan(0);
    expect(genreIds.get('indie')).toBe('g1');
  });

  it('reutiliza recomendaciones ya calculadas', async () => {
    const { repository, replaceRecommendations } = makeRepository();
    const service = createSocialService({
      ...repository,
      async listRecommendations() {
        return [recommendation()];
      },
    });
    expect((await service.getRecommendations(USER_ID)).length).toBe(1);
    expect(replaceRecommendations).not.toHaveBeenCalled();
  });

  it('devuelve el historial de perfiles', async () => {
    const { repository } = makeRepository();
    expect((await createSocialService(repository).history(USER_ID))[0]?.id).toBe(PROFILE_ID);
  });

  it('comparte el último perfil y rechaza perfiles ajenos', async () => {
    const { repository, createShare } = makeRepository();
    const service = createSocialService(repository);
    await service.createShare(USER_ID, { visibility: 'UNLISTED' });
    expect(createShare).toHaveBeenCalledTimes(1);

    const foreign = createSocialService({
      ...repository,
      async findProfileById() {
        return profile('otro-usuario');
      },
    });
    await expect(
      foreign.createShare(USER_ID, { profileId: PROFILE_ID, visibility: 'PUBLIC' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('registra la vista de un enlace accesible y rechaza los privados', async () => {
    const { repository, registerShareView } = makeRepository();
    const service = createSocialService(repository);
    expect((await service.getSharedProfile('abc123')).profileId).toBe(PROFILE_ID);
    expect(registerShareView).toHaveBeenCalledWith('abc123');

    const privateService = createSocialService({
      ...repository,
      async findSharedProfile() {
        return { share: share('PRIVATE'), profile: profile() };
      },
    });
    await expect(privateService.getSharedProfile('abc123')).rejects.toMatchObject({ status: 403 });
  });

  it('compara perfiles propios o públicos y guarda el resultado', async () => {
    const { repository, saveComparison } = makeRepository();
    const service = createSocialService(repository);
    const result = await service.compare(USER_ID, 'profile-2');
    expect(result.compatibilityScore).toBe(80);
    expect(saveComparison).toHaveBeenCalledTimes(1);

    const hidden = createSocialService({
      ...repository,
      async findProfileById() {
        return profile('otro-usuario');
      },
      async isProfilePublic() {
        return false;
      },
    });
    await expect(hidden.compare(USER_ID, 'profile-2')).rejects.toMatchObject({ status: 403 });
  });

  it('expone solo el estado de la conexión de Spotify', async () => {
    const { repository } = makeRepository();
    expect(await createSocialService(repository).spotifyStatus(USER_ID)).toEqual({
      status: 'DISCONNECTED',
    });
  });

  it('cifra los tokens de Spotify antes de persistirlos', async () => {
    const { repository, upsertSpotifyConnection } = makeRepository();
    await createSocialService(repository).connectSpotify(USER_ID, {
      accessToken: 'access-secreto',
      refreshToken: 'refresh-secreto',
      scope: 'user-top-read',
      spotifyUserId: 'spotify-123',
      expiresAt: new Date('2026-01-01T01:00:00.000Z'),
    });

    expect(upsertSpotifyConnection).toHaveBeenCalledTimes(1);
    const stored = upsertSpotifyConnection.mock.calls[0]![0];
    expect(stored.userId).toBe(USER_ID);
    expect(stored.accessToken).not.toContain('access-secreto');
    expect(stored.refreshToken).not.toContain('refresh-secreto');
    expect(stored.accessToken.startsWith('v1:')).toBe(true);
  });

  it('desconecta Spotify a petición del usuario', async () => {
    const { repository, disconnectSpotify } = makeRepository();
    await createSocialService(repository).disconnectSpotify(USER_ID);
    expect(disconnectSpotify).toHaveBeenCalledWith(USER_ID);
  });
});
