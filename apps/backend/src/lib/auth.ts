import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { anonymous } from 'better-auth/plugins/anonymous';
import { bearer } from 'better-auth/plugins/bearer';
import { authSecret, corsOrigins, env } from '../config/env';
import { deliverAuthLink } from './auth-links';
import { hashPassword, verifyPassword } from './password';
import { prisma } from './prisma';

/**
 * Instancia única de Better Auth.
 * - El esquema central se mapea sobre nuestros modelos de Prisma.
 * - Las contraseñas se hashean con Argon2id y viven en `accounts`.
 * - `bearer` permite autenticar la app móvil; `anonymous` habilita el acceso como invitado.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/v1/auth',
  secret: authSecret,
  trustedOrigins: corsOrigins,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  user: {
    modelName: 'User',
    fields: {
      name: 'displayName',
      image: 'avatarUrl',
    },
  },
  session: {
    modelName: 'Session',
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  account: {
    modelName: 'Account',
  },
  verification: {
    modelName: 'Verification',
  },
  plugins: [
    bearer(),
    anonymous({
      emailDomainName: 'guest.musicdna.local',
      generateName: () => 'MusicDNA Guest',
      schema: {
        user: {
          fields: {
            isAnonymous: 'isGuest',
          },
        },
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
    sendResetPassword: async ({ user, url }) => {
      deliverAuthLink('reset-password', url, user.email);
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      deliverAuthLink('verify-email', url, user.email);
    },
  },
});

export type Auth = typeof auth;
export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
