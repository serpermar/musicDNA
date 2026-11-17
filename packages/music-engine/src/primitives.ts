/** Primitivas puras del algoritmo MusicDNA. */

export const ALGORITHM_VERSION = '1.0.0';

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}

/** Normaliza un valor al rango 0-100. */
export function normalizeScore(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp(((value - min) / (max - min)) * 100);
}

/** Media ponderada de una lista de pares valor/peso. */
export function weightedAverage(values: ReadonlyArray<{ value: number; weight: number }>): number {
  const totalWeight = values.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (totalWeight === 0) return 0;

  const weightedSum = values.reduce(
    (sum, item) => sum + clamp(item.value) * Math.max(0, item.weight),
    0,
  );
  return weightedSum / totalWeight;
}

export interface Affinity {
  key: string;
  score: number;
}

/** Ordena afinidades por puntuación descendente y asigna su posición. */
export function rankAffinities(
  affinities: readonly Affinity[],
): Array<Affinity & { rank: number }> {
  return [...affinities]
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
    .map((affinity, index) => ({ ...affinity, rank: index + 1 }));
}
