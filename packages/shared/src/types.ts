/**
 * Tipos canónicos del dominio de MusicDNA.
 * Se comparten entre backend, web y móvil. No contienen dependencias de frameworks.
 */

export type UUID = string;
export type ISODate = string;

export type QuestionType =
  'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE' | 'TWO_OPTION' | 'VISUAL_CARD' | 'ADAPTIVE';

export type QuizSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export type RecommendationKind = 'ARTIST' | 'SONG' | 'GENRE' | 'PLAYLIST' | 'COMFORT_ZONE';

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  isGuest: boolean;
  emailVerified: boolean;
  createdAt: ISODate;
}

/** Datos de sesión que la API expone a web y móvil. Nunca incluye tokens. */
export interface AuthUser extends User {
  avatarUrl: string | null;
}

export interface SessionInfo {
  id: UUID;
  userId: UUID;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: ISODate;
  createdAt: ISODate;
  isCurrent: boolean;
}

export interface UserProfileDetails {
  bio: string | null;
  countryCode: string | null;
  birthYear: number | null;
  shareResultsByDefault: boolean;
  privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
}

export interface CurrentUserResponse {
  user: AuthUser;
  profile: UserProfileDetails | null;
}

/** Vista segura de la sesión: nunca expone el token de sesión. */
export interface AuthSessionPayload {
  user: AuthUser;
  session: {
    id: UUID;
    expiresAt: ISODate;
    createdAt: ISODate;
  };
}

export interface QuestionOption {
  id: UUID;
  label: string;
  value: string;
  position: number;
}

export interface Question {
  id: UUID;
  key: string;
  prompt: string;
  type: QuestionType;
  category: string;
  weight: number;
  position: number;
  options: QuestionOption[];
}

export interface Quiz {
  id: UUID;
  slug: string;
  title: string;
  version: number;
  questions: Question[];
}

export interface QuizSession {
  id: UUID;
  quizId: UUID;
  status: QuizSessionStatus;
  currentQuestionIndex: number;
  startedAt: ISODate;
  completedAt: ISODate | null;
}

export interface UserResponse {
  questionId: UUID;
  answerId: UUID | null;
  numericValue?: number;
  textValue?: string;
}

export interface GenreAffinity {
  genreId: UUID;
  slug: string;
  name: string;
  score: number;
  rank: number;
}

export interface PersonalityScore {
  traitSlug: string;
  label: string;
  score: number;
}

export interface MusicProfile {
  id: UUID;
  userId: UUID;
  personalityName: string;
  personalitySlug: string;
  description: string;
  dominantGenre: GenreAffinity | null;
  secondaryGenres: GenreAffinity[];
  favoriteDecade: string | null;
  energyScore: number;
  emotionalScore: number;
  traits: PersonalityScore[];
  algorithmVersion: string;
  createdAt: ISODate;
}

export interface Recommendation {
  id: UUID;
  kind: RecommendationKind;
  title: string;
  reason: string | null;
  score: number;
  externalUrl: string | null;
}

export interface ProfileComparison {
  id: UUID;
  sourceProfileId: UUID;
  targetProfileId: UUID;
  compatibilityScore: number;
  sharedGenres: string[];
  differences: string[];
  description: string | null;
}
