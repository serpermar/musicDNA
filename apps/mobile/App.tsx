import type {
  AuthSessionPayload,
  CurrentUserResponse,
  MusicProfile,
  SessionInfo,
} from '@musicdna/shared';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AccountScreen } from './src/components/AccountScreen';
import { AuthScreen } from './src/components/AuthScreen';
import { QuizScreen } from './src/components/QuizScreen';
import { ResultScreen } from './src/components/ResultScreen';
import { authApi, quizApi } from './src/lib/api';
import { errorMessage } from './src/lib/error-message';
import './global.css';

type Tab = 'result' | 'quiz' | 'account';

const tabs: ReadonlyArray<{ value: Tab; label: string }> = [
  { value: 'result', label: 'Mi MusicDNA' },
  { value: 'quiz', label: 'Cuestionario' },
  { value: 'account', label: 'Cuenta' },
];

export default function App() {
  const [session, setSession] = useState<AuthSessionPayload | null>(null);
  const [me, setMe] = useState<CurrentUserResponse | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [musicProfile, setMusicProfile] = useState<MusicProfile | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('result');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const current = await authApi.getSession();
      setSession(current);
      if (current) {
        const [meResponse, profileResponse] = await Promise.all([
          authApi.getMe(),
          quizApi.getMyProfile(),
        ]);
        setMe(meResponse);
        setMusicProfile(profileResponse.profile);
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  async function refreshSessions() {
    try {
      setSessions(await authApi.listSessions());
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (session && tab === 'account') void refreshSessions();
  }, [session, tab]);

  function openNewQuiz() {
    setQuizSessionId(null);
    setTab('quiz');
  }

  function reset() {
    setSession(null);
    setMe(null);
    setSessions([]);
    setMusicProfile(null);
    setQuizSessionId(null);
    setTab('result');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-5 py-8">
        <Text className="text-center font-display text-3xl font-extrabold text-primary">
          MusicDNA
        </Text>
        <Text className="mt-1 text-center text-xs text-textMuted">Fase 6 · Aplicación móvil</Text>

        {loading ? (
          <View className="mt-10">
            <Text className="text-center text-sm text-textMuted">Cargando sesión…</Text>
          </View>
        ) : !session ? (
          <AuthScreen onAuthenticated={refresh} />
        ) : (
          <View className="mt-6">
            <View className="mb-5 flex-row gap-2">
              {tabs.map((item) => (
                <Pressable
                  className={`flex-1 rounded-pill px-2 py-2 ${tab === item.value ? 'bg-primary' : 'bg-surface'}`}
                  key={item.value}
                  onPress={() => setTab(item.value)}
                >
                  <Text
                    className={`text-center text-xs font-semibold ${tab === item.value ? 'text-white' : 'text-textMuted'}`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === 'result' &&
              (musicProfile ? (
                <ResultScreen onRetake={openNewQuiz} profile={musicProfile} />
              ) : (
                <View className="rounded-card border border-border bg-surface p-6">
                  <Text className="font-display text-2xl font-bold text-text">
                    Tu ADN musical te espera
                  </Text>
                  <Text className="mt-3 text-sm text-textMuted">
                    Responde unas preguntas sobre tus gustos y descubre tu personalidad musical.
                  </Text>
                  <View className="mt-6">
                    <Pressable className="rounded-lg bg-primary px-5 py-4" onPress={openNewQuiz}>
                      <Text className="text-center text-sm font-semibold text-white">
                        Empezar el cuestionario
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}

            {tab === 'quiz' && (
              <QuizScreen
                onCompleted={(created) => {
                  setMusicProfile(created);
                  setQuizSessionId(null);
                  setTab('result');
                }}
                onSessionId={setQuizSessionId}
                sessionId={quizSessionId}
              />
            )}

            {tab === 'account' && (
              <AccountScreen
                me={me}
                onAccountDeleted={reset}
                onSignedOut={reset}
                session={session}
                sessions={sessions}
              />
            )}
          </View>
        )}

        {error && <Text className="mt-6 text-center text-sm text-pink">{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
