import { clamp } from './primitives';

/** Datos mínimos de dos perfiles para compararlos. */
export interface ComparableProfile {
  genres: string[];
  energyScore: number;
  emotionalScore: number;
  favoriteDecade: string | null;
  personalitySlug: string;
}

export interface ComparisonResult {
  compatibilityScore: number;
  sharedGenres: string[];
  differences: string[];
  description: string;
}

/**
 * Comparación determinista y simétrica: géneros compartidos, energía,
 * emoción y década. Sin IA y sin servicios externos.
 */
export function compareProfiles(
  source: ComparableProfile,
  target: ComparableProfile,
): ComparisonResult {
  const sourceGenres = new Set(source.genres);
  const targetGenres = new Set(target.genres);
  const sharedGenres = [...sourceGenres]
    .filter((genre) => targetGenres.has(genre))
    .sort((a, b) => a.localeCompare(b));
  const uniqueGenres = new Set([...sourceGenres, ...targetGenres]);
  const genreScore = uniqueGenres.size === 0 ? 0 : (sharedGenres.length / uniqueGenres.size) * 50;

  const energyGap = Math.abs(source.energyScore - target.energyScore);
  const energyScore = (1 - clamp(energyGap) / 100) * 25;
  const emotionalGap = Math.abs(source.emotionalScore - target.emotionalScore);
  const emotionalScore = (1 - clamp(emotionalGap) / 100) * 15;
  const decadeScore =
    source.favoriteDecade && source.favoriteDecade === target.favoriteDecade ? 10 : 0;

  const compatibilityScore = Math.round(
    clamp(genreScore + energyScore + emotionalScore + decadeScore),
  );

  const differences: string[] = [];
  if (energyGap >= 25) {
    differences.push(`Energía distante (${source.energyScore} frente a ${target.energyScore})`);
  }
  if (emotionalGap >= 25) {
    differences.push(
      `Emoción distante (${source.emotionalScore} frente a ${target.emotionalScore})`,
    );
  }
  if (source.favoriteDecade !== target.favoriteDecade) {
    differences.push('Décadas favoritas distintas');
  }
  if (source.personalitySlug !== target.personalitySlug) {
    differences.push('Arquetipos diferentes');
  }

  const description =
    compatibilityScore >= 70
      ? 'Vuestras identidades musicales se parecen mucho: hay una base sólida para compartir escuchas.'
      : compatibilityScore >= 40
        ? 'Tenéis puntos de encuentro claros, con espacio para descubrir música nueva juntos.'
        : 'Vuestros gustos son muy distintos: una buena oportunidad para ampliar el mapa musical.';

  return { compatibilityScore, sharedGenres, differences, description };
}
