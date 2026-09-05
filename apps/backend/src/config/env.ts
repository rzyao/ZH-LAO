import { environmentSchema, type Environment } from './schema.js';

export type AppConfig = Readonly<{
  environment: Environment['APP_ENV'];
  host: string;
  port: number;
  database: Readonly<{ url: string; poolMin: number; poolMax: number; connectionTimeoutMs: number; idleTimeoutMs: number }>;
  logLevel: Environment['LOG_LEVEL'];
  outbox: Readonly<{ pollIntervalMs: number; batchSize: number; leaseMs: number }>;
  contentLetterBatch: Readonly<{
    pollIntervalMs: number;
    batchSize: number;
    concurrency: number;
    activeTaskLimit: number;
    retryAfterSeconds: number;
  }>;
  identity: Readonly<{ otpHmacSecret: string | undefined; jwtHmacSecret: string | undefined; jwtIssuer: string; jwtAudience: string; otpProvider: 'console' | 'unavailable'; adminUsername: string; adminPassword: string }>;
  capabilities: Readonly<{
    objectStorage: 'unavailable' | 'memory' | 'r2';
    r2?: Readonly<{ endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string }>;
    translation: 'unavailable' | 'fake';
    tts: 'unavailable' | 'fake';
    media: 'unavailable' | 'fake';
    cache: 'none' | 'memory';
  }>;
  shutdownTimeoutMs: number;
}>;

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const env = environmentSchema.parse(source);
  const r2 = env.R2_ENDPOINT && env.R2_BUCKET && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
    ? Object.freeze({ endpoint: env.R2_ENDPOINT, bucket: env.R2_BUCKET, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY })
    : undefined;
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
    contentLetterBatch: Object.freeze({
      pollIntervalMs: env.CONTENT_LETTER_BATCH_POLL_INTERVAL_MS,
      batchSize: env.CONTENT_LETTER_BATCH_SIZE,
      concurrency: env.CONTENT_LETTER_BATCH_CONCURRENCY,
      activeTaskLimit: env.CONTENT_LETTER_BATCH_ACTIVE_TASK_LIMIT,
      retryAfterSeconds: env.CONTENT_LETTER_BATCH_RETRY_AFTER_SECONDS,
    }),
    identity: Object.freeze({ otpHmacSecret: env.OTP_HMAC_SECRET, jwtHmacSecret: env.JWT_HMAC_SECRET, jwtIssuer: env.JWT_ISSUER, jwtAudience: env.JWT_AUDIENCE, otpProvider: env.IDENTITY_OTP_PROVIDER, adminUsername: env.ADMIN_USERNAME, adminPassword: env.ADMIN_PASSWORD }),
    capabilities: Object.freeze({
      objectStorage: env.OBJECT_STORAGE_PROVIDER,
      ...(r2 === undefined ? {} : { r2 }),
      translation: env.TRANSLATION_PROVIDER,
      tts: env.TTS_PROVIDER,
      media: env.MEDIA_PROCESSING_PROVIDER,
      cache: env.CACHE_PROVIDER ?? (env.APP_ENV === 'production' ? 'none' : 'memory')
    }),
    shutdownTimeoutMs: env.SHUTDOWN_TIMEOUT_MS
  });
}

export function configSummary(config: AppConfig) {
  return { environment: config.environment, host: config.host, port: config.port, databasePoolMax: config.database.poolMax, logLevel: config.logLevel };
}
