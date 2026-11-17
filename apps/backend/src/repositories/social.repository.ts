import type { RecommendationSeed } from '@musicdna/music-engine';
import type {
  MusicProfile,
  ProfileComparison,
  Recommendation,
  SharedProfile,
  SharedProfileView,
} from '@musicdna/shared';
import { Prisma, type SharedProfileVisibility } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { mapMusicProfile, profileInclude } from './profile.repository';

type ShareRow = Prisma.SharedProfileGetPayload<{
  include: { musicProfile: { include: typeof profileInclude } };
}>;
type RecommendationRow = Prisma.RecommendationGetPayload<object>;
type ComparisonRow = Prisma.ProfileComparisonGetPayload<object>;

function stringArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function mapRecommendation(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    reason: row.reason,
    score: Number(row.score),
    externalUrl: row.externalUrl,
  };
}

function mapComparison(row: ComparisonRow): ProfileComparison {
  return {
    id: row.id,
    sourceProfileId: row.sourceProfileId,
    targetProfileId: row.targetProfileId,
    compatibilityScore: Number(row.compatibilityScore),
    sharedGenres: stringArray(row.sharedGenres),
    differences: stringArray(row.differences),
    description: row.description,
  };
}

function mapShare(row: ShareRow): SharedProfile {
  return {
    slug: row.slug,
    profileId: row.musicProfileId,
    visibility: row.visibility,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    viewCount: row.viewCount,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface CreateShareData {
  profileId: string;
  userId: string;
  visibility: SharedProfileVisibility;
  allowedFields?: readonly string[];
}

export const socialRepository = {
  async listRecommendations(profileId: string): Promise<Recommendation[]> {
    const rows = await prisma.recommendation.findMany({
      where: { musicProfileId: profileId },
      orderBy: [{ position: 'asc' }, { score: 'desc' }],
    });
    return rows.map(mapRecommendation);
  },

  /** Sustituye las recomendaciones de un perfil; idempotente. */
  async replaceRecommendations(
    profileId: string,
    seeds: readonly RecommendationSeed[],
    genreIds: ReadonlyMap<string, string>,
  ): Promise<Recommendation[]> {
    await prisma.$transaction(async (tx) => {
      await tx.recommendation.deleteMany({ where: { musicProfileId: profileId } });
      if (seeds.length === 0) return;

      await tx.recommendation.createMany({
        data: seeds.map((seed, position) => ({
          musicProfileId: profileId,
          kind: seed.kind,
          title: seed.title,
          reason: seed.reason,
          score: seed.score,
          position,
          genreId: seed.genreSlug ? (genreIds.get(seed.genreSlug) ?? null) : null,
        })),
      });
    });

    return this.listRecommendations(profileId);
  },

  async createShare(input: CreateShareData): Promise<SharedProfile> {
    const row = await prisma.sharedProfile.create({
      data: {
        musicProfileId: input.profileId,
        sharedByUserId: input.userId,
        slug: randomUUID().replaceAll('-', '').slice(0, 16),
        visibility: input.visibility,
        allowedFields: input.allowedFields
          ? (input.allowedFields as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      include: { musicProfile: { include: profileInclude } },
    });
    return mapShare(row);
  },

  async findSharedProfile(
    slug: string,
  ): Promise<{ share: SharedProfile; profile: MusicProfile } | null> {
    const row = await prisma.sharedProfile.findUnique({
      where: { slug },
      include: { musicProfile: { include: profileInclude } },
    });
    if (!row) return null;
    return { share: mapShare(row), profile: mapMusicProfile(row.musicProfile) };
  },

  async registerShareView(slug: string): Promise<void> {
    await prisma.sharedProfile.update({ where: { slug }, data: { viewCount: { increment: 1 } } });
  },

  async saveComparison(input: {
    sourceProfileId: string;
    targetProfileId: string;
    compatibilityScore: number;
    sharedGenres: readonly string[];
    differences: readonly string[];
    description: string;
    userId: string | null;
  }): Promise<ProfileComparison> {
    const row = await prisma.profileComparison.upsert({
      where: {
        sourceProfileId_targetProfileId: {
          sourceProfileId: input.sourceProfileId,
          targetProfileId: input.targetProfileId,
        },
      },
      create: {
        sourceProfileId: input.sourceProfileId,
        targetProfileId: input.targetProfileId,
        requestedByUserId: input.userId,
        compatibilityScore: input.compatibilityScore,
        sharedGenres: input.sharedGenres as unknown as Prisma.InputJsonValue,
        differences: input.differences as unknown as Prisma.InputJsonValue,
        description: input.description,
        algorithmVersion: '1.0.0',
      },
      update: {
        compatibilityScore: input.compatibilityScore,
        sharedGenres: input.sharedGenres as unknown as Prisma.InputJsonValue,
        differences: input.differences as unknown as Prisma.InputJsonValue,
        description: input.description,
        algorithmVersion: '1.0.0',
      },
    });
    return mapComparison(row);
  },

  async isProfilePublic(profileId: string): Promise<boolean> {
    const share = await prisma.sharedProfile.findFirst({
      where: {
        musicProfileId: profileId,
        visibility: 'PUBLIC',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    });
    return Boolean(share);
  },

  async spotifyStatus(userId: string): Promise<'ACTIVE' | 'DISCONNECTED' | 'EXPIRED'> {
    const connection = await prisma.spotifyConnection.findUnique({
      where: { userId },
      select: { status: true },
    });
    return connection?.status ?? 'DISCONNECTED';
  },

  /** Guarda tokens ya cifrados; nunca recibe valores en claro. */
  async upsertSpotifyConnection(input: {
    userId: string;
    spotifyUserId: string | null;
    accessToken: string;
    refreshToken: string;
    scope: string | null;
    tokenExpiresAt: Date;
  }): Promise<void> {
    const data = {
      spotifyUserId: input.spotifyUserId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      scope: input.scope,
      tokenExpiresAt: input.tokenExpiresAt,
      status: 'ACTIVE' as const,
      connectedAt: new Date(),
      disconnectedAt: null,
    };
    await prisma.spotifyConnection.upsert({
      where: { userId: input.userId },
      create: { userId: input.userId, ...data },
      update: data,
    });
  },

  /** Borra los tokens cifrados y marca la conexión como desconectada. */
  async disconnectSpotify(userId: string): Promise<void> {
    await prisma.spotifyConnection.updateMany({
      where: { userId },
      data: {
        status: 'DISCONNECTED',
        disconnectedAt: new Date(),
        accessToken: '',
        refreshToken: '',
      },
    });
  },

  toSharedProfileView(profile: MusicProfile): SharedProfileView {
    return {
      profileId: profile.id,
      personalityName: profile.personalityName,
      personalitySlug: profile.personalitySlug,
      description: profile.description,
      dominantGenre: profile.dominantGenre,
      secondaryGenres: profile.secondaryGenres,
      favoriteDecade: profile.favoriteDecade,
      energyScore: profile.energyScore,
      emotionalScore: profile.emotionalScore,
      traits: profile.traits,
      createdAt: profile.createdAt,
    };
  },
};
