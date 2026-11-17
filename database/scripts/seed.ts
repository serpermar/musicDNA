/**
 * Seed de la Fase 3: crea el quiz "MusicDNA Core" con preguntas y respuestas.
 * Idempotente: se puede ejecutar varias veces sin duplicar contenido.
 *
 * Uso: pnpm db:seed
 */
import { readFileSync } from 'node:fs';
import { Prisma, PrismaClient, QuizQuestionType } from '@prisma/client';

// Los scripts se ejecutan desde apps/backend, pero .env vive en la raíz del monorepo.
try {
  const envContent = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
} catch {
  // .env es opcional: también se puede exportar DATABASE_URL en el entorno.
}

const prisma = new PrismaClient();

type AnswerSeed = {
  label: string;
  value: string;
  scores: Record<string, unknown>;
};

type QuestionSeed = {
  key: string;
  prompt: string;
  type: QuizQuestionType;
  category: string;
  helpText?: string;
  weight?: number;
  isAdaptive?: boolean;
  metadata?: Record<string, unknown>;
  answers: AnswerSeed[];
};

const baseQuestions: QuestionSeed[] = [
  {
    key: 'energy_base',
    prompt: '¿Con cuánta energía sueles escuchar música?',
    helpText: 'Mueve el deslizador hasta donde te sientas identificado.',
    type: QuizQuestionType.SCALE,
    category: 'energy',
    answers: [],
  },
  {
    key: 'mood_core',
    prompt: '¿Qué estado de ánimo buscas más a menudo en la música?',
    type: QuizQuestionType.SINGLE_CHOICE,
    category: 'personality',
    answers: [
      { label: 'Motivación', value: 'motivation', scores: { energy: 0.8, emotional: 0.5 } },
      { label: 'Calma', value: 'calm', scores: { energy: 0.2, emotional: 0.6 } },
      { label: 'Nostalgia', value: 'nostalgia', scores: { energy: 0.4, emotional: 0.9 } },
      { label: 'Alegría', value: 'joy', scores: { energy: 0.7, emotional: 0.7 } },
    ],
  },
  {
    key: 'genres_top',
    prompt: '¿Qué géneros te atraen más? (puedes elegir varios)',
    type: QuizQuestionType.MULTIPLE_CHOICE,
    category: 'genres',
    answers: [
      { label: 'Indie', value: 'indie', scores: { genres: { indie: 2 } } },
      { label: 'Rock', value: 'rock', scores: { genres: { rock: 2 } } },
      { label: 'Electrónica', value: 'electronic', scores: { genres: { electronic: 2 } } },
      { label: 'Hip-hop', value: 'hiphop', scores: { genres: { hiphop: 2 } } },
      { label: 'Jazz', value: 'jazz', scores: { genres: { jazz: 2 } } },
      { label: 'Pop', value: 'pop', scores: { genres: { pop: 2 } } },
      { label: 'Metal', value: 'metal', scores: { genres: { metal: 2 } } },
      { label: 'Folk', value: 'folk', scores: { genres: { folk: 2 } } },
    ],
  },
  {
    key: 'favorite_decade',
    prompt: '¿Qué década te suena más tuya?',
    type: QuizQuestionType.SINGLE_CHOICE,
    category: 'decades',
    answers: [
      { label: 'Años 70', value: '1970s', scores: { decade: '1970s' } },
      { label: 'Años 80', value: '1980s', scores: { decade: '1980s' } },
      { label: 'Años 90', value: '1990s', scores: { decade: '1990s' } },
      { label: 'Años 2000', value: '2000s', scores: { decade: '2000s' } },
      { label: 'Años 2010', value: '2010s', scores: { decade: '2010s' } },
      { label: 'Años 2020', value: '2020s', scores: { decade: '2020s' } },
    ],
  },
  {
    key: 'instruments',
    prompt: '¿Qué sonidos te llaman más la atención? (elige hasta tres)',
    type: QuizQuestionType.MULTIPLE_CHOICE,
    category: 'instruments',
    answers: [
      { label: 'Guitarra', value: 'guitar', scores: { traits: { organic: 1 } } },
      { label: 'Sintetizadores', value: 'synth', scores: { traits: { electronic: 1 } } },
      { label: 'Batería', value: 'drums', scores: { traits: { rhythmic: 1 } } },
      { label: 'Piano', value: 'piano', scores: { traits: { melodic: 1 } } },
      { label: 'Voz', value: 'vocals', scores: { traits: { vocal: 1 } } },
      { label: 'Cuerdas', value: 'strings', scores: { traits: { orchestral: 1 } } },
    ],
  },
  {
    key: 'lyrics_vs_sound',
    prompt: 'Cuando descubres una canción, ¿qué te engancha primero?',
    type: QuizQuestionType.TWO_OPTION,
    category: 'lyrics',
    answers: [
      { label: 'Las letras', value: 'lyrics', scores: { traits: { lyrical: 1 } } },
      { label: 'El sonido', value: 'sound', scores: { traits: { sonic: 1 } } },
    ],
  },
  {
    key: 'discovery_habit',
    prompt: '¿Cómo sueles descubrir música nueva?',
    type: QuizQuestionType.SINGLE_CHOICE,
    category: 'habits',
    answers: [
      { label: 'Playlists editoriales', value: 'playlists', scores: { traits: { curated: 1 } } },
      { label: 'Recomendaciones de amigos', value: 'friends', scores: { traits: { social: 1 } } },
      { label: 'Radio y podcasts', value: 'radio', scores: { traits: { curious: 1 } } },
      { label: 'Redes sociales', value: 'social_media', scores: { traits: { trendy: 1 } } },
    ],
  },
  {
    key: 'listening_context',
    prompt: '¿Con quién escuchas música más a menudo?',
    type: QuizQuestionType.SINGLE_CHOICE,
    category: 'habits',
    answers: [
      { label: 'A solas', value: 'alone', scores: { traits: { introspective: 1 } } },
      { label: 'Con amigos', value: 'friends', scores: { traits: { communal: 1 } } },
      { label: 'En comunidad / directos', value: 'community', scores: { traits: { communal: 2 } } },
    ],
  },
];

const genreSeeds = [
  { slug: 'indie', name: 'Indie' },
  { slug: 'rock', name: 'Rock' },
  { slug: 'electronic', name: 'Electrónica' },
  { slug: 'hiphop', name: 'Hip-hop' },
  { slug: 'jazz', name: 'Jazz' },
  { slug: 'pop', name: 'Pop' },
  { slug: 'metal', name: 'Metal' },
  { slug: 'folk', name: 'Folk' },
];

const traitSeeds = [
  { slug: 'organic', label: 'Orgánico' },
  { slug: 'electronic', label: 'Electrónico' },
  { slug: 'rhythmic', label: 'Rítmico' },
  { slug: 'melodic', label: 'Melódico' },
  { slug: 'vocal', label: 'Vocal' },
  { slug: 'orchestral', label: 'Orquestal' },
  { slug: 'lyrical', label: 'Lírico' },
  { slug: 'sonic', label: 'Sonoro' },
  { slug: 'curated', label: 'Curaduría' },
  { slug: 'social', label: 'Social' },
  { slug: 'curious', label: 'Curioso' },
  { slug: 'trendy', label: 'Tendencias' },
  { slug: 'introspective', label: 'Introspectivo' },
  { slug: 'communal', label: 'Comunitario' },
];

async function seedQuestion(
  quizId: string,
  definition: QuestionSeed,
  position: number,
): Promise<string> {
  const question = await prisma.question.upsert({
    where: { quizId_key: { quizId, key: definition.key } },
    create: {
      quizId,
      key: definition.key,
      prompt: definition.prompt,
      helpText: definition.helpText ?? null,
      type: definition.type,
      category: definition.category,
      weight: definition.weight ?? 1,
      position,
      isActive: true,
      isAdaptive: definition.isAdaptive ?? false,
      metadata: definition.metadata
        ? (definition.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
    update: {
      prompt: definition.prompt,
      helpText: definition.helpText ?? null,
      type: definition.type,
      category: definition.category,
      weight: definition.weight ?? 1,
      position,
      isActive: true,
      isAdaptive: definition.isAdaptive ?? false,
      metadata: definition.metadata
        ? (definition.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });

  for (const [answerPosition, answer] of definition.answers.entries()) {
    const scores = answer.scores as Prisma.InputJsonValue;
    await prisma.answer.upsert({
      where: { questionId_value: { questionId: question.id, value: answer.value } },
      create: {
        questionId: question.id,
        label: answer.label,
        value: answer.value,
        position: answerPosition,
        isActive: true,
        scores,
      },
      update: { label: answer.label, position: answerPosition, isActive: true, scores },
    });
  }

  return question.id;
}

async function main(): Promise<void> {
  await Promise.all(
    genreSeeds.map((genre) =>
      prisma.musicGenre.upsert({
        where: { slug: genre.slug },
        create: genre,
        update: { name: genre.name },
      }),
    ),
  );
  await Promise.all(
    traitSeeds.map((trait) =>
      prisma.personalityTrait.upsert({
        where: { slug: trait.slug },
        create: trait,
        update: { label: trait.label },
      }),
    ),
  );

  const quiz = await prisma.quiz.upsert({
    where: { slug: 'musicdna-core' },
    create: {
      slug: 'musicdna-core',
      title: 'MusicDNA Core',
      description: 'Cuestionario base para construir tu perfil musical.',
      version: 1,
      isActive: true,
    },
    update: { title: 'MusicDNA Core', isActive: true },
  });

  const ids = new Map<string, string>();
  for (const [position, definition] of baseQuestions.entries()) {
    ids.set(definition.key, await seedQuestion(quiz.id, definition, position));
  }

  const energyQuestionId = ids.get('energy_base');
  if (energyQuestionId) {
    await seedQuestion(
      quiz.id,
      {
        key: 'high_energy_style',
        prompt: 'Con esa energía, ¿qué te apetece hacer mientras escuchas?',
        type: QuizQuestionType.ADAPTIVE,
        category: 'energy',
        isAdaptive: true,
        metadata: { showIf: { questionId: energyQuestionId, numericMin: 60 } },
        answers: [
          { label: 'Bailar', value: 'dance', scores: { energy: 1, traits: { rhythmic: 1 } } },
          {
            label: 'Cantar a todo pulmón',
            value: 'sing',
            scores: { energy: 1, traits: { vocal: 1 } },
          },
          {
            label: 'Ir a un directo',
            value: 'live',
            scores: { energy: 1, traits: { communal: 1 } },
          },
        ],
      },
      baseQuestions.length,
    );
  }

  console.log(
    `Seed completado: quiz "${quiz.title}" con ${baseQuestions.length + 1} preguntas, ` +
      `${genreSeeds.length} géneros y ${traitSeeds.length} rasgos.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Error al ejecutar el seed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
