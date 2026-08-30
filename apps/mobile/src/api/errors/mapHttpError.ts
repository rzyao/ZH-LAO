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
  type AppErrorOptions,
} from './errors';

import type { RawHttpFailure } from '../client/types';

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
      for (const key of ['requestId', 'request_id', 'traceId', 'trace_id']) {
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
  const requestId = failure.requestId ?? extractRequestId(failure.headers, failure.body);
  const serverMessage = extractServerMessage(failure.body);
  const base: AppErrorOptions = {
    requestId,
    status: failure.status,
    code: failure.code,
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
