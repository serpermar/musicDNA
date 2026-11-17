import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-card border border-border bg-surface p-6 ${className}`}>
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      className={`w-full flex-row items-center justify-center rounded-lg px-4 py-4 ${
        secondary ? 'border border-border bg-background' : 'bg-primary'
      } ${disabled ? 'opacity-50' : ''}`}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading && <ActivityIndicator className="mr-2" color="#fff" size="small" />}
      <Text className={`text-sm font-semibold ${secondary ? 'text-text' : 'text-white'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-textMuted">
        {label}
      </Text>
      <TextInput
        autoCapitalize="none"
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8a8a9a"
        secureTextEntry={secureTextEntry}
        value={value}
      />
    </View>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text className="mt-3 text-sm text-pink">{message}</Text>;
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <View className="mb-4">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-xs text-textMuted">{label}</Text>
        <Text className="text-xs text-textMuted">{clamped}</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-pill bg-background">
        <View className="h-full rounded-pill bg-primary" style={{ width: `${clamped}%` }} />
      </View>
    </View>
  );
}
