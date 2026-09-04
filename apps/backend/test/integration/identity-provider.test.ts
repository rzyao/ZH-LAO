import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/bootstrap/build-app.js';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { loadConfig } from '../../src/config/env.js';
import { createIdentityHttpDependencies } from '../../src/modules/identity/http/composition.js';
import { createIdentityRepositories } from '../../src/modules/identity/infrastructure/index.js';
import { UnavailableOtpDeliveryProvider } from '../../src/modules/identity/application/services/index.js';
import { identityModule } from '../../src/modules/identity/index.js';
import { buildIdentityTestApp, JWT_TEST_SECRET, OTP_TEST_SECRET, TEST_AUDIENCE, TEST_ISSUER } from '../support/identity-app.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const logger = pino({ level: 'silent' });
const direction = { native_language: 'lo', learning_language: 'zh' } as const;
// ADR-023 统一信封：HTTP 一律 200，顶层 code 权威。
const businessCode = (response: { json(): unknown }): string => (response.json() as { code: string }).code;

integration('IDN-20 production provider runtime', () => {
  it('production-like composition without any Facebook provider fails safe with PROVIDER_UNAVAILABLE, never Fake', async () => {
    const database: TestDatabase = await createTestDatabase(adminUrl!);
    const pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 3, connectionTimeoutMs: 2000, idleTimeoutMs: 2000 }, logger);
    const app = buildApp({ logger, database: asExecutor(pool) });
    try {
      // 不传 facebookVerifier：组合根默认必须是 Unavailable（而非 Fake）。
      await identityModule.registerHttp(app, createIdentityHttpDependencies({
        transactionManager: new TransactionManager(pool, logger),
        repositories: createIdentityRepositories,
        executor: asExecutor(pool),
        otpHmacSecret: OTP_TEST_SECRET,
        jwtHmacSecret: JWT_TEST_SECRET,
        jwtIssuer: TEST_ISSUER,
        jwtAudience: TEST_AUDIENCE,
        otpDelivery: new UnavailableOtpDeliveryProvider()
      }));
      const facebook = await app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'anything', learning_direction: direction } });
      expect(facebook.statusCode).toBe(200);
      expect(businessCode(facebook)).toBe('PROVIDER_UNAVAILABLE');
      expect(facebook.body).not.toContain('INVALID_CREDENTIAL');
    } finally {
      await app.close(); await pool.end(); await database.dispose();
    }
  });

  it('production-like composition without an SMS provider never fake-succeeds OTP requests', async () => {
    const database: TestDatabase = await createTestDatabase(adminUrl!);
    const pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 3, connectionTimeoutMs: 2000, idleTimeoutMs: 2000 }, logger);
    const app = buildApp({ logger, database: asExecutor(pool) });
    try {
      await identityModule.registerHttp(app, createIdentityHttpDependencies({
        transactionManager: new TransactionManager(pool, logger),
        repositories: createIdentityRepositories,
        executor: asExecutor(pool),
        otpHmacSecret: OTP_TEST_SECRET,
        jwtHmacSecret: JWT_TEST_SECRET,
        jwtIssuer: TEST_ISSUER,
        jwtAudience: TEST_AUDIENCE,
        otpDelivery: new UnavailableOtpDeliveryProvider()
      }));
      const phone = '+8562088888888';
      const response = await app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', payload: { phone, purpose: 'login' } });
      expect(response.statusCode).toBe(200);
      expect(businessCode(response)).toBe('PROVIDER_UNAVAILABLE');
      const pending = await pool.query<{ count: string }>("SELECT count(*)::text AS count FROM identity.otp_challenges WHERE phone_number=$1 AND status='pending'", [phone]);
      expect(Number(pending.rows[0]!.count)).toBe(0);
      const cancelled = await pool.query<{ count: string }>('SELECT count(*)::text AS count FROM identity.otp_challenges WHERE phone_number=$1', [phone]);
      expect(Number(cancelled.rows[0]!.count)).toBe(1);
    } finally {
      await app.close(); await pool.end(); await database.dispose();
    }
  });

  it('test wiring still works when Fake providers are passed explicitly', async () => {
    const ctx = await buildIdentityTestApp({ logger, facebookSubjects: new Map([['credential-ok', 'fb-subject-ok']]) });
    try {
      const facebook = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/auth/facebook', payload: { credential: 'credential-ok', learning_direction: direction } });
      expect(facebook.statusCode).toBe(200);
      expect(businessCode(facebook)).toBe('OK');
      const otp = await ctx.app.inject({ method: 'POST', url: '/api/v1/identity/phone-otp', payload: { phone: '+8562088777666', purpose: 'login' } });
      expect(otp.statusCode).toBe(200);
      expect(businessCode(otp)).toBe('OK');
    } finally {
      await ctx.dispose();
    }
  });

  it('production config rejects the console OTP provider at load time', () => {
    expect(() => loadConfig({
      APP_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/db',
      OTP_HMAC_SECRET: OTP_TEST_SECRET,
      JWT_HMAC_SECRET: JWT_TEST_SECRET,
      IDENTITY_OTP_PROVIDER: 'console',
      JWT_ISSUER: 'issuer', JWT_AUDIENCE: 'audience'
    } as NodeJS.ProcessEnv)).toThrow(/console OTP provider is development-only/);
    const dev = loadConfig({
      APP_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/db',
      IDENTITY_OTP_PROVIDER: 'console'
    } as NodeJS.ProcessEnv);
    expect(dev.identity.otpProvider).toBe('console');
    const prod = loadConfig({
      APP_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/db',
      OTP_HMAC_SECRET: OTP_TEST_SECRET,
      JWT_HMAC_SECRET: JWT_TEST_SECRET,
      JWT_ISSUER: 'issuer', JWT_AUDIENCE: 'audience'
    } as NodeJS.ProcessEnv);
    expect(prod.identity.otpProvider).toBe('unavailable');
  });
});