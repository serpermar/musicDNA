import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { authApi } from '../lib/api';
import { errorMessage } from '../lib/error-message';
import { Button, Card, ErrorText, Field } from './ui';

type Mode = 'login' | 'register';

const modes: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'login', label: 'Iniciar sesión' },
  { value: 'register', label: 'Crear cuenta' },
];

export function AuthScreen({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') await authApi.signUp({ name, email, password });
      else await authApi.signIn({ email, password });
      await onAuthenticated();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function guest() {
    setBusy(true);
    setError(null);
    try {
      await authApi.signInAsGuest();
      await onAuthenticated();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      className="px-6 py-10"
    >
      <Text className="text-center font-display text-4xl font-extrabold text-primary">
        MusicDNA
      </Text>
      <Text className="mt-2 text-center text-sm text-textMuted">
        Your music. Your personality. Your DNA.
      </Text>

      <Card className="mt-8">
        <View className="mb-6 flex-row gap-2">
          {modes.map((item) => (
            <Pressable
              className={`flex-1 rounded-pill px-3 py-2 ${mode === item.value ? 'bg-primary' : 'bg-background'}`}
              key={item.value}
              onPress={() => {
                setMode(item.value);
                setError(null);
              }}
            >
              <Text
                className={`text-center text-xs font-semibold ${mode === item.value ? 'text-white' : 'text-textMuted'}`}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === 'register' && (
          <Field label="Nombre" onChangeText={setName} placeholder="Tu nombre" value={name} />
        )}
        <Field
          label="Email"
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          value={email}
        />
        <Field
          label="Contraseña"
          onChangeText={setPassword}
          placeholder="Mínimo 10 caracteres"
          secureTextEntry
          value={password}
        />

        <Button
          label={mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          loading={busy}
          onPress={() => void submit()}
        />
        <View className="h-3" />
        <Button
          label="Entrar como invitado"
          loading={busy}
          onPress={() => void guest()}
          secondary
        />
        <ErrorText message={error} />
      </Card>

      <Text className="mt-6 text-center text-xs text-textMuted">
        El test funciona sin Spotify ni IA y usa tu token de sesión en el dispositivo.
      </Text>
    </ScrollView>
  );
}
