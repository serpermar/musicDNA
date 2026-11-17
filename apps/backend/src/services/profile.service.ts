import { calculateProfile } from '@musicdna/music-engine';
import type { MusicProfile, Quiz, QuizSession, UserResponse } from '@musicdna/shared';
import { profileRepository, type CreateProfileData } from '../repositories/profile.repository';
import { badRequest, forbidden, notFound } from '../utils/http-error';

/** Contrato mínimo del repositorio de perfiles (Fase 4). */
export interface ProfileRepositoryPort {
  findSession(id: string): Promise<QuizSession | null>;
  findQuiz(id: string): Promise<Quiz | null>;
  findResponses(sessionId: string): Promise<UserResponse[]>;
  findGenresBySlugs(
    slugs: readonly string[],
  ): Promise<Array<{ id: string; slug: string; name: string }>>;
  findTraitsBySlugs(
    slugs: readonly string[],
  ): Promise<Array<{ id: string; slug: string; label: string }>>;
  findLatestProfile(userId: string): Promise<MusicProfile | null>;
  createProfile(input: CreateProfileData): Promise<MusicProfile>;
}

export type ProfileService = ReturnType<typeof createProfileService>;

export function createProfileService(repository: ProfileRepositoryPort) {
  async function generate(userId: string, sessionId: string): Promise<MusicProfile> {
    const session = await repository.findSession(sessionId);
    if (!session) throw notFound('Sesión de quiz no encontrada');
    if (session.userId !== userId) throw forbidden('No tienes acceso a esta sesión');
    if (session.status !== 'COMPLETED') {
      throw badRequest('La sesión debe estar completada para generar un perfil');
    }

    const quiz = await repository.findQuiz(session.quizId);
    if (!quiz) throw notFound('Quiz no encontrado');

    const responses = await repository.findResponses(sessionId);
    const calculation = calculateProfile(quiz, responses);

    const [genres, traits] = await Promise.all([
      repository.findGenresBySlugs(calculation.genres.map((item) => item.key)),
      repository.findTraitsBySlugs(calculation.traits.map((item) => item.key)),
    ]);

    const genreIds = new Map(genres.map((genre) => [genre.slug, genre.id]));
    const traitIds = new Map(traits.map((trait) => [trait.slug, trait.id]));

    return repository.createProfile({
      userId,
      sessionId,
      calculation,
      genres: calculation.genres.flatMap((genre) => {
        const id = genreIds.get(genre.key);
        return id ? [{ id, score: genre.score, rank: genre.rank }] : [];
      }),
      traits: calculation.traits.flatMap((trait) => {
        const id = traitIds.get(trait.key);
        return id ? [{ id, score: trait.score }] : [];
      }),
    });
  }

  async function getLatest(userId: string): Promise<MusicProfile | null> {
    return repository.findLatestProfile(userId);
  }

  return { generate, getLatest };
}

export const profileService = createProfileService(profileRepository);
