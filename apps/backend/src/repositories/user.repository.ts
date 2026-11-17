import type { ProfileVisibility } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface ProfileUpdate {
  bio?: string | null;
  countryCode?: string | null;
  birthYear?: number | null;
  shareResultsByDefault?: boolean;
}

export interface UserUpdate {
  displayName?: string;
  privacy?: ProfileVisibility;
}

export const userRepository = {
  findById(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerified: true,
        avatarUrl: true,
        isGuest: true,
        privacy: true,
        createdAt: true,
      },
    });
  },

  findProfile(userId: string) {
    return prisma.userProfile.findUnique({ where: { userId } });
  },

  findSessionToken(sessionId: string, userId: string) {
    return prisma.session.findFirst({
      where: { id: sessionId, userId },
      select: { token: true },
    });
  },

  updateUser(userId: string, data: UserUpdate) {
    return prisma.user.update({
      where: { id: userId, deletedAt: null },
      data,
      select: { id: true, displayName: true, privacy: true },
    });
  },

  upsertProfile(userId: string, data: ProfileUpdate) {
    return prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};
