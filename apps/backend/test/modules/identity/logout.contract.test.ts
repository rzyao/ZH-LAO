import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { identityModule } from '../../../src/modules/identity/index.js';
import type { IdentityHttpDependencies } from '../../../src/modules/identity/http/routes.js';
import type { AuthenticationProvider } from '../../../src/auth/authentication-provider.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { requiredMigrations } from '../../../src/database/required-migrations.generated.js';
import { newLogicalUuid } from '../../../src/ids/uuid.js';

describe('US3 Logout and LogoutAll Contract', () => {
  const database = {
    query: async (text: string) => ({
      rows: text.includes('to_regclass')
        ? [{ registry: 'v2_schema_migrations', assets: 'infrastructure.assets', outbox: 'infrastructure.system_outbox_events' }]
        : requiredMigrations.map(({ filename, sha256 }) => ({ filename, sha256 })),
      rowCount: 1, command: 'SELECT', oid: 0, fields: []
    })
  } as DatabaseExecutor;
  const logger = pino({ level: 'silent' });

  it('revokes current session with refresh token and returns 204', async () => {
    let capturedToken = '';

    const dependencies: IdentityHttpDependencies = {
      authentication: { authenticate: async () => null } as AuthenticationProvider,
      requestOtp: {} as never,
      phoneAuth: {} as never,
      facebookAuth: {} as never,
      sessions: {
        logoutCurrent: async (token: unknown) => {
          capturedToken = String(token);
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
      url: '/api/v1/identity/sessions/logout',
      payload: {
        refresh_token: 'token-to-revoke'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().code).toBe('OK');
    expect(response.json().data).toBeNull();
    expect(capturedPhoneOrToken(capturedToken)).toBe('token-to-revoke');
    await app.close();
  });

  it('revokes all sessions for authenticated user and returns 204', async () => {
    const subjectId = newLogicalUuid();
    let capturedSubject = '';

    const dependencies: IdentityHttpDependencies = {
      authentication: {
        authenticate: async () => ({ subjectId })
      } as AuthenticationProvider,
      requestOtp: {} as never,
      phoneAuth: {} as never,
      facebookAuth: {} as never,
      sessions: {
        logoutAll: async (userId: unknown) => {
          capturedSubject = String(userId);
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
      url: '/api/v1/identity/sessions/logout-all',
      headers: {
        authorization: 'Bearer valid-jwt'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().code).toBe('OK');
    expect(response.json().data).toBeNull();
    expect(capturedSubject).toBe(subjectId);
    await app.close();
  });
});

function capturedPhoneOrToken(val: string) {
  return val;
}
