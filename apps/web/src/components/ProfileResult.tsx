import type { MusicProfile } from '@musicdna/shared';

interface Props {
  profile: MusicProfile;
  onRetake: () => void;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-textMuted">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-background">
        <div
          className="h-full rounded-pill bg-brand-gradient"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

/** Resultados visuales del perfil calculado (Fase 5). */
export function ProfileResult({ profile, onRetake }: Props) {
  return (
    <div className="space-y-6 py-2">
      <div className="rounded-card border border-border bg-background/60 p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-textMuted">Tu personalidad musical</p>
        <h3 className="mt-2 font-display text-3xl font-extrabold text-text">
          {profile.personalityName}
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-textMuted">
          {profile.description}
        </p>
        <p className="mt-4 text-xs text-textMuted/70">Algoritmo v{profile.algorithmVersion}</p>
      </div>

      {(profile.dominantGenre || profile.secondaryGenres.length > 0) && (
        <div>
          <p className="mb-3 text-sm font-semibold">Tus géneros</p>
          <div className="flex flex-wrap gap-2">
            {[profile.dominantGenre, ...profile.secondaryGenres]
              .filter((genre) => genre !== null)
              .map((genre) => (
                <span
                  className="rounded-pill border border-border bg-background/60 px-3 py-1.5 text-xs"
                  key={genre.genreId}
                >
                  {genre.rank}. {genre.name} · {genre.score}
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreBar label="Energía" value={profile.energyScore} />
        <ScoreBar label="Emoción" value={profile.emotionalScore} />
      </div>

      {profile.traits.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Tus rasgos</p>
          {profile.traits.map((trait) => (
            <ScoreBar key={trait.traitSlug} label={trait.label} value={trait.score} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm">
        <span className="text-textMuted">
          Década favorita:{' '}
          <strong className="text-text">{profile.favoriteDecade ?? 'variada'}</strong>
        </span>
        <button
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-textMuted transition hover:border-primary hover:text-text"
          onClick={onRetake}
          type="button"
        >
          Repetir el test
        </button>
      </div>
    </div>
  );
}
