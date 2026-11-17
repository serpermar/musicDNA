import type { AuthSessionPayload, CurrentUserResponse, SessionInfo } from '@musicdna/shared';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { authApi } from '../lib/api';
import { errorMessage } from '../lib/error-message';
import { Button, Card, ErrorText, Field } from './ui';

interface Props {
  session: AuthSessionPayload;
  me: CurrentUserResponse | null;
  sessions: SessionInfo[];
  onSignedOut: () => void;
  onAccountDeleted: () => void;
}

export function AccountScreen({ session, me, sessions, onSignedOut, onAccountDeleted }: Props) {
  const [displayName, setDisplayName] = useState(me?.user.displayName ?? '');
  const [bio, setBio] = useState(me?.profile?.bio ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await authApi.updateMe({ displayName, bio });
      Alert.alert('Perfil actualizado');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await authApi.signOut();
      onSignedOut();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function removeAccount() {
    Alert.alert('Eliminar cuenta', '¿Borrar tu cuenta y todos tus datos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await authApi.deleteAccount();
            onAccountDeleted();
          } catch (cause) {
            setError(errorMessage(cause));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  async function revoke(sessionId: string) {
    try {
      await authApi.revokeSession(sessionId);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <ScrollView className="mt-4">
      <Card>
        <Text className="text-xs uppercase tracking-widest text-textMuted">Sesión activa</Text>
        <Text className="mt-2 text-lg font-semibold text-text">
          {session.user.displayName || 'Invitado'}
        </Text>
        <Text className="text-xs text-textMuted">{session.user.email}</Text>
      </Card>

      <Card className="mt-4">
        <Text className="mb-4 text-sm font-semibold text-text">Tu perfil</Text>
        <Field label="Nombre visible" onChangeText={setDisplayName} value={displayName} />
        <Text className="mb-2 mt-2 text-xs font-semibold uppercase tracking-widest text-textMuted">
          Sobre tus gustos
        </Text>
        <TextInput
          className="min-h-20 rounded-lg border border-border bg-background px-4 py-3 text-sm text-text"
          multiline
          onChangeText={setBio}
          placeholder="Cuéntanos algo sobre tus gustos musicales"
          placeholderTextColor="#8a8a9a"
          value={bio}
        />
        <View className="mt-4">
          <Button label="Guardar perfil" loading={busy} onPress={() => void save()} />
        </View>
      </Card>

      <Card className="mt-4">
        <Text className="mb-3 text-sm font-semibold text-text">Sesiones activas</Text>
        {sessions.map((item) => (
          <View className="mb-2 flex-row items-center justify-between" key={item.id}>
            <Text className="flex-1 text-xs text-textMuted" numberOfLines={1}>
              {item.userAgent ?? 'Dispositivo desconocido'}
              {item.isCurrent ? ' · actual' : ''}
            </Text>
            {!item.isCurrent && (
              <Pressable onPress={() => void revoke(item.id)}>
                <Text className="ml-3 text-xs text-pink">Revocar</Text>
              </Pressable>
            )}
          </View>
        ))}
      </Card>

      <View className="mt-6 gap-3">
        <Button label="Cerrar sesión" loading={busy} onPress={() => void signOut()} secondary />
        <Button
          label="Eliminar cuenta"
          loading={busy}
          onPress={() => void removeAccount()}
          secondary
        />
      </View>
      <ErrorText message={error} />
    </ScrollView>
  );
}
