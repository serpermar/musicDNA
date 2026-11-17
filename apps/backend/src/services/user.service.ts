import type { AuthUser, CurrentUserResponse, SessionInfo, UpdateUserInput } from '@musicdna/shared';
import type { ProfileVisibility } from '@prisma/client';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { auth, type AuthSession } from '../lib/auth';
import { userRepository } from '../repositories/user.repository';
import { notFound, unauthorized } from '../utils/http-error';

type UserRow = NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>;
type Session = NonNullable<AuthSession>;

function toAuthUser(user: UserRow): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isGuest: user.isGuest,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

async function sessionFromRequest(req: Request): Promise<Session> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session?.session || !session.user) throw unauthorized();
  return session;
}

export const userService = {
  /** Devuelve la sesión normalizada. La usa `/auth/me`. */
  async getSessionUser(req: Request): Promise<AuthUser> {
    const session = await sessionFromRequest(req);
    const user = await userRepository.findById(session.user.id);
    if (!user) throw notFound('Usuario no encontrado');
    return toAuthUser(user);
  },

  /** Devuelve usuario + perfil. La usa `/users/me`. */
  async getCurrent(req: Request): Promise<CurrentUserResponse> {
    const session = await sessionFromRequest(req);
    const [user, profile] = await Promise.all([
      userRepository.findById(session.user.id),
      userRepository.findProfile(session.user.id),
    ]);
    if (!user) throw notFound('Usuario no encontrado');

    return {
      user: toAuthUser(user),
      profile: profile
        ? {
            bio: profile.bio,
            countryCode: profile.countryCode,
            birthYear: profile.birthYear,
            shareResultsByDefault: profile.shareResultsByDefault,
            privacy: user.privacy,
          }
        : null,
    };
  },

  async update(req: Request, input: UpdateUserInput): Promise<CurrentUserResponse> {
    const session = await sessionFromRequest(req);
    const userId = session.user.id;
    const { name, displayName, privacy, ...profileInput } = input;
    const nextName = displayName ?? name;

    if (nextName !== undefined) {
      await auth.api.updateUser({
        body: { name: nextName },
        headers: fromNodeHeaders(req.headers),
      });
    }

    if (privacy !== undefined) {
      await userRepository.updateUser(userId, { privacy: privacy as ProfileVisibility });
    }

    if (Object.keys(profileInput).length > 0) {
      await userRepository.upsertProfile(userId, profileInput);
    }

    return userService.getCurrent(req);
  },

  async listSessions(req: Request): Promise<SessionInfo[]> {
    const headers = fromNodeHeaders(req.headers);
    const [current, sessions] = await Promise.all([
      auth.api.getSession({ headers }),
      auth.api.listSessions({ headers }),
    ]);
    if (!current) throw unauthorized();

    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      isCurrent: session.token === current.session.token,
    }));
  },

  async revokeSession(req: Request, sessionId: string): Promise<void> {
    const session = await sessionFromRequest(req);
    const stored = await userRepository.findSessionToken(sessionId, session.user.id);
    if (!stored) throw notFound('Sesión no encontrada');

    await auth.api.revokeSession({
      body: { token: stored.token },
      headers: fromNodeHeaders(req.headers),
    });
  },

  async deleteAccount(req: Request): Promise<void> {
    await sessionFromRequest(req);
    await auth.api.deleteUser({ body: {}, headers: fromNodeHeaders(req.headers) });
  },
};
