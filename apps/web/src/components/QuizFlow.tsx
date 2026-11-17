import type {
  MusicProfile,
  QuizSessionDetailResponse,
  Question,
  UserResponse,
} from '@musicdna/shared';
import { useEffect, useState } from 'react';
import { quizApi } from '../lib/api';
import { errorMessage } from '../lib/error-message';

type Selection = { answerIds: string[]; numericValue?: number; textValue?: string };

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text outline-none transition focus:border-primary';
const buttonClass =
  'w-full rounded-lg bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50';

function emptySelection(): Selection {
  return { answerIds: [] };
}

function toResponse(question: Question, selection: Selection): UserResponse {
  if (question.type === 'SCALE') {
    // El slider muestra 50 por defecto; ese valor es una respuesta válida.
    return { questionId: question.id, numericValue: selection.numericValue ?? 50 };
  }
  if (question.type === 'MULTIPLE_CHOICE') {
    return { questionId: question.id, answerIds: selection.answerIds };
  }
  if (question.type === 'ADAPTIVE' && question.options.length === 0) {
    return { questionId: question.id, textValue: selection.textValue?.trim() ?? '' };
  }
  return { questionId: question.id, answerIds: selection.answerIds };
}

function hasAnswer(question: Question, selection: Selection): boolean {
  if (question.type === 'SCALE') return true;
  if (question.type === 'ADAPTIVE' && question.options.length === 0) {
    return Boolean(selection.textValue?.trim());
  }
  return selection.answerIds.length > 0;
}

interface Props {
  /** Sesión IN_PROGRESS a reanudar; si no existe o está cerrada se crea una nueva. */
  sessionId: string | null;
  onSessionId: (sessionId: string) => void;
  onCompleted: (profile: MusicProfile) => void;
}

/** Flujo completo del cuestionario: sesión, preguntas adaptativas y generación de perfil. */
export function QuizFlow({ sessionId, onSessionId, onCompleted }: Props) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId);
  const [detail, setDetail] = useState<QuizSessionDetailResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function showDetail(loaded: QuizSessionDetailResponse) {
    setDetail(loaded);
    const next = loaded.view.nextQuestionIndex;
    setFinished(next === -1);
    setIndex(next === -1 ? loaded.view.questions.length : next);
    setSelection(emptySelection());
  }

  async function start() {
    setBusy(true);
    setError(null);
    try {
      if (activeSessionId) {
        try {
          const loaded = await quizApi.getSession(activeSessionId);
          if (loaded.session.status === 'IN_PROGRESS') {
            showDetail(loaded);
            return;
          }
        } catch {
          // La sesión ya no existe o no pertenece al usuario: se crea otra.
        }
      }

      const active = await quizApi.getActiveQuiz();
      if (!active.quiz) throw new Error('No hay un cuestionario activo disponible.');
      const created = await quizApi.createSession({ quizId: active.quiz.id });
      setActiveSessionId(created.session.id);
      onSessionId(created.session.id);
      showDetail(await quizApi.getSession(created.session.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void start();
    // La sesión se reanuda solo al montar; los cambios posteriores los gestiona este componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAnswer() {
    if (!detail) return;
    const current = detail.view.questions[index];
    if (!current) return;
    if (!hasAnswer(current, selection)) {
      setError('Selecciona una respuesta para continuar.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await quizApi.submitResponse(detail.session.id, toResponse(current, selection));
      // La vista devuelta por el backend ya incluye la siguiente pregunta pendiente.
      showDetail(await quizApi.getSession(detail.session.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish() {
    if (!detail) return;
    setBusy(true);
    setError(null);
    try {
      await quizApi.completeSession(detail.session.id);
      const { profile } = await quizApi.generateProfile(detail.session.id);
      onCompleted(profile);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function toggleAnswer(optionId: string, multiple: boolean) {
    setSelection((current) => {
      if (!multiple) return { answerIds: [optionId] };
      const selected = current.answerIds.includes(optionId);
      return {
        ...current,
        answerIds: selected
          ? current.answerIds.filter((id) => id !== optionId)
          : [...current.answerIds, optionId],
      };
    });
  }

  if (busy && !detail) {
    return <p className="py-10 text-sm text-textMuted">Preparando tu cuestionario…</p>;
  }

  if (!detail) {
    return (
      <div className="space-y-4 py-6">
        <p className="text-sm text-pink">{error ?? 'No se pudo iniciar el cuestionario.'}</p>
        <button className={buttonClass} onClick={() => void start()} type="button">
          Reintentar
        </button>
      </div>
    );
  }

  const question = detail.view.questions[index];
  const progress = detail.view.progress;

  if (finished || !question) {
    return (
      <div className="space-y-5 py-6 text-center">
        <p className="text-sm font-semibold text-secondary">¡Has completado el test!</p>
        <p className="text-sm text-textMuted">
          Tu identidad musical está lista para calcularse a partir de {progress.answered}{' '}
          respuestas.
        </p>
        <button
          className={buttonClass}
          disabled={busy}
          onClick={() => void handleFinish()}
          type="button"
        >
          {busy ? 'Calculando…' : 'Ver mi MusicDNA'}
        </button>
        {error && <p className="text-sm text-pink">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div>
        <div className="mb-2 flex justify-between text-xs uppercase tracking-widest text-textMuted">
          <span>
            Pregunta {index + 1} de {progress.total}
          </span>
          <span>{progress.percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-pill bg-background">
          <div
            className="h-full rounded-pill bg-brand-gradient transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <div>
        <span className="rounded-pill bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-textMuted">
          {question.category}
        </span>
        <h3 className="mt-3 font-display text-2xl font-bold">{question.prompt}</h3>
        {question.helpText && <p className="mt-2 text-sm text-textMuted">{question.helpText}</p>}
      </div>

      {question.type === 'SCALE' ? (
        <div className="space-y-2">
          <input
            aria-label="Valor de la escala"
            className="w-full accent-pink"
            max={100}
            min={0}
            onChange={(event) =>
              setSelection((current) => ({
                ...current,
                numericValue: Number(event.target.value),
              }))
            }
            type="range"
            value={selection.numericValue ?? 50}
          />
          <p className="text-center text-sm font-semibold text-textMuted">
            {selection.numericValue ?? 50} / 100
          </p>
        </div>
      ) : question.type === 'ADAPTIVE' && question.options.length === 0 ? (
        <textarea
          className={inputClass}
          maxLength={2000}
          onChange={(event) =>
            setSelection((current) => ({ ...current, textValue: event.target.value }))
          }
          placeholder="Escribe tu respuesta"
          rows={4}
          value={selection.textValue ?? ''}
        />
      ) : (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm transition hover:border-primary"
              key={option.id}
            >
              <input
                checked={selection.answerIds.includes(option.id)}
                className="accent-pink"
                name={`question-${question.id}`}
                onChange={() => toggleAnswer(option.id, question.type === 'MULTIPLE_CHOICE')}
                type={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}

      <button
        className={buttonClass}
        disabled={busy}
        onClick={() => void handleAnswer()}
        type="button"
      >
        {busy
          ? 'Guardando…'
          : index === detail.view.questions.length - 1
            ? 'Última respuesta'
            : 'Siguiente'}
      </button>

      {error && <p className="text-sm text-pink">{error}</p>}
    </div>
  );
}
