import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import './global.css';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <StatusBar style="light" />
      <View className="w-full max-w-md rounded-card border border-border bg-surface p-8">
        <Text className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-textMuted">
          Fase 1 · Fundación
        </Text>
        <Text className="text-center font-display text-4xl font-extrabold text-text">MusicDNA</Text>
        <Text className="mt-4 text-center text-base text-textMuted">
          Your music. Your personality. Your DNA.
        </Text>
      </View>
    </View>
  );
}
