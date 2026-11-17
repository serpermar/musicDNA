import type {
  CompleteSessionResult,
  CreateQuizSessionInput,
  MusicProfile,
  Quiz,
  QuizSession,
  QuizSessionDetailResponse,
  SubmitResponseResult,
  UpdateProgressInput,
  UserResponse,
} from '@musicdna/shared';
import type { ApiClient } from './index';

export interface QuizApi {
  getActiveQuiz(): Promise<{ quiz: Quiz | null }>;
  getQuiz(quizId: string): Promise<{ quiz: Quiz }>;
  createSession(input?: CreateQuizSessionInput): Promise<{ session: QuizSession }>;
  getSession(sessionId: string): Promise<QuizSessionDetailResponse>;
  updateProgress(
    sessionId: string,
    input: UpdateProgressInput,
  ): Promise<{ progress: QuizSessionDetailResponse['view']['progress'] }>;
  submitResponse(sessionId: string, response: UserResponse): Promise<SubmitResponseResult>;
  completeSession(sessionId: string): Promise<CompleteSessionResult>;
  generateProfile(sessionId: string): Promise<{ profile: MusicProfile }>;
  getMyProfile(): Promise<{ profile: MusicProfile | null }>;
}

/** API del cuestionario y del perfil musical, compartida por web y móvil. */
export function createQuizApi(client: ApiClient): QuizApi {
  return {
    getActiveQuiz() {
      return client.get<{ quiz: Quiz | null }>('/quizzes/active');
    },
    getQuiz(quizId) {
      return client.get<{ quiz: Quiz }>(`/quizzes/${encodeURIComponent(quizId)}`);
    },
    createSession(input = {}) {
      return client.post<{ session: QuizSession }>('/quiz-sessions', input);
    },
    getSession(sessionId) {
      return client.get<QuizSessionDetailResponse>(
        `/quiz-sessions/${encodeURIComponent(sessionId)}`,
      );
    },
    updateProgress(sessionId, input) {
      return client.patch<{ progress: QuizSessionDetailResponse['view']['progress'] }>(
        `/quiz-sessions/${encodeURIComponent(sessionId)}/progress`,
        input,
      );
    },
    submitResponse(sessionId, response) {
      return client.post<SubmitResponseResult>(
        `/quiz-sessions/${encodeURIComponent(sessionId)}/responses`,
        { sessionId, response },
      );
    },
    completeSession(sessionId) {
      return client.post<CompleteSessionResult>(
        `/quiz-sessions/${encodeURIComponent(sessionId)}/complete`,
      );
    },
    generateProfile(sessionId) {
      return client.post<{ profile: MusicProfile }>('/profiles', { sessionId });
    },
    getMyProfile() {
      return client.get<{ profile: MusicProfile | null }>('/profiles/me');
    },
  };
}
