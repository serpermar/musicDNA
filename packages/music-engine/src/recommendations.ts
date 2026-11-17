import type { MusicProfile, RecommendationKind } from '@musicdna/shared';
import { clamp } from './primitives';

/** Recomendación calculada, sin dependencias externas ni Spotify. */
export interface RecommendationSeed {
  kind: RecommendationKind;
  title: string;
  reason: string | null;
  score: number;
  genreSlug: string | null;
}

/**
 * Genera recomendaciones explicables a partir de un perfil ya calculado.
 * El orden es determinista: mayor puntuación primero y, en empate, por título.
 */
export function buildRecommendations(profile: MusicProfile): RecommendationSeed[] {
  const seeds: RecommendationSeed[] = [];
  const genres = [profile.dominantGenre, ...profile.secondaryGenres].filter(
    (genre) => genre !== null,
  );

  for (const genre of genres) {
    seeds.push({
      kind: 'GENRE',
      title: `Explora más de ${genre.name}`,
      reason:
        genre.rank === 1
          ? 'Es tu género dominante: profundizar aquí suele ser el siguiente paso natural.'
          : `Aparece entre tus géneros favoritos con una afinidad de ${genre.score}.`,
      score: clamp(genre.score),
      genreSlug: genre.slug,
    });
  }

  if (profile.energyScore < 45) {
    seeds.push({
      kind: 'PLAYLIST',
      title: 'Escucha de baja intensidad',
      reason: 'Tu perfil prefiere texturas calmadas: busca sesiones largas y sin prisas.',
      score: 90,
      genreSlug: null,
    });
  } else if (profile.energyScore >= 70) {
    seeds.push({
      kind: 'PLAYLIST',
      title: 'Playlist de alta energía',
      reason: 'Tu energía alta pide ritmos sostenidos y canciones que no bajen el pulso.',
      score: 90,
      genreSlug: null,
    });
  } else {
    seeds.push({
      kind: 'PLAYLIST',
      title: 'Equilibrio entre calma y movimiento',
      reason: 'Tu energía es intermedia: alterna momentos suaves con picos controlados.',
      score: 80,
      genreSlug: null,
    });
  }

  if (profile.favoriteDecade) {
    seeds.push({
      kind: 'GENRE',
      title: `Viaje sonoro a los ${profile.favoriteDecade}`,
      reason: 'Tu década favorita es una vía directa para encontrar joyas relacionadas.',
      score: 75,
      genreSlug: null,
    });
  }

  const traitSlugs = new Set(profile.traits.map((trait) => trait.traitSlug));
  if (traitSlugs.has('curated')) {
    seeds.push({
      kind: 'PLAYLIST',
      title: 'Selección para coleccionistas',
      reason: 'Tu rasgo de curaduría encaja con listas cuidadosamente ordenadas.',
      score: 70,
      genreSlug: null,
    });
  }
  if (traitSlugs.has('communal')) {
    seeds.push({
      kind: 'PLAYLIST',
      title: 'Música para compartir en directo',
      reason: 'Tu perfil comunitario disfruta más de la música cuando es compartida.',
      score: 70,
      genreSlug: null,
    });
  }

  // La recommendations de un género domina sobre las genéricas; se deduplica por título.
  const seen = new Set<string>();
  return seeds
    .filter((seed) => {
      if (seen.has(seed.title)) return false;
      seen.add(seed.title);
      return true;
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 8);
}
