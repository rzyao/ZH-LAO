/**
 * Application environment configuration.
 *
 * V2 rule: the API base URL may only come from explicit environment config.
 * There is intentionally NO hardcoded developer-machine address fallback —
 * a missing configuration must fail clearly instead of silently pointing at
 * some machine on the local network.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

export type LogLevelName = 'debug' | 'info' | 'warn' | 'error';

export interface AppConfig {
  readonly apiBaseUrl: string;
  readonly appEnv: AppEnvironment;
  readonly realtimeUrl: string | null;
  readonly logLevel: LogLevelName;
  readonly isProduction: boolean;
  readonly platform: 'web' | 'native';
}

export interface ConfigIssue {
  readonly code: 'MISSING_API_BASE_URL' | 'INVALID_API_BASE_URL' | 'INVALID_APP_ENV';
  readonly message: string;
}

export class AppConfigError extends Error {
  constructor(
    readonly issues: readonly ConfigIssue[],
  ) {
    super(
      `Invalid application configuration: ${issues.map((issue) => issue.message).join('; ')}`,
    );
    this.name = 'AppConfigError';
  }
}

export const CONFIG_ERROR_MESSAGE =
  '应用配置缺失：请设置 EXPO_PUBLIC_API_URL 后重新启动。Application configuration is missing: set EXPO_PUBLIC_API_URL and restart.';

const ALLOWED_APP_ENVS: readonly AppEnvironment[] = ['development', 'staging', 'production'];

function isWeb(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.location !== 'undefined' &&
    typeof (window as { location?: { href?: string } }).location?.href === 'string'
  );
}

/**
 * Reads the build-time public env vars.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at bundle time, so every key must be
 * referenced statically — a dynamic lookup cannot be inlined and would silently
 * produce `undefined` in the shipped bundle.
 */
export interface PublicEnvInput {
  readonly apiBaseUrl?: string | null;
  readonly appEnv?: string | null;
  readonly realtimeUrl?: string | null;
  readonly logLevel?: string | null;
}

export function readPublicEnv(): PublicEnvInput {
  return {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? null,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? null,
    realtimeUrl: process.env.EXPO_PUBLIC_REALTIME_URL ?? null,
    logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL ?? null,
  };
}

function trimToNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, '');
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Resolves the API base URL.
 *
 * - Explicit `EXPO_PUBLIC_API_URL` always wins.
 * - On Web, when no explicit value is provided, the app falls back to the
 *   current page origin (a development convenience, never a hardcoded host).
 * - On native, a missing value is a hard configuration error.
 */
export function resolveApiBaseUrl(
  explicit: string | null,
  platform: 'web' | 'native',
): { value: string | null; issue: ConfigIssue | null } {
  if (explicit) {
    const normalized = normalizeBaseUrl(explicit);
    if (!isValidHttpUrl(normalized)) {
      return {
        value: null,
        issue: {
          code: 'INVALID_API_BASE_URL',
          message: `EXPO_PUBLIC_API_URL is not a valid http(s) URL: ${explicit}`,
        },
      };
    }
    return { value: normalized, issue: null };
  }

  if (platform === 'web') {
    const origin = typeof window !== 'undefined' ? window.location?.origin : undefined;
    if (origin) {
      return { value: normalizeBaseUrl(origin), issue: null };
    }
  }

  return {
    value: null,
    issue: {
      code: 'MISSING_API_BASE_URL',
      message:
        'EXPO_PUBLIC_API_URL is not set. Native builds require an explicit API base URL.',
    },
  };
}

function parseAppEnv(raw: string | null): { value: AppEnvironment; issue: ConfigIssue | null } {
  if (!raw) {
    return { value: 'development', issue: null };
  }
  const lowered = raw.toLowerCase() as AppEnvironment;
  if (ALLOWED_APP_ENVS.includes(lowered)) {
    return { value: lowered, issue: null };
  }
  return {
    value: 'development',
    issue: {
      code: 'INVALID_APP_ENV',
      message: `EXPO_PUBLIC_APP_ENV must be one of ${ALLOWED_APP_ENVS.join(', ')} (received "${raw}").`,
    },
  };
}

function parseLogLevel(raw: string | null): LogLevelName {
  switch (raw?.toLowerCase()) {
    case 'debug':
      return 'debug';
    case 'info':
      return 'info';
    case 'warn':
      return 'warn';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
}

export function readAppConfig(): AppConfig {
  const env = readPublicEnv();
  const platform: 'web' | 'native' = isWeb() ? 'web' : 'native';
  const explicit = trimToNull(env.apiBaseUrl);
  const { value: apiBaseUrl } = resolveApiBaseUrl(explicit, platform);
  const { value: appEnv } = parseAppEnv(trimToNull(env.appEnv));
  const realtimeRaw = trimToNull(env.realtimeUrl);

  return {
    // Empty string is used as an explicit "unconfigured" marker so that the
    // HTTP client can refuse to build requests instead of guessing a host.
    apiBaseUrl: apiBaseUrl ?? '',
    appEnv,
    realtimeUrl: realtimeRaw && isValidHttpUrl(realtimeRaw) ? normalizeBaseUrl(realtimeRaw) : null,
    logLevel: parseLogLevel(trimToNull(env.logLevel)),
    isProduction: appEnv === 'production',
    platform,
  };
}

export function validateAppConfig(config: AppConfig): readonly ConfigIssue[] {
  const issues: ConfigIssue[] = [];

  if (!config.apiBaseUrl) {
    issues.push({
      code: 'MISSING_API_BASE_URL',
      message: 'EXPO_PUBLIC_API_URL is not set.',
    });
  } else if (!isValidHttpUrl(config.apiBaseUrl)) {
    issues.push({
      code: 'INVALID_API_BASE_URL',
      message: `API base URL is not a valid http(s) URL: ${config.apiBaseUrl}`,
    });
  }

  return issues;
}
