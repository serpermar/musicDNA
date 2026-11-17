import type {
  AuthSessionPayload,
  AuthUser,
  ChangePasswordInput,
  CurrentUserResponse,
  RequestPasswordResetInput,
  ResetPasswordInput,
  SessionInfo,
  SignInInput,
  SignUpInput,
  UpdateUserInput,
} from '@musicdna/shared';
import type { ApiClient } from './index';

interface RawAuthSession {
  session: {
    id: string;
    createdAt: string;
    expiresAt: string;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: string;
    isGuest?: boolean | null;
    isAnonymous?: boolean | null;
  } | null;
}

function mapSession(payload: RawAuthSession | null): AuthSessionPayload | null {
  if (!payload?.session || !payload.user) return null;

  const user: AuthUser = {
    id: payload.user.id,
    email: payload.user.email,
    displayName: payload.user.name ?? '',
    avatarUrl: payload.user.image ?? null,
    isGuest: Boolean(payload.user.isGuest ?? payload.user.isAnonymous),
    emailVerified: Boolean(payload.user.emailVerified),
    createdAt: payload.user.createdAt,
  };

  return {
    user,
    session: {
      id: payload.session.id,
      createdAt: payload.session.createdAt,
      expiresAt: payload.session.expiresAt,
    },
  };
}

export interface AuthApi {
  signUp(input: SignUpInput): Promise<void>;
  signIn(input: SignInInput): Promise<void>;
  signInAsGuest(): Promise<void>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSessionPayload | null>;
  getMe(): Promise<CurrentUserResponse>;
  updateMe(input: UpdateUserInput): Promise<CurrentUserResponse>;
  requestPasswordReset(input: RequestPasswordResetInput): Promise<void>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  listSessions(): Promise<SessionInfo[]>;
  revokeSession(sessionId: string): Promise<void>;
  deleteAccount(): Promise<void>;
}

/** API de autenticación reutilizable por web y móvil sobre el cliente HTTP. */
export function createAuthApi(client: ApiClient): AuthApi {
  return {
    async signUp(input) {
      await client.post('/auth/sign-up/email', input);
    },
    async signIn(input) {
      await client.post('/auth/sign-in/email', input);
    },
    async signInAsGuest() {
      await client.post('/auth/sign-in/anonymous');
    },
    async signOut() {
      await client.post('/auth/sign-out');
    },
    async getSession() {
      const payload = await client.get<RawAuthSession | null>('/auth/get-session');
      return mapSession(payload);
    },
    async getMe() {
      return client.get<CurrentUserResponse>('/users/me');
    },
    async updateMe(input) {
      return client.patch<CurrentUserResponse>('/users/me', input);
    },
    async requestPasswordReset(input) {
      await client.post('/auth/request-password-reset', input);
    },
    async resetPassword(input) {
      await client.post('/auth/reset-password', input);
    },
    async changePassword(input) {
      await client.post('/auth/change-password', input);
    },
    async listSessions() {
      const response = await client.get<{ sessions: SessionInfo[] }>('/users/me/sessions');
      return response.sessions;
    },
    async revokeSession(sessionId) {
      await client.delete(`/users/me/sessions/${encodeURIComponent(sessionId)}`);
    },
    async deleteAccount() {
      await client.delete('/users/me');
    },
  };
}
