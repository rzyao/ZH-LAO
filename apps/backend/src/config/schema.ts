import { z } from 'zod';

const int = (minimum: number) => z.coerce.number().int().min(minimum);

export const environmentSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_HOST: z.string().min(1).default('127.0.0.1'),
  APP_PORT: int(1).max(65_535).default(3000),
  DATABASE_URL: z.url().refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), 'must be a PostgreSQL URL'),
  DATABASE_POOL_MIN: int(0).default(0),
  DATABASE_POOL_MAX: int(1).default(10),
  DATABASE_CONNECTION_TIMEOUT_MS: int(1).default(5_000),
  DATABASE_IDLE_TIMEOUT_MS: int(1).default(30_000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  OUTBOX_POLL_INTERVAL_MS: int(10).default(1_000),
  OUTBOX_BATCH_SIZE: int(1).max(1_000).default(50),
  OUTBOX_LEASE_MS: int(1_000).default(30_000),
  SHUTDOWN_TIMEOUT_MS: int(100).default(10_000)
}).superRefine((value, context) => {
  if (value.DATABASE_POOL_MIN > value.DATABASE_POOL_MAX) {
    context.addIssue({ code: 'custom', path: ['DATABASE_POOL_MIN'], message: 'must not exceed DATABASE_POOL_MAX' });
  }
});

export type Environment = z.infer<typeof environmentSchema>;
