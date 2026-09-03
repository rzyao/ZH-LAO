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
  SHUTDOWN_TIMEOUT_MS: int(100).default(10_000),
  // ---- WP-04：Platform Capability Providers ----
  // 每个能力独立选择 Provider。默认 unavailable/none = 能力 Port 存在但未接线，
  // 调用失败安全（PROVIDER_UNAVAILABLE / no-op cache），绝不静默 fake-success。
  // 'memory' / 'fake' 仅供 development/test（production 由 superRefine 拒绝）。
  // 注：生产 Object Storage / Translation / TTS / Media Provider 尚未冻结；
  // 未来真实 Provider 值在此枚举扩展，业务域代码无需改动。
  OBJECT_STORAGE_PROVIDER: z.enum(['unavailable', 'memory']).default('unavailable'),
  TRANSLATION_PROVIDER: z.enum(['unavailable', 'fake']).default('unavailable'),
  TTS_PROVIDER: z.enum(['unavailable', 'fake']).default('unavailable'),
  MEDIA_PROCESSING_PROVIDER: z.enum(['unavailable', 'fake']).default('unavailable'),
  // Cache：缺省按环境选择——development/test 为 'memory'，production 为 'none'
  // （见 env.ts）。生产多实例禁止单进程 Map 共享状态；Redis Adapter 未在本 WP
  // 捆绑上线，接入前必须显式选 'none' 或真实共享缓存。
  CACHE_PROVIDER: z.enum(['none', 'memory']).optional()
}).superRefine((value, context) => {
  if (value.DATABASE_POOL_MIN > value.DATABASE_POOL_MAX) {
    context.addIssue({ code: 'custom', path: ['DATABASE_POOL_MIN'], message: 'must not exceed DATABASE_POOL_MAX' });
  }
  if (value.APP_ENV === 'production' && !value.OTP_HMAC_SECRET) context.addIssue({ code: 'custom', path: ['OTP_HMAC_SECRET'], message: 'is required in production' });
  if (value.APP_ENV === 'production' && !value.JWT_HMAC_SECRET) context.addIssue({ code: 'custom', path: ['JWT_HMAC_SECRET'], message: 'is required in production' });
  if (value.APP_ENV === 'production' && value.IDENTITY_OTP_PROVIDER === 'console') context.addIssue({ code: 'custom', path: ['IDENTITY_OTP_PROVIDER'], message: 'console OTP provider is development-only' });
  if (value.APP_ENV === 'production' && value.OBJECT_STORAGE_PROVIDER === 'memory') context.addIssue({ code: 'custom', path: ['OBJECT_STORAGE_PROVIDER'], message: 'memory object storage is development/test-only' });
  if (value.APP_ENV === 'production' && value.TRANSLATION_PROVIDER === 'fake') context.addIssue({ code: 'custom', path: ['TRANSLATION_PROVIDER'], message: 'fake translation provider is development/test-only' });
  if (value.APP_ENV === 'production' && value.TTS_PROVIDER === 'fake') context.addIssue({ code: 'custom', path: ['TTS_PROVIDER'], message: 'fake TTS provider is development/test-only' });
  if (value.APP_ENV === 'production' && value.MEDIA_PROCESSING_PROVIDER === 'fake') context.addIssue({ code: 'custom', path: ['MEDIA_PROCESSING_PROVIDER'], message: 'fake media processing provider is development/test-only' });
  if (value.APP_ENV === 'production' && value.CACHE_PROVIDER === 'memory') context.addIssue({ code: 'custom', path: ['CACHE_PROVIDER'], message: 'memory cache must not back a multi-instance production deployment; set CACHE_PROVIDER=none or wire a shared cache' });
});

export type Environment = z.infer<typeof environmentSchema>;
