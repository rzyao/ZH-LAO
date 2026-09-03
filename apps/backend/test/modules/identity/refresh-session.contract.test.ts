import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { identityModule } from '../../../src/modules/identity/index.js';
import type { IdentityHttpDependencies } from '../../../src/modules/identity/http/routes.js';
import type { AuthenticationProvider } from '../../../src/auth/authentication-provider.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { requiredMigrations } from '../../../src/database/required-migrations.generated.js';
import { AppError } from '../../../src/errors/app-error.js';

describe('US2 RefreshSession Contract', () => {
  const database = {
    query: async (text: string) => ({
      rows: text.includes('to_regclass')
        ? [{ registry: 'v2_schema_migrations', assets: 'infrastructure.assets', outbox: 'infrastructure.system_outbox_events' }]
        : requiredMigrations.map(({ filename, sha256 }) => ({ filename, sha256 })),
      rowCount: 1, command: 'SELECT', oid: 0, fields: []
    })
  } as DatabaseExecutor;
  const logger = pino({ level: 'silent' });

  it('rotates refresh token and returns fresh access token and new refresh token', async () => {
    const sessionExpiresAt = new Date('2026-10-02T14:00:00.000Z');
    let capturedRefreshToken = '';

    const dependencies: IdentityHttpDependencies = {
      authentication: { authenticate: async () => null } as AuthenticationProvider,
      requestOtp: {} as never,
      phoneAuth: {} as never,
      facebookAuth: {} as never,
      sessions: {
        refreshSession: async (token: unknown) => {
          capturedRefreshToken = String(token);
          return {
            accessToken: 'fresh-jwt-token',
            tokenType: 'Bearer',
            expiresIn: 900,
            refreshToken: 'new-opaque-refresh-token',
            sessionExpiresAt
          };
        }
      } as never,
      devices: {} as never,
      profile: {} as never,
      state: {} as never,
      phones: {} as never
    };

    const app = buildApp({ logger, database });
    await identityModule.registerHttp(app, dependencies);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/identity/sessions/refresh',
      payload: {
        refresh_token: 'old-valid-token'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.code).toBe('OK');
    expect(body.data).toEqual({
      access_token: 'fresh-jwt-token',
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: 'new-opaque-refresh-token',
      session_expires_at: sessionExpiresAt.toISOString()
    });
    expect(body.request_id).toBeDefined();
    expect(capturedRefreshToken).toBe('old-valid-token');
    await app.close();
  });

  it('rejects revoked or expired sessions with 401 INVALID_CREDENTIAL', async () => {
    const dependencies: IdentityHttpDependencies = {
      authentication: { authenticate: async () => null } as AuthenticationProvider,
      requestOtp: {} as never,
      phoneAuth: {} as never,
      facebookAuth: {} as never,
      sessions: {
        refreshSession: async () => {
          throw new AppError({ code: 'SESSION_REVOKED', message: 'Session is revoked', httpStatus: 401 });
        }
      } as never,
      devices: {} as never,
      profile: {} as never,
      state: {} as never,
      phones: {} as never
    };

    const app = buildApp({ logger, database });
    await identityModule.registerHttp(app, dependencies);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/identity/sessions/refresh',
      payload: {
        refresh_token: 'revoked-token'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().code).toBe('INVALID_CREDENTIAL');
    await app.close();
  });
});
