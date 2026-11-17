import type { MusicProfile } from '@musicdna/shared';
import { ScrollView, Text, View } from 'react-native';
import { Card, Button, ScoreBar } from './ui';

export function ResultScreen({
  profile,
  onRetake,
}: {
  profile: MusicProfile;
  onRetake: () => void;
}) {
  const genres = [profile.dominantGenre, ...profile.secondaryGenres].filter(
    (genre) => genre !== null,
  );

  return (
    <ScrollView className="mt-4">
      <Card>
        <Text className="text-xs uppercase tracking-widest text-textMuted">
          Tu personalidad musical
        </Text>
        <Text className="mt-2 font-display text-3xl font-extrabold text-text">
          {profile.personalityName}
        </Text>
        <Text className="mt-3 text-sm leading-relaxed text-textMuted">{profile.description}</Text>
        <Text className="mt-4 text-xs text-textMuted">Algoritmo v{profile.algorithmVersion}</Text>
      </Card>

      {genres.length > 0 && (
        <Card className="mt-4">
          <Text className="mb-3 text-sm font-semibold text-text">Tus géneros</Text>
          <View className="flex-row flex-wrap gap-2">
            {genres.map((genre) => (
              <View
                className="rounded-pill border border-border bg-background px-3 py-2"
                key={genre.genreId}
              >
                <Text className="text-xs text-text">
                  {genre.rank}. {genre.name} · {genre.score}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card className="mt-4">
        <ScoreBar label="Energía" value={profile.energyScore} />
        <ScoreBar label="Emoción" value={profile.emotionalScore} />
        <Text className="mt-2 text-sm text-textMuted">
          Década favorita: {profile.favoriteDecade ?? 'variada'}
        </Text>
      </Card>

      {profile.traits.length > 0 && (
        <Card className="mt-4">
          <Text className="mb-4 text-sm font-semibold text-text">Tus rasgos</Text>
          {profile.traits.map((trait) => (
            <ScoreBar key={trait.traitSlug} label={trait.label} value={trait.score} />
          ))}
        </Card>
      )}

      <View className="mt-6">
        <Button label="Repetir el test" onPress={onRetake} secondary />
      </View>
    </ScrollView>
  );
}
