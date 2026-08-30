import { createHash, createHmac } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import pino from 'pino';
import { buildApp } from '../../src/bootstrap/build-app.js';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { createIdentityRepositories } from '../../src/modules/identity/infrastructure/index.js';
import { createIdentityHttpDependencies } from '../../src/modules/identity/http/composition.js';
import { FakeFacebookCredentialVerifier, FakeOtpDeliveryProvider, IdentityEventWriter, type FacebookCredentialVerifier } from '../../src/modules/identity/application/services/index.js';
import { identityModule } from '../../src/modules/identity/index.js';
import { createTestDatabase, type TestDatabase } from './test-database.js';

export const OTP_TEST_SECRET = 'test-only-otp-secret-that-is-long-enough';
export const JWT_TEST_SECRET = 'test-jwt-secret-that-is-long-enough-for-hmac';
export const TEST_ISSUER = 'zh-lao';
export const TEST_AUDIENCE = 'zh-lao-client';
export const PHONE_A = '+8562012345678';
export const PHONE_B = '+8562023456789';
export const PHONE_C = '+8613812345678';

export type IdentityTestApp = Readonly<{
  app: FastifyInstance;
  database: TestDatabase;
  pool: pg.Pool;
  transactions: TransactionManager;
  delivery: FakeOtpDeliveryProvider;
  facebookSubjects: Map<string, string>;
  dispose(): Promise<void>;
}>;

export type BuildIdentityAppOptions = Readonly<{
  database?: TestDatabase;
  facebookSubjects?: ReadonlyMap<string, string>;
  otpDelivery?: FakeOtpDeliveryProvider;
  facebookVerifier?: FacebookCredentialVerifier;
  otpHmacSecret?: string;
  jwtHmacSecret?: string;
  eventWriter?: IdentityEventWriter;
  logger?: import('pino').Logger<never, boolean> | import('pino').Logger<string, boolean>;
}>;

export async function buildIdentityTestApp(options: BuildIdentityAppOptions = {}): Promise<IdentityTestApp> {
  const owned = options.database === undefined;
  const database = options.database ?? await createTestDatabase(process.env.ADMIN_DATABASE_URL!);
  const logger = (options.logger ?? pino({ level: 'silent' })) as import('pino').Logger;
  const pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 10, connectionTimeoutMs: 3000, idleTimeoutMs: 3000 }, logger);
  const transactions = new TransactionManager(pool, logger);
  const delivery = options.otpDelivery ?? new FakeOtpDeliveryProvider();
  const facebookSubjects = new Map(options.facebookSubjects ?? []);
  const app = buildApp({ logger, database: asExecutor(pool) });
  const dependencies = createIdentityHttpDependencies({
    transactionManager: transactions,
    repositories: createIdentityRepositories,
    executor: asExecutor(pool),
    otpHmacSecret: options.otpHmacSecret ?? OTP_TEST_SECRET,
    jwtHmacSecret: options.jwtHmacSecret ?? JWT_TEST_SECRET,
    jwtIssuer: TEST_ISSUER,
    jwtAudience: TEST_AUDIENCE,
    otpDelivery: delivery,
    facebookVerifier: options.facebookVerifier ?? new FakeFacebookCredentialVerifier(facebookSubjects),
    ...(options.eventWriter ? { eventWriter: options.eventWriter } : {})
  });
  await identityModule.registerHttp(app, dependencies);
  return {
    app,
    database,
    pool,
    transactions,
    delivery,
    facebookSubjects,
    async dispose() { await app.close(); await pool.end(); if (owned) await database.dispose(); }
  };
}

export function signJwt(secret: string, payload: Record<string, unknown>, alg = 'HS256'): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const head = encode({ alg, typ: 'JWT' });
  const body = encode(payload);
  const signature = alg === 'none' ? '' : createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${signature}`;
}

export function hashRawRefresh(raw: string): string {
  return createHash('sha256').update(raw).digest('base64url');
}

export const auth = (accessToken: string) => ({ authorization: `Bearer ${accessToken}` });

export async function countOutboxEvents(pool: pg.Pool, eventType: string): Promise<number> {
  const result = await pool.query<{ count: string }>("SELECT count(*)::text AS count FROM infrastructure.system_outbox_events WHERE event_type=$1", [eventType]);
  return Number(result.rows[0]!.count);
}