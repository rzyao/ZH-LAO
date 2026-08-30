/**
 * Unified mobile error model.
 *
 * Every failure that reaches a screen is normalised into one of these classes.
 * Screens must never render raw backend stack traces or internal messages.
 */

export type AppErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'rate_limit'
  | 'server'
  | 'unknown';

export interface AppErrorOptions {
  /** Correlation id returned by the backend (`requestId` / `traceId`). */
  readonly requestId?: string | null;
  /** HTTP status when the failure came from a response. */
  readonly status?: number | null;
  /** Stable backend error code, independent of the human readable message. */
  readonly code?: string | null;
  /** Structured details, e.g. field-level validation failures. */
  readonly details?: unknown;
  readonly cause?: unknown;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly requestId: string | null;
  readonly status: number | null;
  readonly code: string | null;
  readonly details: unknown;
  override readonly cause: unknown;

  constructor(
    kind: AppErrorKind,
    message: string,
    options: AppErrorOptions = {},
  ) {
    super(message);
    this.name = new.target.name;
    this.kind = kind;
    this.requestId = options.requestId ?? null;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.details = options.details ?? null;
    this.cause = options.cause ?? null;
  }

  /** True when retrying the same request could plausibly succeed. */
  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }

  /** True when the session must be treated as expired. */
  get isAuthFailure(): boolean {
    return this.kind === 'unauthorized';
  }
}

/** Device has no connectivity / DNS / TLS / socket failure. */
export class NetworkError extends AppError {
  constructor(message = '网络连接不可用，请检查网络后重试。', options: AppErrorOptions = {}) {
    super('network', message, options);
  }
}

/** Request exceeded its timeout or was aborted by the caller. */
export class TimeoutError extends AppError {
  constructor(message = '请求超时，请稍后重试。', options: AppErrorOptions = {}) {
    super('timeout', message, options);
  }
}

/** 401 — no valid session. */
export class UnauthorizedError extends AppError {
  constructor(message = '登录状态已失效，请重新登录。', options: AppErrorOptions = {}) {
    super('unauthorized', message, options);
  }
}

/** 403 — authenticated but not permitted. */
export class ForbiddenError extends AppError {
  constructor(message = '你没有权限执行此操作。', options: AppErrorOptions = {}) {
    super('forbidden', message, options);
  }
}

/** 404 — resource does not exist or is not visible. */
export class NotFoundError extends AppError {
  constructor(message = '请求的内容不存在。', options: AppErrorOptions = {}) {
    super('not_found', message, options);
  }
}

/** 422 / field-level validation failure. */
export class ValidationError extends AppError {
  constructor(message = '提交的内容有误，请检查后重试。', options: AppErrorOptions = {}) {
    super('validation', message, options);
  }
}

/** 409 — state conflict (duplicate, version mismatch). */
export class ConflictError extends AppError {
  constructor(message = '数据存在冲突，请刷新后重试。', options: AppErrorOptions = {}) {
    super('conflict', message, options);
  }
}

/** 429 — too many requests. */
export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number | null;

  constructor(
    message = '操作过于频繁，请稍后再试。',
    options: AppErrorOptions & { retryAfterSeconds?: number | null } = {},
  ) {
    super('rate_limit', message, options);
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

/** 5xx — backend failure. */
export class ServerError extends AppError {
  constructor(message = '服务暂时不可用，请稍后重试。', options: AppErrorOptions = {}) {
    super('server', message, options);
  }
}

/** Fallback for anything the client cannot classify. */
export class UnknownError extends AppError {
  constructor(message = '发生未知错误，请稍后重试。', options: AppErrorOptions = {}) {
    super('unknown', message, options);
  }
}

/** Configuration failure — surfaced as a blocking config screen, never retried. */
export class ConfigurationError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super('unknown', message, options);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  if (error instanceof Error) {
    return new UnknownError(error.message, { cause: error });
  }
  return new UnknownError('发生未知错误，请稍后重试。', { cause: error });
}

/**
 * Maps an error to text that is safe to show a user. Backend stack traces and
 * internal diagnostics are explicitly never surfaced.
 */
export function toUserMessage(error: unknown): string {
  const appError = toAppError(error);
  if (appError.requestId) {
    return `${appError.message}（请求号 ${appError.requestId.slice(0, 8)}）`;
  }
  return appError.message;
}
