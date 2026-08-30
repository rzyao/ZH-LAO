/**
 * Minimal structured logger for the ZH-LAO V2 mobile client.
 *
 * Security rule: tokens, passwords, OTP codes, authorization headers and any
 * other secret-bearing field must never be written to a log sink. Every object
 * passed to this logger is run through a redaction pass before being emitted.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Keys whose values must be replaced with a redaction marker. Matching is
 * case-insensitive so `Authorization`, `authorization` and `accessToken` are
 * all covered.
 */
const SENSITIVE_KEY_PATTERNS = [
  'password',
  'passwd',
  'secret',
  'token',
  'authorization',
  'auth',
  'otp',
  'code',
  'cookie',
  'session',
  'refreshtoken',
  'accesstoken',
  'privatekey',
  'credential',
];

export const REDACTED = '[REDACTED]';

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
  return SENSITIVE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    // Bearer / Basic credential prefixes are redacted even as bare strings.
    if (/^(bearer|basic)\s+/i.test(value)) {
      return REDACTED;
    }
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  const record = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(record)) {
    output[key] = isSensitiveKey(key) ? REDACTED : redactValue(entry, depth + 1);
  }

  return output;
}

export interface LoggerContext {
  readonly scope: string;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

function emit(
  level: LogLevel,
  scope: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[currentLevel]) {
    return;
  }

  const payload = context ? redactValue(context) : undefined;
  const prefix = `[${level.toUpperCase()}][${scope}]`;

  switch (level) {
    case 'debug':
    case 'info':
      // eslint-disable-next-line no-console
      console.log(prefix, message, payload ?? '');
      return;
    case 'warn':
      console.warn(prefix, message, payload ?? '');
      return;
    case 'error':
      console.error(prefix, message, payload ?? '');
      return;
  }
}

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

export function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}

export function createLogger(scope: string): Logger {
  return {
    debug: (message, context) => emit('debug', scope, message, context),
    info: (message, context) => emit('info', scope, message, context),
    warn: (message, context) => emit('warn', scope, message, context),
    error: (message, context) => emit('error', scope, message, context),
  };
}

export const logger = createLogger('app');
