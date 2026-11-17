-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "SharedProfileVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "QuizQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'SCALE', 'TWO_OPTION', 'VISUAL_CARD', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "QuizSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "FavoriteKind" AS ENUM ('ARTIST', 'SONG', 'GENRE', 'PLAYLIST');

-- CreateEnum
CREATE TYPE "RecommendationKind" AS ENUM ('ARTIST', 'SONG', 'GENRE', 'PLAYLIST', 'COMFORT_ZONE');

-- CreateEnum
CREATE TYPE "SpotifyConnectionStatus" AS ENUM ('ACTIVE', 'DISCONNECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(80) NOT NULL DEFAULT '',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" VARCHAR(512),
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "privacy" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "account_id" VARCHAR(255) NOT NULL,
    "provider_id" VARCHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bio" TEXT,
    "country_code" VARCHAR(2),
    "birth_year" INTEGER,
    "share_results_by_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "prompt" TEXT NOT NULL,
    "help_text" TEXT,
    "type" "QuizQuestionType" NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_adaptive" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "value" VARCHAR(160) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "scores" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "quiz_id" UUID NOT NULL,
    "status" "QuizSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "current_question_index" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_responses" (
    "id" UUID NOT NULL,
    "quiz_session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer_id" UUID,
    "numeric_value" DECIMAL(5,2),
    "text_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quiz_session_id" UUID,
    "personality_name" VARCHAR(120) NOT NULL,
    "personality_slug" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "dominant_genre_id" UUID,
    "favorite_decade" VARCHAR(16),
    "energy_score" DECIMAL(5,2) NOT NULL,
    "emotional_score" DECIMAL(5,2) NOT NULL,
    "algorithm_version" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_genres" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "parent_id" UUID,
    "description" TEXT,
    "color_hex" VARCHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genre_scores" (
    "id" UUID NOT NULL,
    "music_profile_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "rank" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genre_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_traits" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personality_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_scores" (
    "id" UUID NOT NULL,
    "music_profile_id" UUID NOT NULL,
    "personality_trait_id" UUID NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personality_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "genre_id" UUID,
    "spotify_id" VARCHAR(64),
    "image_url" VARCHAR(512),
    "popularity" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL,
    "music_profile_id" UUID NOT NULL,
    "kind" "RecommendationKind" NOT NULL,
    "genre_id" UUID,
    "artist_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "reason" TEXT,
    "external_url" VARCHAR(512),
    "score" DECIMAL(5,2) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "FavoriteKind" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "external_id" VARCHAR(128),
    "genre_id" UUID,
    "artist_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spotify_connections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "spotify_user_id" VARCHAR(128),
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "scope" TEXT,
    "token_expires_at" TIMESTAMP(3) NOT NULL,
    "status" "SpotifyConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spotify_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_comparisons" (
    "id" UUID NOT NULL,
    "source_profile_id" UUID NOT NULL,
    "target_profile_id" UUID NOT NULL,
    "requested_by_user_id" UUID,
    "compatibility_score" DECIMAL(5,2) NOT NULL,
    "sharedGenres" JSONB,
    "differences" JSONB,
    "description" TEXT,
    "algorithm_version" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_profiles" (
    "id" UUID NOT NULL,
    "music_profile_id" UUID NOT NULL,
    "shared_by_user_id" UUID NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "visibility" "SharedProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "allowedFields" JSONB,
    "expires_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "accounts_provider_id_account_id_idx" ON "accounts"("provider_id", "account_id");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "verifications_expires_at_idx" ON "verifications"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_slug_key" ON "quizzes"("slug");

-- CreateIndex
CREATE INDEX "questions_quiz_id_position_idx" ON "questions"("quiz_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "questions_quiz_id_key_key" ON "questions"("quiz_id", "key");

-- CreateIndex
CREATE INDEX "answers_question_id_position_idx" ON "answers"("question_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "answers_question_id_value_key" ON "answers"("question_id", "value");

-- CreateIndex
CREATE INDEX "quiz_sessions_user_id_status_idx" ON "quiz_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "quiz_sessions_quiz_id_created_at_idx" ON "quiz_sessions"("quiz_id", "created_at");

-- CreateIndex
CREATE INDEX "user_responses_quiz_session_id_idx" ON "user_responses"("quiz_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_responses_quiz_session_id_question_id_key" ON "user_responses"("quiz_session_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "music_profiles_quiz_session_id_key" ON "music_profiles"("quiz_session_id");

-- CreateIndex
CREATE INDEX "music_profiles_user_id_created_at_idx" ON "music_profiles"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "music_genres_slug_key" ON "music_genres"("slug");

-- CreateIndex
CREATE INDEX "music_genres_parent_id_idx" ON "music_genres"("parent_id");

-- CreateIndex
CREATE INDEX "genre_scores_music_profile_id_score_idx" ON "genre_scores"("music_profile_id", "score");

-- CreateIndex
CREATE UNIQUE INDEX "genre_scores_music_profile_id_genre_id_key" ON "genre_scores"("music_profile_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "personality_traits_slug_key" ON "personality_traits"("slug");

-- CreateIndex
CREATE INDEX "personality_scores_music_profile_id_score_idx" ON "personality_scores"("music_profile_id", "score");

-- CreateIndex
CREATE UNIQUE INDEX "personality_scores_music_profile_id_personality_trait_id_key" ON "personality_scores"("music_profile_id", "personality_trait_id");

-- CreateIndex
CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "artists_spotify_id_key" ON "artists"("spotify_id");

-- CreateIndex
CREATE INDEX "artists_genre_id_idx" ON "artists"("genre_id");

-- CreateIndex
CREATE INDEX "recommendations_music_profile_id_kind_position_idx" ON "recommendations"("music_profile_id", "kind", "position");

-- CreateIndex
CREATE INDEX "user_favorites_user_id_created_at_idx" ON "user_favorites"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_user_id_kind_external_id_key" ON "user_favorites"("user_id", "kind", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "spotify_connections_user_id_key" ON "spotify_connections"("user_id");

-- CreateIndex
CREATE INDEX "spotify_connections_status_idx" ON "spotify_connections"("status");

-- CreateIndex
CREATE INDEX "profile_comparisons_source_profile_id_created_at_idx" ON "profile_comparisons"("source_profile_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "profile_comparisons_source_profile_id_target_profile_id_key" ON "profile_comparisons"("source_profile_id", "target_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_profiles_slug_key" ON "shared_profiles"("slug");

-- CreateIndex
CREATE INDEX "shared_profiles_shared_by_user_id_idx" ON "shared_profiles"("shared_by_user_id");

-- CreateIndex
CREATE INDEX "shared_profiles_music_profile_id_idx" ON "shared_profiles"("music_profile_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_responses" ADD CONSTRAINT "user_responses_quiz_session_id_fkey" FOREIGN KEY ("quiz_session_id") REFERENCES "quiz_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_responses" ADD CONSTRAINT "user_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_profiles" ADD CONSTRAINT "music_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_profiles" ADD CONSTRAINT "music_profiles_quiz_session_id_fkey" FOREIGN KEY ("quiz_session_id") REFERENCES "quiz_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_profiles" ADD CONSTRAINT "music_profiles_dominant_genre_id_fkey" FOREIGN KEY ("dominant_genre_id") REFERENCES "music_genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_genres" ADD CONSTRAINT "music_genres_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "music_genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genre_scores" ADD CONSTRAINT "genre_scores_music_profile_id_fkey" FOREIGN KEY ("music_profile_id") REFERENCES "music_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genre_scores" ADD CONSTRAINT "genre_scores_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "music_genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_scores" ADD CONSTRAINT "personality_scores_music_profile_id_fkey" FOREIGN KEY ("music_profile_id") REFERENCES "music_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_scores" ADD CONSTRAINT "personality_scores_personality_trait_id_fkey" FOREIGN KEY ("personality_trait_id") REFERENCES "personality_traits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "music_genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_music_profile_id_fkey" FOREIGN KEY ("music_profile_id") REFERENCES "music_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "music_genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "music_genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spotify_connections" ADD CONSTRAINT "spotify_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_comparisons" ADD CONSTRAINT "profile_comparisons_source_profile_id_fkey" FOREIGN KEY ("source_profile_id") REFERENCES "music_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_comparisons" ADD CONSTRAINT "profile_comparisons_target_profile_id_fkey" FOREIGN KEY ("target_profile_id") REFERENCES "music_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_comparisons" ADD CONSTRAINT "profile_comparisons_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_profiles" ADD CONSTRAINT "shared_profiles_music_profile_id_fkey" FOREIGN KEY ("music_profile_id") REFERENCES "music_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_profiles" ADD CONSTRAINT "shared_profiles_shared_by_user_id_fkey" FOREIGN KEY ("shared_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
