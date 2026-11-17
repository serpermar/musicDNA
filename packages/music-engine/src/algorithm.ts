import type { Quiz, UserResponse } from '@musicdna/shared';
import { ALGORITHM_VERSION, clamp, rankAffinities } from './primitives';

/** Puntuación normalizada y ordenada de una dimensión del perfil. */
export interface ScoreBreakdown {
  key: string;
  score: number;
  rank: number;
}

export interface PersonalityDefinition {
  slug: string;
  name: string;
  description: string;
}

export interface PersonalityContext {
  energy: number;
  emotional: number;
  traits: Record<string, number>;
  favoriteDecade: string | null;
  topGenre: string | null;
}

export interface PersonalityArchetype extends PersonalityDefinition {
  /** Evaluado en orden: el primer matches gana. */
  matches: (context: PersonalityContext) => boolean;
}

/**
 * Arquetipos deterministas, sin IA. Se evalúan por prioridad; el último es el fallback.
 * Los umbrales trabajan sobre puntuaciones 0-100 ya normalizadas.
 */
export const PERSONALITIES: readonly PersonalityArchetype[] = [
  {
    slug: 'explorador-nocturno',
    name: 'El Explorador Nocturno',
    description:
      'Te atrae lo nuevo y electrónico. Tu energía te empuja a buscar sonidos que aún no existen en tu biblioteca.',
    matches: ({ energy, traits }) =>
      energy >= 60 && (traits.electronic ?? 0) >= 45 && (traits.curious ?? 0) >= 40,
  },
  {
    slug: 'archivera-sentimental',
    name: 'La Archivera Sentimental',
    description:
      'La emoción y las letras te guían. Cada canción guarda un recuerdo y vuelves a ella cuando necesitas sentir.',
    matches: ({ emotional, traits }) => emotional >= 70 && (traits.lyrical ?? 0) >= 35,
  },
  {
    slug: 'purista-analogico',
    name: 'El Purista Analógico',
    description:
      'Prefieres el sonido orgánico y las décadas clásicas. La guitarra y el directo son tu forma de autenticidad.',
    matches: ({ favoriteDecade, traits }) =>
      favoriteDecade !== null &&
      ['1970s', '1980s', '1990s'].includes(favoriteDecade) &&
      (traits.organic ?? 0) >= 35,
  },
  {
    slug: 'arquitecto-del-ritmo',
    name: 'El Arquitecto del Ritmo',
    description:
      'El beat manda. Construyes tu identidad musical alrededor de la batería, el groove y el movimiento.',
    matches: ({ energy, traits }) => energy >= 60 && (traits.rhythmic ?? 0) >= 45,
  },
  {
    slug: 'catalizador-comunitario',
    name: 'El Catalizador Comunitario',
    description:
      'La música es un lugar compartido. Descubres en directo, con amigos y conviertes cada escucha en un encuentro.',
    matches: ({ traits }) => (traits.communal ?? 0) >= 55,
  },
  {
    slug: 'curador-sonoro',
    name: 'El Curador Sonoro',
    description:
      'Tienes olfato para encontrar joyas. Tus playlists son un mapa de gustos cuidadosamente seleccionados.',
    matches: ({ traits }) => (traits.curated ?? 0) >= 55,
  },
  {
    slug: 'observador-sereno',
    name: 'El Observador Sereno',
    description:
      'Escuchas de cerca y sin prisa. Te importa más la textura y el detalle que el volumen o la corriente.',
    matches: ({ energy, emotional }) => energy < 45 && emotional >= 45,
  },
  {
    slug: 'equilibrista-eclectico',
    name: 'El Equilibrista Ecléctico',
    description:
      'No te encasillas. Tu fuerza es moverte entre géneros, épocas y estados de ánimo con naturalidad.',
    matches: () => true,
  },
];

export interface ProfileCalculation {
  genres: ScoreBreakdown[];
  decades: ScoreBreakdown[];
  instruments: ScoreBreakdown[];
  traits: ScoreBreakdown[];
  energyScore: number;
  emotionalScore: number;
  favoriteDecade: string | null;
  personality: PersonalityDefinition;
  algorithmVersion: string;
}

type ScoreMap = Record<string, number>;

function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function addScores(target: ScoreMap, source: unknown, factor: number): void {
  if (!source || typeof source !== 'object') return;
  for (const [key, raw] of Object.entries(source as Record<string, unknown>)) {
    const value = numeric(raw);
    if (value === null) continue;
    target[key] = (target[key] ?? 0) + value * factor;
  }
}

function ranked(raw: ScoreMap): ScoreBreakdown[] {
  const max = Object.values(raw).reduce((highest, value) => Math.max(highest, value), 0);
  if (max <= 0) return [];

  return rankAffinities(
    Object.entries(raw)
      .filter(([, score]) => score > 0)
      .map(([key, score]) => ({ key, score: Math.round(clamp((score / max) * 100)) })),
  );
}

function selectPersonality(context: PersonalityContext): PersonalityDefinition {
  const archetype = PERSONALITIES.find((candidate) => candidate.matches(context));
  return {
    slug: archetype?.slug ?? 'equilibrista-eclectico',
    name: archetype?.name ?? 'El Equilibrista Ecléctico',
    description: archetype?.description ?? '',
  };
}

/**
 * Calcula el perfil musical a partir de las respuestas del cuestionario.
 * Es una función pura: no consulta base de datos ni depende de servicios externos.
 */
export function calculateProfile(
  quiz: Quiz,
  responses: readonly UserResponse[],
): ProfileCalculation {
  const questions = new Map(quiz.questions.map((question) => [question.id, question]));
  const raw = {
    genres: {} as ScoreMap,
    decades: {} as ScoreMap,
    instruments: {} as ScoreMap,
    traits: {} as ScoreMap,
  };
  const energySamples: Array<{ value: number; weight: number }> = [];
  const emotionalSamples: Array<{ value: number; weight: number }> = [];

  for (const response of responses) {
    const question = questions.get(response.questionId);
    if (!question) continue;

    const weight = question.weight > 0 ? question.weight : 1;
    const selectedIds = new Set(
      [response.answerId, ...(response.answerIds ?? [])].filter(
        (id): id is string => typeof id === 'string',
      ),
    );

    if (response.numericValue !== undefined) {
      if (question.category === 'energy') {
        energySamples.push({ value: response.numericValue, weight });
      } else if (question.category === 'emotional') {
        emotionalSamples.push({ value: response.numericValue, weight });
      }
    }

    for (const option of question.options) {
      if (!selectedIds.has(option.id) || !option.scores) continue;

      addScores(raw.genres, option.scores.genres, weight);
      addScores(raw.traits, option.scores.traits, weight);
      addScores(raw.instruments, option.scores.instruments, weight);

      const decade = option.scores.decade;
      if (typeof decade === 'string') {
        raw.decades[decade] = (raw.decades[decade] ?? 0) + weight;
      }

      const energy = numeric(option.scores.energy);
      if (energy !== null) energySamples.push({ value: energy * 100, weight });

      const emotional = numeric(option.scores.emotional);
      if (emotional !== null) emotionalSamples.push({ value: emotional * 100, weight });
    }
  }

  const genres = ranked(raw.genres);
  const decades = ranked(raw.decades);
  const traits = ranked(raw.traits);
  const traitScores = Object.fromEntries(traits.map((trait) => [trait.key, trait.score]));
  const energyScore = energySamples.length > 0 ? Math.round(weightedScore(energySamples)) : 50;
  const emotionalScore =
    emotionalSamples.length > 0 ? Math.round(weightedScore(emotionalSamples)) : 50;
  const favoriteDecade = decades[0]?.key ?? null;

  return {
    genres,
    decades,
    instruments: ranked(raw.instruments),
    traits,
    energyScore,
    emotionalScore,
    favoriteDecade,
    personality: selectPersonality({
      energy: energyScore,
      emotional: emotionalScore,
      traits: traitScores,
      favoriteDecade,
      topGenre: genres[0]?.key ?? null,
    }),
    algorithmVersion: ALGORITHM_VERSION,
  };
}

function weightedScore(samples: ReadonlyArray<{ value: number; weight: number }>): number {
  const totalWeight = samples.reduce((sum, sample) => sum + Math.max(0, sample.weight), 0);
  if (totalWeight === 0) return 50;
  const total = samples.reduce(
    (sum, sample) => sum + clamp(sample.value) * Math.max(0, sample.weight),
    0,
  );
  return total / totalWeight;
}
