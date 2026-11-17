import type { SharedProfileView } from '@musicdna/shared';
import { useEffect, useState } from 'react';
import { socialApi } from '../lib/api';
import { errorMessage } from '../lib/error-message';

/** Vista pública de un perfil compartido, sin datos personales. */
export function SharedProfilePage({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<SharedProfileView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    socialApi
      .getSharedProfile(slug)
      .then((response) => {
        if (active) setProfile(response.profile);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-card border border-border bg-surface/80 p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-textMuted">
          Perfil MusicDNA compartido
        </p>
        {profile ? (
          <div className="mt-5 space-y-5">
            <h1 className="font-display text-3xl font-extrabold text-text">
              {profile.personalityName}
            </h1>
            <p className="text-sm leading-relaxed text-textMuted">{profile.description}</p>
            <div className="flex flex-wrap gap-2">
              {[profile.dominantGenre, ...profile.secondaryGenres]
                .filter((genre) => genre !== null)
                .map((genre) => (
                  <span
                    className="rounded-pill border border-border bg-background/60 px-3 py-1.5 text-xs"
                    key={genre.genreId}
                  >
                    {genre.name} · {genre.score}
                  </span>
                ))}
            </div>
            <p className="text-sm text-textMuted">
              Energía {profile.energyScore} · Emoción {profile.emotionalScore} · Década{' '}
              {profile.favoriteDecade ?? 'variada'}
            </p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-textMuted">{error ?? 'Cargando perfil compartido…'}</p>
        )}
        <p className="mt-8 text-xs text-textMuted/70">Your music. Your personality. Your DNA.</p>
      </section>
    </main>
  );
}
