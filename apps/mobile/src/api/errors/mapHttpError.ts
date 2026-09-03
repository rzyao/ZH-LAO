/**
 * HTTP -> domain error mapping.
 *
 * The V2 backend contract is authoritative for status semantics. The mapper is
 * defensive: it reads a correlation id from headers first and from the body
 * second, and never assumes a legacy envelope shape.
 */

import {
  ConflictError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
  UnauthorizedError,
  UnknownError,
  ValidationError,
  type AppError,
  type AppErrorKind,
  type AppErrorOptions,
} from './errors';

import type { RawHttpFailure } from '../client/types';

/**
 * Business status code to AppErrorKind dictionary (ADR-023).
 * When responses arrive with an envelope (including HTTP 200), the top-level `code` determines the error kind.
 */
export const BUSINESS_CODE_TO_KIND: Readonly<Record<string, AppErrorKind>> = {
  // unauthorized
  UNAUTHENTICATED: 'unauthorized',
  INVALID_CREDENTIAL: 'unauthorized',
  SESSION_EXPIRED: 'unauthorized',
  SESSION_REVOKED: 'unauthorized',
  TOKEN_EXPIRED: 'unauthorized',
  OPERATOR_ACCESS_DENIED: 'unauthorized',
  unauthorized: 'unauthorized',

  // forbidden
  FORBIDDEN: 'forbidden',
  ACCOUNT_DISABLED: 'forbidden',
  ACCOUNT_CLOSED: 'forbidden',
  OPERATOR_DISABLED: 'forbidden',
  SYSTEM_ROLE_PROTECTED: 'forbidden',
  ROLE_DISABLED: 'forbidden',
  forbidden: 'forbidden',

  // not_found
  NOT_FOUND: 'not_found',
  DEVICE_NOT_FOUND: 'not_found',
  PHONE_NOT_BOUND: 'not_found',
  PLATFORM_NOT_FOUND: 'not_found',
  RUNTIME_CONFIG_UNAVAILABLE: 'not_found',
  APP_VERSION_POLICY_UNAVAILABLE: 'not_found',
  OPERATOR_NOT_FOUND: 'not_found',
  ROLE_NOT_FOUND: 'not_found',
  AUDIT_LOG_NOT_FOUND: 'not_found',
  not_found: 'not_found',

  // validation
  VALIDATION_ERROR: 'validation',
  INVALID_ARGUMENT: 'validation',
  INVALID_DATA: 'validation',
  INVALID_REQUEST: 'validation',
  INVALID_PHONE: 'validation',
  IDENTITY_EMPTY_PROFILE_UPDATE: 'validation',
  OTP_EXPIRED: 'validation',
  OTP_LOCKED: 'validation',
  OTP_INVALID: 'validation',
  OTP_SECRET_INVALID: 'validation',
  PLATFORM_INVALID_ARGUMENT: 'validation',
  FEATURE_FLAG_INVALID_SCOPE: 'validation',
  RUNTIME_CONFIG_INVALID_VALUE: 'validation',
  RUNTIME_CONFIG_KEY_UNREGISTERED: 'validation',
  REGION_INVALID: 'validation',
  INVALID_PERMISSION: 'validation',
  ILLEGAL_STATE_TRANSITION: 'validation',
  validation: 'validation',
  validation_failed: 'validation',

  // conflict
  CONFLICT: 'conflict',
  STALE_VERSION_CONFLICT: 'conflict',
  DEVICE_OWNERSHIP_CONFLICT: 'conflict',
  PHONE_ALREADY_BOUND: 'conflict',
  IDENTITY_CONFLICT: 'conflict',
  IDENTITY_REFERENTIAL_CONFLICT: 'conflict',
  LEARNING_DIRECTION_IMMUTABLE: 'conflict',
  OTP_ALREADY_USED: 'conflict',
  BOOTSTRAP_ALREADY_COMPLETED: 'conflict',
  PLATFORM_CONFLICT: 'conflict',
  FEATURE_FLAG_RETIRED: 'conflict',
  RUNTIME_CONFIG_RETIRED: 'conflict',
  APP_VERSION_MISMATCH: 'conflict',
  APP_VERSION_INVALID_TRANSITION: 'conflict',
  ANNOUNCEMENT_INVALID_TRANSITION: 'conflict',
  REGION_RETIRED: 'conflict',
  OPERATOR_ALREADY_EXISTS: 'conflict',
  OPERATOR_AUTH_SUBJECT_NOT_FOUND: 'conflict',
  OPERATOR_AUTH_SUBJECT_INACTIVE: 'conflict',
  ROLE_CODE_CONFLICT: 'conflict',
  LAST_SUPER_ADMIN_REQUIRED: 'conflict',
  UNICODE_CONFLICT: 'conflict',
  ACTIVE_WORK_CONFLICT: 'conflict',
  conflict: 'conflict',

  // rate_limit
  RATE_LIMITED: 'rate_limit',
  LOGIN_RATE_LIMITED: 'rate_limit',
  OTP_RATE_LIMITED: 'rate_limit',
  rate_limit: 'rate_limit',
  rate_limited: 'rate_limit',

  // server
  INTERNAL_ERROR: 'server',
  PROVIDER_UNAVAILABLE: 'server',
  IDENTITY_REPOSITORY_FAILURE: 'server',
  OPERATOR_AUDIT_PERSISTENCE_FAILED: 'server',
  AUTHENTICATION_UNAVAILABLE: 'server',
  server: 'server',
  server_error: 'server',
};

const REQUEST_ID_HEADER_CANDIDATES = [
  'x-request-id',
  'x-correlation-id',
  'x-trace-id',
  'request-id',
];

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object') {
    return {};
  }
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (typeof value === 'string') {
      output[key.toLowerCase()] = value;
    } else if (typeof value === 'number') {
      output[key.toLowerCase()] = String(value);
    }
  }
  return output;
}

export function extractRequestId(
  headers: unknown,
  body: unknown,
): string | null {
  // ADR-023: If body is a unified envelope, top-level request_id takes authority.
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.request_id === 'string' && record.request_id.length > 0) {
      return record.request_id;
    }
  }

  const normalized = normalizeHeaders(headers);
  for (const candidate of REQUEST_ID_HEADER_CANDIDATES) {
    const value = normalized[candidate];
    if (value) {
      return value;
    }
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const nested = record.error;
    const sources: Record<string, unknown>[] = [
      record,
      nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : {},
    ];
    for (const source of sources) {
      for (const key of ['requestId', 'traceId', 'trace_id']) {
        const value = source[key];
        if (typeof value === 'string' && value.length > 0) {
          return value;
        }
      }
    }
  }

  return null;
}

/**
 * Extracts a human readable message from a backend payload without ever
 * exposing stack traces or internal diagnostics.
 */
export function extractServerMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  const nested = record.error;
  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>;
    if (typeof nestedRecord.message === 'string' && nestedRecord.message.trim()) {
      return nestedRecord.message;
    }
  }
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }
  return null;
}

/**
 * Extracts business status code from payload.
 */
export function extractBusinessCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (typeof record.code === 'string' && record.code.trim()) {
    return record.code.trim();
  }
  return null;
}

function parseRetryAfter(headers: Record<string, string>): number | null {
  const raw = headers['retry-after'];
  if (!raw) {
    return null;
  }
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

/** Maps a classified HTTP failure onto the unified mobile error model. */
export function mapHttpFailure(failure: RawHttpFailure): AppError {
  const headers = normalizeHeaders(failure.headers);
  const requestId = extractRequestId(failure.headers, failure.body) ?? failure.requestId;
  const serverMessage = extractServerMessage(failure.body);
  const businessCode = extractBusinessCode(failure.body) ?? failure.code;
  const base: AppErrorOptions = {
    requestId,
    status: failure.status,
    code: businessCode,
    details: failure.body ?? null,
  };

  const status = failure.status;

  if (status === null) {
    // No response at all.
    if (failure.kind === 'timeout') {
      return new TimeoutError(serverMessage ?? undefined, base);
    }
    return new NetworkError(serverMessage ?? undefined, base);
  }

  // ADR-023: If business code is present in dictionary, it determines error kind (even if HTTP 200)
  if (businessCode && businessCode in BUSINESS_CODE_TO_KIND) {
    const kind = BUSINESS_CODE_TO_KIND[businessCode]!;
    switch (kind) {
      case 'unauthorized':
        return new UnauthorizedError(serverMessage ?? undefined, base);
      case 'forbidden':
        return new ForbiddenError(serverMessage ?? undefined, base);
      case 'not_found':
        return new NotFoundError(serverMessage ?? undefined, base);
      case 'conflict':
        return new ConflictError(serverMessage ?? undefined, base);
      case 'validation':
        return new ValidationError(serverMessage ?? undefined, base);
      case 'rate_limit':
        return new RateLimitError(serverMessage ?? undefined, {
          ...base,
          retryAfterSeconds: parseRetryAfter(headers),
        });
      case 'server':
        return new ServerError(serverMessage ?? undefined, base);
      case 'unknown':
      default:
        return new UnknownError(serverMessage ?? undefined, base);
    }
  }

  // Transport status fallback (e.g. non-200 from reverse proxy or gateway)
  if (status === 401) {
    return new UnauthorizedError(serverMessage ?? undefined, base);
  }
  if (status === 403) {
    return new ForbiddenError(serverMessage ?? undefined, base);
  }
  if (status === 404) {
    return new NotFoundError(serverMessage ?? undefined, base);
  }
  if (status === 409) {
    return new ConflictError(serverMessage ?? undefined, base);
  }
  if (status === 422 || status === 400) {
    return new ValidationError(serverMessage ?? undefined, base);
  }
  if (status === 429) {
    return new RateLimitError(serverMessage ?? undefined, {
      ...base,
      retryAfterSeconds: parseRetryAfter(headers),
    });
  }
  if (status >= 500) {
    return new ServerError(serverMessage ?? undefined, base);
  }

  return new UnknownError(serverMessage ?? undefined, base);
}

/**
 * Normalises an unknown thrown value (axios error, abort, TypeError, ...)
 * into the unified error model. This is the single conversion point used by the
 * HTTP client so no screen ever sees a raw transport error.
 */
export function normalizeHttpError(error: unknown, fallbackRequestId: string | null): AppError {
  const candidate = error as {
    response?: { status?: number; data?: unknown; headers?: unknown };
    request?: unknown;
    code?: string;
    message?: string;
    name?: string;
  };

  // Explicit abort by the caller is surfaced as a timeout-style error.
  if (
    candidate?.name === 'CanceledError' ||
    candidate?.name === 'AbortError' ||
    candidate?.code === 'ERR_CANCELED'
  ) {
    return new TimeoutError('请求已取消。', {
      requestId: fallbackRequestId,
      status: null,
      code: 'ABORTED',
    });
  }

  const isTimeout =
    candidate?.code === 'ECONNABORTED' ||
    candidate?.code === 'ETIMEDOUT' ||
    /timeout/i.test(candidate?.message ?? '');

  if (candidate?.response) {
    return mapHttpFailure({
      status: candidate.response.status ?? null,
      code: candidate.code ?? null,
      headers: normalizeHeaders(candidate.response.headers),
      body: candidate.response.data ?? null,
      requestId: fallbackRequestId,
      kind: null,
    });
  }

  return mapHttpFailure({
    status: null,
    code: candidate?.code ?? null,
    headers: null,
    body: null,
    requestId: fallbackRequestId,
    kind: isTimeout ? 'timeout' : 'network',
  });
}
