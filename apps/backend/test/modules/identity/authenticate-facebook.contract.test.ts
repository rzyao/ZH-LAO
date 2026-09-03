import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { identityModule } from '../../../src/modules/identity/index.js';
import type { IdentityHttpDependencies } from '../../../src/modules/identity/http/routes.js';
import type { AuthenticationProvider } from '../../../src/auth/authentication-provider.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { requiredMigrations } from '../../../src/database/required-migrations.generated.js';
import { newLogicalUuid } from '../../../src/ids/uuid.js';

describe('US4 Facebook Auth Contract', () => {
  const database = {
    query: async (text: string) => ({
      rows: text.includes('to_regclass')
        ? [{ registry: 'v2_schema_migrations', assets: 'infrastructure.assets', outbox: 'infrastructure.system_outbox_events' }]
        : requiredMigrations.map(({ filename, sha256 }) => ({ filename, sha256 })),
      rowCount: 1, command: 'SELECT', oid: 0, fields: []
    })
  } as DatabaseExecutor;
  const logger = pino({ level: 'silent' });

  it('authenticates with Facebook credential and returns tokens', async () => {
    const userPublicId = newLogicalUuid();
    const sessionExpiresAt = new Date('2026-10-02T14:00:00.000Z');
    let capturedCredential = '';

    const dependencies: IdentityHttpDependencies = {
      authentication: { authenticate: async () => null } as AuthenticationProvider,
      requestOtp: {} as never,
      phoneAuth: {} as never,
      facebookAuth: {
        execute: async (input: { credential: string }) => {
          capturedCredential = input.credential;
          return {
            userPublicId,
            isNewUser: false,
            accessToken: 'fb-access-token',
            refreshToken: 'fb-refresh-token',
            expiresIn: 900,
            sessionExpiresAt
          };
        }
      } as never,
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
      url: '/api/v1/identity/auth/facebook',
      payload: {
        credential: 'valid-fb-token-12345',
        learning_direction: {
          native_language: 'zh',
          learning_language: 'lo'
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user_id: userPublicId,
      account_status: 'active',
      is_new_user: false,
      access_token: 'fb-access-token',
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: 'fb-refresh-token',
      session_expires_at: sessionExpiresAt.toISOString()
    });
    expect(capturedCredential).toBe('valid-fb-token-12345');
    await app.close();
  });
});
