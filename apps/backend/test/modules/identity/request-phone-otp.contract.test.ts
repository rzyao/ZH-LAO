import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { identityModule } from '../../../src/modules/identity/index.js';
import type { IdentityHttpDependencies } from '../../../src/modules/identity/http/routes.js';
import type { AuthenticationProvider } from '../../../src/auth/authentication-provider.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { requiredMigrations } from '../../../src/database/required-migrations.generated.js';
import { normalizePhoneNumber } from '../../../src/modules/identity/domain/index.js';

describe('US1 RequestPhoneOtp Contract', () => {
  const database = {
    query: async (text: string) => ({
      rows: text.includes('to_regclass')
        ? [{ registry: 'v2_schema_migrations', assets: 'infrastructure.assets', outbox: 'infrastructure.system_outbox_events' }]
        : requiredMigrations.map(({ filename, sha256 }) => ({ filename, sha256 })),
      rowCount: 1, command: 'SELECT', oid: 0, fields: []
    })
  } as DatabaseExecutor;
  const logger = pino({ level: 'silent' });

  it('accepts valid E.164 phone and returns unified anti-enumeration response', async () => {
    let capturedPhone = '';
    const dependencies: IdentityHttpDependencies = {
      authentication: { authenticate: async () => null } as AuthenticationProvider,
      requestOtp: {
        execute: async (input: { phone: unknown }) => {
          capturedPhone = String(input.phone);
          return { expiresAt: new Date(Date.now() + 300_000) };
        }
      } as never,
      phoneAuth: {} as never,
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
      url: '/api/v1/identity/phone-otp',
      payload: {
        phone: '+8562012345678',
        purpose: 'login'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'accepted',
      retry_after_seconds: 60
    });
    expect(capturedPhone).toBe('+8562012345678');
    await app.close();
  });

  it('rejects invalid phone numbers with validation error', async () => {
    const dependencies: IdentityHttpDependencies = {
      authentication: { authenticate: async () => null } as AuthenticationProvider,
      requestOtp: {
        execute: async (input: { phone: unknown }) => {
          normalizePhoneNumber(input.phone);
          return { expiresAt: new Date() };
        }
      } as never,
      phoneAuth: {} as never,
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
      url: '/api/v1/identity/phone-otp',
      payload: {
        phone: 'invalid-not-phone',
        purpose: 'login'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_PHONE');
    await app.close();
  });
});
