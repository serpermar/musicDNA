import type {
  MusicProfile,
  Question,
  QuizSessionDetailResponse,
  UserResponse,
} from '@musicdna/shared';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { quizApi } from '../lib/api';
import { errorMessage } from '../lib/error-message';
import { Button, Card, ErrorText } from './ui';

type Selection = { answerIds: string[]; numericValue?: number; textValue?: string };

const scaleValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function emptySelection(): Selection {
  return { answerIds: [] };
}

function hasAnswer(question: Question, selection: Selection): boolean {
  if (question.type === 'SCALE') return true;
  if (question.type === 'ADAPTIVE' && question.options.length === 0) {
    return Boolean(selection.textValue?.trim());
  }
  return selection.answerIds.length > 0;
}

function toResponse(question: Question, selection: Selection): UserResponse {
  if (question.type === 'SCALE') {
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

interface Props {
  sessionId: string | null;
  onSessionId: (sessionId: string) => void;
  onCompleted: (profile: MusicProfile) => void;
}

/** Cuestionario adaptativo para móvil, con la misma API compartida que la web. */
export function QuizScreen({ sessionId, onSessionId, onCompleted }: Props) {
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
          // Sesión cerrada o inexistente: se crea una nueva.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function answer() {
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
      showDetail(await quizApi.getSession(detail.session.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
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

  function toggle(optionId: string, multiple: boolean) {
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

  if (!detail) {
    return (
      <Card className="mt-6">
        <Text className="text-sm text-textMuted">
          {busy ? 'Preparando tu cuestionario…' : (error ?? 'No se pudo iniciar el cuestionario.')}
        </Text>
        {!busy && (
          <View className="mt-4">
            <Button label="Reintentar" onPress={() => void start()} />
          </View>
        )}
        <ErrorText message={busy ? null : error} />
      </Card>
    );
  }

  const question = detail.view.questions[index];
  const progress = detail.view.progress;

  if (finished || !question) {
    return (
      <Card className="mt-6">
        <Text className="text-lg font-bold text-secondary">¡Has completado el test!</Text>
        <Text className="mt-2 text-sm text-textMuted">
          Tu identidad musical se calculará a partir de {progress.answered} respuestas.
        </Text>
        <View className="mt-6">
          <Button label="Ver mi MusicDNA" loading={busy} onPress={() => void finish()} />
        </View>
        <ErrorText message={error} />
      </Card>
    );
  }

  return (
    <ScrollView className="mt-4" keyboardShouldPersistTaps="handled">
      <Card>
        <View className="mb-4 flex-row justify-between">
          <Text className="text-xs uppercase tracking-widest text-textMuted">
            Pregunta {index + 1} de {progress.total}
          </Text>
          <Text className="text-xs uppercase tracking-widest text-textMuted">
            {progress.percent}%
          </Text>
        </View>
        <View className="mb-6 h-2 overflow-hidden rounded-pill bg-background">
          <View
            className="h-full rounded-pill bg-primary"
            style={{ width: `${progress.percent}%` }}
          />
        </View>

        <Text className="text-xs font-semibold uppercase tracking-widest text-textMuted">
          {question.category}
        </Text>
        <Text className="mt-2 font-display text-2xl font-bold text-text">{question.prompt}</Text>
        {question.helpText && (
          <Text className="mt-2 text-sm text-textMuted">{question.helpText}</Text>
        )}

        <View className="mt-6">
          {question.type === 'SCALE' ? (
            <View>
              <View className="flex-row flex-wrap gap-2">
                {scaleValues.map((value) => {
                  const active = (selection.numericValue ?? 50) === value;
                  return (
                    <Pressable
                      className={`w-14 rounded-lg py-2 ${active ? 'bg-primary' : 'bg-background'}`}
                      key={value}
                      onPress={() =>
                        setSelection((current) => ({ ...current, numericValue: value }))
                      }
                    >
                      <Text
                        className={`text-center text-xs ${active ? 'text-white' : 'text-textMuted'}`}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="mt-3 text-center text-sm text-textMuted">
                Valor: {selection.numericValue ?? 50} / 100
              </Text>
            </View>
          ) : question.type === 'ADAPTIVE' && question.options.length === 0 ? (
            <TextInput
              className="min-h-24 rounded-lg border border-border bg-background px-4 py-3 text-sm text-text"
              maxLength={2000}
              multiline
              onChangeText={(text) => setSelection((current) => ({ ...current, textValue: text }))}
              placeholder="Escribe tu respuesta"
              placeholderTextColor="#8a8a9a"
              value={selection.textValue ?? ''}
            />
          ) : (
            <View className="gap-2">
              {question.options.map((option) => {
                const active = selection.answerIds.includes(option.id);
                return (
                  <Pressable
                    className={`rounded-lg border px-4 py-3 ${
                      active ? 'border-primary bg-primary/15' : 'border-border bg-background'
                    }`}
                    key={option.id}
                    onPress={() => toggle(option.id, question.type === 'MULTIPLE_CHOICE')}
                  >
                    <Text className="text-sm text-text">{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View className="mt-6">
          <Button label="Siguiente" loading={busy} onPress={() => void answer()} />
        </View>
        <ErrorText message={error} />
      </Card>
    </ScrollView>
  );
}
