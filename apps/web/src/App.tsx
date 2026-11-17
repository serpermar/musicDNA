import type {
  AuthSessionPayload,
  CurrentUserResponse,
  MusicProfile,
  SessionInfo,
} from '@musicdna/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { ProfileResult } from './components/ProfileResult';
import { QuizFlow } from './components/QuizFlow';
import { authApi, quizApi } from './lib/api';
import { errorMessage } from './lib/error-message';

type Mode = 'login' | 'register' | 'reset-request' | 'reset-confirm';
type Tab = 'result' | 'quiz' | 'account';

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text outline-none transition focus:border-primary';
const buttonClass =
  'w-full rounded-lg bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50';
const tabClass = (active: boolean) =>
  `rounded-pill px-3 py-1.5 text-xs font-semibold transition ${
    active ? 'bg-primary text-white' : 'bg-background text-textMuted'
  }`;

export default function App() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [token, setToken] = useState(() => new URLSearchParams(location.search).get('token') ?? '');
  const [session, setSession] = useState<AuthSessionPayload | null>(null);
  const [profile, setProfile] = useState<CurrentUserResponse | null>(null);
  const [musicProfile, setMusicProfile] = useState<MusicProfile | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [tab, setTab] = useState<Tab>('result');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const current = await authApi.getSession();
      setSession(current);
      if (current) {
        const [me, list, music] = await Promise.all([
          authApi.getMe(),
          authApi.listSessions(),
          quizApi.getMyProfile(),
        ]);
        setProfile(me);
        setSessions(list);
        setMusicProfile(music.profile);
        setDisplayName(me.user.displayName);
        setBio(me.profile?.bio ?? '');
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'register') {
        await authApi.signUp({ name, email, password });
        await refresh();
      } else if (mode === 'login') {
        await authApi.signIn({ email, password });
        await refresh();
      } else if (mode === 'reset-request') {
        await authApi.requestPasswordReset({ email });
        setNotice('Si el email existe, se ha generado un enlace de recuperación.');
      } else {
        await authApi.resetPassword({ token, newPassword });
        setNotice('Contraseña actualizada. Ya puedes iniciar sesión.');
        setMode('login');
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleGuest() {
    setBusy(true);
    setError(null);
    try {
      await authApi.signInAsGuest();
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await authApi.updateMe({ displayName, bio });
      setProfile(updated);
      setNotice('Perfil actualizado.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function openNewQuiz() {
    setQuizSessionId(null);
    setTab('quiz');
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await authApi.signOut();
      setSession(null);
      setProfile(null);
      setMusicProfile(null);
      setQuizSessionId(null);
      setSessions([]);
      setTab('result');
      setNotice('Sesión cerrada.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(sessionId: string) {
    try {
      await authApi.revokeSession(sessionId);
      setSessions((current) => current.filter((item) => item.id !== sessionId));
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('¿Eliminar tu cuenta y todos tus datos? Esta acción no se puede deshacer.'))
      return;
    setBusy(true);
    try {
      await authApi.deleteAccount();
      setSession(null);
      setProfile(null);
      setMusicProfile(null);
      setQuizSessionId(null);
      setSessions([]);
      setNotice('Cuenta eliminada.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />

      <section className="relative w-full max-w-3xl rounded-card border border-border bg-surface/80 p-8 shadow-2xl backdrop-blur sm:p-10">
        <span className="inline-flex items-center rounded-pill bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-textMuted">
          Fase 5 · Aplicación web
        </span>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-brand-gradient bg-clip-text text-transparent">MusicDNA</span>
        </h1>
        <p className="mt-2 text-sm text-textMuted">Your music. Your personality. Your DNA.</p>

        {loading ? (
          <p className="mt-10 text-sm text-textMuted">Cargando sesión…</p>
        ) : session ? (
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-background/60 p-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-textMuted">Sesión activa</p>
                <p className="mt-2 text-lg font-semibold">
                  {session.user.displayName || 'Invitado'}
                </p>
                <p className="break-all text-xs text-textMuted">
                  {session.user.email} {session.user.isGuest ? '· cuenta de invitado' : ''}
                </p>
              </div>
              <button
                className="rounded-lg bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                onClick={openNewQuiz}
                type="button"
              >
                {musicProfile ? 'Hacer el test de nuevo' : 'Descubrir mi MusicDNA'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['result', 'Mi MusicDNA'],
                  ['quiz', 'Cuestionario'],
                  ['account', 'Mi cuenta'],
                ] as const
              ).map(([value, label]) => (
                <button
                  className={tabClass(tab === value)}
                  key={value}
                  onClick={() => setTab(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'result' &&
              (musicProfile ? (
                <ProfileResult onRetake={openNewQuiz} profile={musicProfile} />
              ) : (
                <div className="rounded-card border border-border bg-background/60 p-8 text-center">
                  <p className="font-display text-2xl font-bold">Tu ADN musical te espera</p>
                  <p className="mx-auto mt-3 max-w-lg text-sm text-textMuted">
                    Responde unas preguntas sobre tus gustos y descubre tu personalidad musical, tus
                    géneros dominantes y tu energía.
                  </p>
                  <button
                    className="mt-6 rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    onClick={openNewQuiz}
                    type="button"
                  >
                    Empezar el cuestionario
                  </button>
                </div>
              ))}

            {tab === 'quiz' && (
              <QuizFlow
                onCompleted={(created) => {
                  setMusicProfile(created);
                  setQuizSessionId(null);
                  setTab('result');
                  setNotice('Tu MusicDNA se ha generado correctamente.');
                }}
                onSessionId={setQuizSessionId}
                sessionId={quizSessionId}
              />
            )}

            {tab === 'account' && (
              <div className="space-y-6">
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <p className="text-sm font-semibold">Perfil musical</p>
                  <input
                    className={inputClass}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Nombre visible"
                    minLength={2}
                    maxLength={80}
                  />
                  <textarea
                    className={inputClass}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="Cuéntanos algo sobre tus gustos musicales"
                    maxLength={500}
                    rows={3}
                  />
                  <button className={buttonClass} disabled={busy} type="submit">
                    Guardar perfil
                  </button>
                </form>

                <div>
                  <p className="mb-2 text-sm font-semibold">Sesiones activas</p>
                  <ul className="space-y-2">
                    {sessions.map((item) => (
                      <li
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 text-xs"
                        key={item.id}
                      >
                        <span className="truncate text-textMuted">
                          {item.userAgent ?? 'Dispositivo desconocido'}
                          {item.isCurrent ? ' · actual' : ''}
                        </span>
                        {!item.isCurrent && (
                          <button
                            className="shrink-0 text-pink underline"
                            onClick={() => void handleRevoke(item.id)}
                            type="button"
                          >
                            Revocar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className={buttonClass}
                    disabled={busy}
                    onClick={() => void handleSignOut()}
                    type="button"
                  >
                    Cerrar sesión
                  </button>
                  <button
                    className="w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-textMuted transition hover:border-pink hover:text-pink disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void handleDeleteAccount()}
                    type="button"
                  >
                    Eliminar cuenta
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['login', 'Iniciar sesión'],
                  ['register', 'Registro'],
                  ['reset-request', 'Recuperar'],
                  ['reset-confirm', 'Nueva contraseña'],
                ] as const
              ).map(([value, label]) => (
                <button
                  className={tabClass(mode === value)}
                  key={value}
                  onClick={() => {
                    setMode(value);
                    setError(null);
                    setNotice(null);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'register' && (
              <input
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre"
                minLength={2}
                maxLength={80}
                required
              />
            )}

            {mode !== 'reset-confirm' && (
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            )}

            {(mode === 'login' || mode === 'register') && (
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Contraseña (mínimo 10 caracteres)"
                minLength={10}
                maxLength={128}
                required
              />
            )}

            {mode === 'reset-confirm' && (
              <>
                <input
                  className={inputClass}
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Token de recuperación"
                  required
                />
                <input
                  className={inputClass}
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Nueva contraseña"
                  minLength={10}
                  maxLength={128}
                  required
                />
              </>
            )}

            <button className={buttonClass} disabled={busy} type="submit">
              {mode === 'login'
                ? 'Entrar'
                : mode === 'register'
                  ? 'Crear cuenta'
                  : mode === 'reset-request'
                    ? 'Enviar enlace'
                    : 'Actualizar contraseña'}
            </button>

            <button
              className="w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-textMuted transition hover:border-primary hover:text-text disabled:opacity-50"
              disabled={busy}
              onClick={() => void handleGuest()}
              type="button"
            >
              Entrar como invitado
            </button>
          </form>
        )}

        {notice && <p className="mt-6 text-sm text-secondary">{notice}</p>}
        {error && <p className="mt-6 text-sm text-pink">{error}</p>}

        <p className="mt-8 text-xs leading-relaxed text-textMuted/70">
          El cuestionario funciona sin Spotify ni IA. Tus resultados se calculan en el backend y se
          guardan asociados a tu cuenta o invitado.
        </p>
      </section>
    </main>
  );
}
