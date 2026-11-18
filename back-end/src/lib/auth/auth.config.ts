import { betterAuth } from 'better-auth';
import { hashPassword } from 'better-auth/crypto';
import { kyselyAdapter } from '@better-auth/kysely-adapter';
import { Kysely, PostgresDialect } from 'kysely';
import type { ConfigService } from '@nestjs/config';
import type { PgService } from '../database/pg.service.js';
import type { AuthMailService } from './auth-mail.service.js';
import { generateTemporaryPassword } from './temporary-password.js';

export function createAuth(
  pg: PgService,
  config: ConfigService,
  mail: AuthMailService,
) {
  const secret = config.getOrThrow<string>('BETTER_AUTH_SECRET');
  const baseURL = config.getOrThrow<string>('BETTER_AUTH_URL');
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  const trustedOrigins = config
    .get<string>('AUTH_TRUSTED_ORIGINS', baseURL)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const requireEmailVerification =
    config.get<string>('AUTH_REQUIRE_EMAIL_VERIFICATION', isProduction ? 'true' : 'false') ===
    'true';

  // Better Auth's built-in `database: { dialect, type }` path does NOT forward
  // `usePlural` to the Kysely adapter, so the adapter is constructed explicitly.
  const db = new Kysely({ dialect: new PostgresDialect({ pool: pg.pool }) });

  return betterAuth({
    secret,
    baseURL,
    basePath: '/api/auth',
    trustedOrigins,
    database: kyselyAdapter(db, {
      type: 'postgres',
      usePlural: true,
      transaction: true,
    }),
    advanced: {
      database: {
        joins: true,
      },
      useSecureCookies: isProduction,
      defaultCookieAttributes: {
        sameSite: 'lax',
        secure: isProduction,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    user: {
      additionalFields: {
        username: {
          type: 'string',
          required: false,
          input: true,
        },
        status: {
          type: 'string',
          required: false,
          defaultValue: 'ACTIVE',
          input: false,
        },
        role: {
          type: 'string',
          required: false,
          defaultValue: 'USER',
          input: false,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification,
      sendResetPassword: async ({ user }) => {
        const password = generateTemporaryPassword();
        const { rows } = await pg.query<{ username: string | null; name: string }>(
          `SELECT username, name FROM users WHERE id = $1`,
          [user.id],
        );
        const profile = rows[0];
        await mail.sendNewPasswordEmail(user.email, {
          name: profile?.name ?? user.name,
          username: profile?.username ?? null,
          password,
        });
        const passwordHash = await hashPassword(password);
        await pg.query(
          `UPDATE accounts
              SET password = $1, "updatedAt" = NOW()
            WHERE "userId" = $2 AND "providerId" = 'credential'`,
          [passwordHash, user.id],
        );
      },
    },
    emailVerification: {
      sendOnSignUp: requireEmailVerification,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await mail.sendVerificationEmail(user.email, url);
      },
    },
    databaseHooks: {
      user: {
        update: {
          after: async (user) => {
            if (user.emailVerified) {
              await pg.query(
                `UPDATE "users"
                    SET "status" = 'ACTIVE'
                  WHERE "id" = $1 AND "status" = 'PENDING'`,
                [user.id],
              );
            }
          },
        },
      },
    },
  });
}
