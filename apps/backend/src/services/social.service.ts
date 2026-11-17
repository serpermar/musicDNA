import {
  buildRecommendations,
  compareProfiles,
  type RecommendationSeed,
} from '@musicdna/music-engine';
import type {
  CreateShareInput,
  MusicProfile,
  ProfileComparison,
  Recommendation,
  SharedProfile,
  SharedProfileView,
} from '@musicdna/shared';
import { socialRepository } from '../repositories/social.repository';
import { profileRepository } from '../repositories/profile.repository';
import { encryptToken, type SpotifyTokens } from '../integrations/spotify';
import { badRequest, forbidden, notFound } from '../utils/http-error';

export interface SocialRepositoryPort {
  findLatestProfile(userId: string): Promise<MusicProfile | null>;
  findProfileById(id: string): Promise<MusicProfile | null>;
  listProfilesByUser(userId: string): Promise<MusicProfile[]>;
  listRecommendations(profileId: string): Promise<Recommendation[]>;
  replaceRecommendations(
    profileId: string,
    seeds: readonly RecommendationSeed[],
    genreIds: ReadonlyMap<string, string>,
  ): Promise<Recommendation[]>;
  findGenresBySlugs(slugs: readonly string[]): Promise<Array<{ id: string; slug: string }>>;
  createShare(input: {
    profileId: string;
    userId: string;
    visibility: CreateShareInput['visibility'];
    allowedFields?: readonly string[];
  }): Promise<SharedProfile>;
  findSharedProfile(slug: string): Promise<{ share: SharedProfile; profile: MusicProfile } | null>;
  toSharedProfileView(profile: MusicProfile): SharedProfileView;
  registerShareView(slug: string): Promise<void>;
  isProfilePublic(profileId: string): Promise<boolean>;
  saveComparison(input: {
    sourceProfileId: string;
    targetProfileId: string;
    compatibilityScore: number;
    sharedGenres: readonly string[];
    differences: readonly string[];
    description: string;
    userId: string | null;
  }): Promise<ProfileComparison>;
  spotifyStatus(userId: string): Promise<'ACTIVE' | 'DISCONNECTED' | 'EXPIRED'>;
  upsertSpotifyConnection(input: {
    userId: string;
    spotifyUserId: string | null;
    accessToken: string;
    refreshToken: string;
    scope: string | null;
    tokenExpiresAt: Date;
  }): Promise<void>;
  disconnectSpotify(userId: string): Promise<void>;
}

export type SocialService = ReturnType<typeof createSocialService>;

function comparable(profile: MusicProfile) {
  return {
    genres: [
      profile.dominantGenre?.slug,
      ...profile.secondaryGenres.map((genre) => genre.slug),
    ].filter((slug): slug is string => Boolean(slug)),
    energyScore: profile.energyScore,
    emotionalScore: profile.emotionalScore,
    favoriteDecade: profile.favoriteDecade,
    personalitySlug: profile.personalitySlug,
  };
}

export function createSocialService(repository: SocialRepositoryPort) {
  async function requireLatestProfile(userId: string): Promise<MusicProfile> {
    const profile = await repository.findLatestProfile(userId);
    if (!profile) throw notFound('Aún no tienes un perfil musical calculado');
    return profile;
  }

  async function getRecommendations(userId: string): Promise<Recommendation[]> {
    const profile = await requireLatestProfile(userId);
    const existing = await repository.listRecommendations(profile.id);
    if (existing.length > 0) return existing;

    const seeds = buildRecommendations(profile);
    const genres = await repository.findGenresBySlugs(
      seeds.flatMap((seed) => (seed.genreSlug ? [seed.genreSlug] : [])),
    );
    return repository.replaceRecommendations(
      profile.id,
      seeds,
      new Map(genres.map((genre) => [genre.slug, genre.id])),
    );
  }

  async function history(userId: string): Promise<MusicProfile[]> {
    return repository.listProfilesByUser(userId);
  }

  async function createShare(userId: string, input: CreateShareInput): Promise<SharedProfile> {
    const profile = input.profileId
      ? await repository.findProfileById(input.profileId)
      : await repository.findLatestProfile(userId);
    if (!profile) throw notFound('Perfil musical no encontrado');
    if (profile.userId !== userId) throw forbidden('No puedes compartir el perfil de otro usuario');

    return repository.createShare({
      profileId: profile.id,
      userId,
      visibility: input.visibility,
      allowedFields: input.allowedFields,
    });
  }

  async function getSharedProfile(slug: string): Promise<SharedProfileView> {
    const found = await repository.findSharedProfile(slug);
    if (!found) throw notFound('Enlace compartido no encontrado');
    if (found.share.visibility === 'PRIVATE') throw forbidden('Este enlace es privado');
    if (found.share.expiresAt && new Date(found.share.expiresAt) < new Date()) {
      throw badRequest('Este enlace ha caducado');
    }

    await repository.registerShareView(slug);
    return repository.toSharedProfileView(found.profile);
  }

  async function compare(userId: string, targetProfileId: string): Promise<ProfileComparison> {
    const source = await requireLatestProfile(userId);
    const target = await repository.findProfileById(targetProfileId);
    if (!target) throw notFound('Perfil de destino no encontrado');
    if (target.userId !== userId && !(await repository.isProfilePublic(target.id))) {
      throw forbidden('El perfil de destino no es público');
    }

    const result = compareProfiles(comparable(source), comparable(target));
    return repository.saveComparison({
      sourceProfileId: source.id,
      targetProfileId: target.id,
      compatibilityScore: result.compatibilityScore,
      sharedGenres: result.sharedGenres,
      differences: result.differences,
      description: result.description,
      userId,
    });
  }

  async function spotifyStatus(userId: string) {
    return { status: await repository.spotifyStatus(userId) };
  }

  async function connectSpotify(userId: string, tokens: SpotifyTokens): Promise<void> {
    await repository.upsertSpotifyConnection({
      userId,
      spotifyUserId: tokens.spotifyUserId,
      // Cifrado antes de tocar el repositorio: la base de datos nunca ve tokens en claro.
      accessToken: encryptToken(tokens.accessToken),
      refreshToken: encryptToken(tokens.refreshToken),
      scope: tokens.scope,
      tokenExpiresAt: tokens.expiresAt,
    });
  }

  async function disconnectSpotify(userId: string): Promise<void> {
    await repository.disconnectSpotify(userId);
  }

  return {
    getRecommendations,
    history,
    createShare,
    getSharedProfile,
    compare,
    spotifyStatus,
    connectSpotify,
    disconnectSpotify,
  };
}

export const socialService = createSocialService({
  ...socialRepository,
  findLatestProfile: profileRepository.findLatestProfile,
  findProfileById: profileRepository.findProfileById,
  listProfilesByUser: profileRepository.listProfilesByUser,
  findGenresBySlugs: profileRepository.findGenresBySlugs,
});
