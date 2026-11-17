import type { ProfileCalculation } from '@musicdna/music-engine';
import type { MusicProfile } from '@musicdna/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { quizRepository } from './quiz.repository';

export interface CreateProfileData {
  userId: string;
  sessionId: string;
  calculation: ProfileCalculation;
  genres: Array<{ id: string; score: number; rank: number }>;
  traits: Array<{ id: string; score: number }>;
}

export const profileInclude = {
  genreScores: { include: { genre: true } },
  personalityScores: { include: { personalityTrait: true } },
} as const satisfies Prisma.MusicProfileInclude;

type ProfileRow = Prisma.MusicProfileGetPayload<{ include: typeof profileInclude }>;

export function mapMusicProfile(row: ProfileRow): MusicProfile {
  const genres = [...row.genreScores]
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((score) => ({
      genreId: score.genreId,
      slug: score.genre.slug,
      name: score.genre.name,
      score: Number(score.score),
      rank: score.rank ?? 0,
    }));

  return {
    id: row.id,
    userId: row.userId,
    personalityName: row.personalityName,
    personalitySlug: row.personalitySlug,
    description: row.description,
    dominantGenre: genres[0] ?? null,
    secondaryGenres: genres.slice(1),
    favoriteDecade: row.favoriteDecade,
    energyScore: Number(row.energyScore),
    emotionalScore: Number(row.emotionalScore),
    traits: [...row.personalityScores]
      .sort((a, b) => Number(b.score) - Number(a.score))
      .map((score) => ({
        traitSlug: score.personalityTrait.slug,
        label: score.personalityTrait.label,
        score: Number(score.score),
      })),
    algorithmVersion: row.algorithmVersion,
    createdAt: row.createdAt.toISOString(),
  };
}

export const profileRepository = {
  findSession(id: string) {
    return quizRepository.findSession(id);
  },

  findQuiz(id: string) {
    return quizRepository.findQuizById(id);
  },

  findResponses(sessionId: string) {
    return quizRepository.findResponses(sessionId);
  },

  findGenresBySlugs(slugs: readonly string[]) {
    return prisma.musicGenre.findMany({
      where: { slug: { in: [...slugs] } },
      select: { id: true, slug: true, name: true },
    });
  },

  findTraitsBySlugs(slugs: readonly string[]) {
    return prisma.personalityTrait.findMany({
      where: { slug: { in: [...slugs] } },
      select: { id: true, slug: true, label: true },
    });
  },

  async findLatestProfile(userId: string): Promise<MusicProfile | null> {
    const row = await prisma.musicProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: profileInclude,
    });
    return row ? mapMusicProfile(row) : null;
  },

  async findProfileById(id: string): Promise<MusicProfile | null> {
    const row = await prisma.musicProfile.findUnique({
      where: { id },
      include: profileInclude,
    });
    return row ? mapMusicProfile(row) : null;
  },

  async listProfilesByUser(userId: string): Promise<MusicProfile[]> {
    const rows = await prisma.musicProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: profileInclude,
    });
    return rows.map(mapMusicProfile);
  },

  async createProfile(input: CreateProfileData): Promise<MusicProfile> {
    const profileId = await prisma.$transaction(async (tx) => {
      const existing = await tx.musicProfile.findUnique({
        where: { quizSessionId: input.sessionId },
      });

      if (existing) {
        await tx.genreScore.deleteMany({ where: { musicProfileId: existing.id } });
        await tx.personalityScore.deleteMany({ where: { musicProfileId: existing.id } });
      }

      const data = {
        userId: input.userId,
        quizSessionId: input.sessionId,
        personalityName: input.calculation.personality.name,
        personalitySlug: input.calculation.personality.slug,
        description: input.calculation.personality.description,
        favoriteDecade: input.calculation.favoriteDecade,
        energyScore: input.calculation.energyScore,
        emotionalScore: input.calculation.emotionalScore,
        algorithmVersion: input.calculation.algorithmVersion,
        dominantGenreId: input.genres[0]?.id ?? null,
      };

      const saved = existing
        ? await tx.musicProfile.update({ where: { id: existing.id }, data })
        : await tx.musicProfile.create({ data });

      if (input.genres.length > 0) {
        await tx.genreScore.createMany({
          data: input.genres.map((genre) => ({
            musicProfileId: saved.id,
            genreId: genre.id,
            score: genre.score,
            rank: genre.rank,
          })),
        });
      }

      if (input.traits.length > 0) {
        await tx.personalityScore.createMany({
          data: input.traits.map((trait) => ({
            musicProfileId: saved.id,
            personalityTraitId: trait.id,
            score: trait.score,
          })),
        });
      }

      return saved.id;
    });

    const row = await prisma.musicProfile.findUniqueOrThrow({
      where: { id: profileId },
      include: profileInclude,
    });
    return mapMusicProfile(row);
  },
};
