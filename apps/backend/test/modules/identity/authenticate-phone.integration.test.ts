import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { identityModule } from '../../../src/modules/identity/index.js';
import type { IdentityHttpDependencies } from '../../../src/modules/identity/http/routes.js';
import type { AuthenticationProvider } from '../../../src/auth/authentication-provider.js';
import { newLogicalUuid } from '../../../src/ids/uuid.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { requiredMigrations } from '../../../src/database/required-migrations.generated.js';

describe('US1 AuthenticateWithPhoneOtp Integration Contract', () => {
  const database = {
    query: async (text: string) => ({
      rows: text.includes('to_regclass')
        ? [{ registry: 'v2_schema_migrations', assets: 'infrastructure.assets', outbox: 'infrastructure.system_outbox_events' }]
        : requiredMigrations.map(({ filename, sha256 }) => ({ filename, sha256 })),
      rowCount: 1, command: 'SELECT', oid: 0, fields: []
    })
  } as DatabaseExecutor;
  const logger = pino({ level: 'silent' });

  it('completes new user registration with fixed learning direction and issues tokens', async () => {
    const userPublicId = newLogicalUuid();
    const sessionExpiresAt = new Date('2026-10-02T14:00:00.000Z');

    const dependencies: IdentityHttpDependencies = {
      authentication: { authenticate: async () => null } as AuthenticationProvider,
      requestOtp: {} as never,
      phoneAuth: {
        execute: async (input: { learningDirection?: unknown; device?: { platform?: string } }) => {
          expect(input.learningDirection).toEqual({ nativeLanguage: 'lo', learningLanguage: 'zh' });
          expect(input.device?.platform).toBe('android');
          return {
            userPublicId,
            status: 'active',
            isNewUser: true,
            accessToken: 'mock-access-token-jwt',
            refreshToken: 'mock-raw-refresh-token',
            expiresIn: 900,
            sessionExpiresAt
          };
        }
      } as never,
      facebookAuth: {} as never,
      sessions: {} as never,
      devices: {} as never,
      profile: {} as never,
      state: {} as never,
      phones: {} as never
    };

    const app = buildApp({ logger, database });
    await identityModule.registerHttp(app, dependencies);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/identity/auth/phone',
      payload: {
        phone: '+8562012345678',
        otp_code: '123456',
        learning_direction: {
          native_language: 'lo',
          learning_language: 'zh'
        },
        device: {
          installation_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          platform: 'android'
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user_id: userPublicId,
      account_status: 'active',
      is_new_user: true,
      access_token: 'mock-access-token-jwt',
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: 'mock-raw-refresh-token',
      session_expires_at: sessionExpiresAt.toISOString()
    });
    await app.close();
  });
});
