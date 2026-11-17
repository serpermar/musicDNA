import type {
  CreateShareResult,
  MusicProfile,
  ProfileComparison,
  Recommendation,
  SharedProfileView,
} from '@musicdna/shared';
import { useEffect, useState } from 'react';
import { socialApi } from '../lib/api';
import { errorMessage } from '../lib/error-message';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text outline-none transition focus:border-primary';
const buttonClass =
  'w-full rounded-lg bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50';

/** Recomendaciones, historial, enlaces compartidos y comparador (Fase 7). */
export function SocialPanel({ profile }: { profile: MusicProfile }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [history, setHistory] = useState<MusicProfile[]>([]);
  const [spotifyStatus, setSpotifyStatus] = useState<string | null>(null);
  const [share, setShare] = useState<CreateShareResult | null>(null);
  const [slug, setSlug] = useState('');
  const [target, setTarget] = useState<SharedProfileView | null>(null);
  const [comparison, setComparison] = useState<ProfileComparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      socialApi.getRecommendations(),
      socialApi.getProfileHistory(),
      socialApi.getSpotifyStatus(),
    ])
      .then(([recommendationsResponse, historyResponse, spotifyResponse]) => {
        if (!active) return;
        setRecommendations(recommendationsResponse.recommendations);
        setHistory(historyResponse.profiles);
        setSpotifyStatus(spotifyResponse.status);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [profile.id]);

  async function handleShare() {
    setBusy(true);
    setError(null);
    try {
      setShare(await socialApi.createShare({ visibility: 'UNLISTED' }));
      setNotice('Enlace creado. Cópialo para compartir tu perfil.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${share.share.slug}`);
      setNotice('Enlace copiado al portapapeles.');
    } catch {
      setNotice(`Copia manualmente: /s/${share.share.slug}`);
    }
  }

  async function handleLookup() {
    if (!slug.trim()) return;
    setBusy(true);
    setError(null);
    setComparison(null);
    try {
      const response = await socialApi.getSharedProfile(slug.trim());
      setTarget(response.profile);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleCompare() {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const response = await socialApi.createComparison({ targetProfileId: target.profileId });
      setComparison(response.comparison);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 py-2">
      <div>
        <p className="mb-3 text-sm font-semibold">Recomendaciones para ti</p>
        <ul className="space-y-2">
          {recommendations.map((item) => (
            <li
              className="rounded-lg border border-border bg-background/60 px-4 py-3 text-sm"
              key={item.id}
            >
              <div className="flex justify-between gap-3">
                <span className="font-semibold">{item.title}</span>
                <span className="text-xs text-textMuted">{item.score}</span>
              </div>
              {item.reason && <p className="mt-1 text-xs text-textMuted">{item.reason}</p>}
            </li>
          ))}
        </ul>
        {recommendations.length === 0 && (
          <p className="text-sm text-textMuted">Generando recomendaciones…</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold">Comparte tu perfil</p>
        <p className="mt-1 text-xs text-textMuted">
          El enlace no expone tu correo ni tu identificador de usuario.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={buttonClass}
            disabled={busy}
            onClick={() => void handleShare()}
            type="button"
          >
            Crear enlace
          </button>
          {share && (
            <button
              className="rounded-lg border border-border px-4 py-3 text-xs font-semibold text-textMuted transition hover:border-primary hover:text-text"
              onClick={() => void handleCopy()}
              type="button"
            >
              Copiar enlace
            </button>
          )}
        </div>
        {share && <p className="mt-2 break-all text-xs text-secondary">/s/{share.share.slug}</p>}
      </div>

      <div className="rounded-lg border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold">Compara con otro perfil</p>
        <p className="mt-1 text-xs text-textMuted">Pega el código de un enlace compartido.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className={`${inputClass} min-w-48 flex-1`}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Código del enlace"
            value={slug}
          />
          <button
            className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
            disabled={busy || !slug.trim()}
            onClick={() => void handleLookup()}
            type="button"
          >
            Buscar
          </button>
        </div>
        {target && (
          <div className="mt-3 space-y-3">
            <p className="text-sm">
              <strong>{target.personalityName}</strong> · energía {target.energyScore} · emoción{' '}
              {target.emotionalScore}
            </p>
            <button
              className={buttonClass}
              disabled={busy}
              onClick={() => void handleCompare()}
              type="button"
            >
              Comparar perfiles
            </button>
          </div>
        )}
        {comparison && (
          <div className="mt-4 rounded-lg border border-border p-4">
            <p className="font-display text-2xl font-bold text-secondary">
              {comparison.compatibilityScore}%
            </p>
            <p className="mt-1 text-xs text-textMuted">{comparison.description}</p>
            {comparison.sharedGenres.length > 0 && (
              <p className="mt-2 text-xs">
                Géneros compartidos: {comparison.sharedGenres.join(', ')}
              </p>
            )}
            {comparison.differences.length > 0 && (
              <p className="mt-1 text-xs text-textMuted">
                Diferencias: {comparison.differences.join('; ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold">Historial de perfiles</p>
        <ul className="space-y-2">
          {history.map((item) => (
            <li
              className="flex justify-between gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 text-xs"
              key={item.id}
            >
              <span className="font-semibold">{item.personalityName}</span>
              <span className="text-textMuted">
                {new Date(item.createdAt).toLocaleDateString()} · v{item.algorithmVersion}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {spotifyStatus && (
        <p className="text-xs text-textMuted">
          Spotify: {spotifyStatus === 'ACTIVE' ? 'conectado' : 'no conectado (opcional)'}
        </p>
      )}
      {notice && <p className="text-sm text-secondary">{notice}</p>}
      {error && <p className="text-sm text-pink">{error}</p>}
    </div>
  );
}
