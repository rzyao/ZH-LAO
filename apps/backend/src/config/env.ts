import { environmentSchema, type Environment } from './schema.js';

export type AppConfig = Readonly<{
  environment: Environment['APP_ENV'];
  host: string;
  port: number;
  database: Readonly<{ url: string; poolMin: number; poolMax: number; connectionTimeoutMs: number; idleTimeoutMs: number }>;
  logLevel: Environment['LOG_LEVEL'];
  outbox: Readonly<{ pollIntervalMs: number; batchSize: number; leaseMs: number }>;
  identity: Readonly<{ otpHmacSecret: string | undefined; jwtHmacSecret: string | undefined; jwtIssuer: string; jwtAudience: string; otpProvider: 'console' | 'unavailable' }>;
  shutdownTimeoutMs: number;
}>;

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const env = environmentSchema.parse(source);
  return Object.freeze({
    environment: env.APP_ENV,
    host: env.APP_HOST,
    port: env.APP_PORT,
    database: Object.freeze({
      url: env.DATABASE_URL,
      poolMin: env.DATABASE_POOL_MIN,
      poolMax: env.DATABASE_POOL_MAX,
      connectionTimeoutMs: env.DATABASE_CONNECTION_TIMEOUT_MS,
      idleTimeoutMs: env.DATABASE_IDLE_TIMEOUT_MS
    }),
    logLevel: env.LOG_LEVEL,
    outbox: Object.freeze({ pollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS, batchSize: env.OUTBOX_BATCH_SIZE, leaseMs: env.OUTBOX_LEASE_MS }),
    identity: Object.freeze({ otpHmacSecret: env.OTP_HMAC_SECRET, jwtHmacSecret: env.JWT_HMAC_SECRET, jwtIssuer: env.JWT_ISSUER, jwtAudience: env.JWT_AUDIENCE, otpProvider: env.IDENTITY_OTP_PROVIDER }),
    shutdownTimeoutMs: env.SHUTDOWN_TIMEOUT_MS
  });
}

export function configSummary(config: AppConfig) {
  return { environment: config.environment, host: config.host, port: config.port, databasePoolMax: config.database.poolMax, logLevel: config.logLevel };
}
