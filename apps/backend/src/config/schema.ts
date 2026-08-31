import { z } from 'zod';

const int = (minimum: number) => z.coerce.number().int().min(minimum);

export const environmentSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_HOST: z.string().min(1).default('127.0.0.1'),
  APP_PORT: int(1).max(65_535).default(18080),
  DATABASE_URL: z.url().refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), 'must be a PostgreSQL URL'),
  DATABASE_POOL_MIN: int(0).default(0),
  DATABASE_POOL_MAX: int(1).default(10),
  DATABASE_CONNECTION_TIMEOUT_MS: int(1).default(5_000),
  DATABASE_IDLE_TIMEOUT_MS: int(1).default(30_000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  OUTBOX_POLL_INTERVAL_MS: int(10).default(1_000),
  OUTBOX_BATCH_SIZE: int(1).max(1_000).default(50),
  OUTBOX_LEASE_MS: int(1_000).default(30_000),
  OTP_HMAC_SECRET: z.string().min(32).optional(),
  JWT_HMAC_SECRET: z.string().min(32).optional(),
  JWT_ISSUER: z.string().min(1).default('zh-lao'),
  JWT_AUDIENCE: z.string().min(1).default('zh-lao-client'),
  // 显式 OTP 投递 provider 裁决：默认 unavailable（未接真实 SMS 时失败安全 503）；
  // console 仅允许 development 显式启用，绝不静默 fake-success。
  IDENTITY_OTP_PROVIDER: z.enum(['console', 'unavailable']).default('unavailable'),
  ADMIN_USERNAME: z.string().trim().min(1).max(100).default('admin'),
  ADMIN_PASSWORD: z.string().min(1).max(200).default('123456'),
  SHUTDOWN_TIMEOUT_MS: int(100).default(10_000)
}).superRefine((value, context) => {
  if (value.DATABASE_POOL_MIN > value.DATABASE_POOL_MAX) {
    context.addIssue({ code: 'custom', path: ['DATABASE_POOL_MIN'], message: 'must not exceed DATABASE_POOL_MAX' });
  }
  if (value.APP_ENV === 'production' && !value.OTP_HMAC_SECRET) context.addIssue({ code: 'custom', path: ['OTP_HMAC_SECRET'], message: 'is required in production' });
  if (value.APP_ENV === 'production' && !value.JWT_HMAC_SECRET) context.addIssue({ code: 'custom', path: ['JWT_HMAC_SECRET'], message: 'is required in production' });
  if (value.APP_ENV === 'production' && value.IDENTITY_OTP_PROVIDER === 'console') context.addIssue({ code: 'custom', path: ['IDENTITY_OTP_PROVIDER'], message: 'console OTP provider is development-only' });
});

export type Environment = z.infer<typeof environmentSchema>;
