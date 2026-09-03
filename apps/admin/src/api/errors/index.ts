import type { ApiErrorBody } from '../contracts/error'
import {
  BUSINESS_CODE_TO_KIND,
  ConflictError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  UnauthorizedError,
  UnknownError,
  ValidationError,
  type ApiErrorKind,
} from './api-error'
import type { ApiError } from './api-error'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseErrorBody(payload: unknown): ApiErrorBody | undefined {
  if (!isRecord(payload)) return undefined
  if (typeof payload.code !== 'string') {
    return undefined
  }

  // Canonical ADR-023 failure envelope: { code, error: { message, details? }, request_id }
  let message = ''
  let details: unknown = undefined
  if (isRecord(payload.error) && typeof payload.error.message === 'string') {
    message = payload.error.message
    details = payload.error.details
  } else if (typeof payload.message === 'string') {
    message = payload.message
    details = payload.details
  }

  const requestId =
    typeof payload.request_id === 'string'
      ? payload.request_id
      : typeof payload.requestId === 'string'
        ? payload.requestId
        : undefined

  return {
    code: payload.code,
    message,
    details: details ?? payload.details,
    request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
    requestId,
    error: isRecord(payload.error) && typeof payload.error.message === 'string'
      ? { message: payload.error.message, details: payload.error.details }
      : undefined,
  }
}

export function extractErrorBody(response: Response): Promise<ApiErrorBody | undefined> {
  return response
    .json()
    .then(parseErrorBody)
    .catch(() => undefined)
}

/**
 * Instantiate an ApiError subclass from an ApiErrorKind.
 */
export function createApiErrorByKind(
  kind: ApiErrorKind,
  body?: ApiErrorBody,
  status: number = 200,
): ApiError {
  switch (kind) {
    case 'unauthorized':
      return new UnauthorizedError(body, status)
    case 'forbidden':
      return new ForbiddenError(body, status)
    case 'not_found':
      return new NotFoundError(body, status)
    case 'conflict':
      return new ConflictError(body, status)
    case 'validation':
      return new ValidationError(body, status)
    case 'rate_limit':
      return new RateLimitError(body, status)
    case 'server':
      return new ServerError(status, body)
    case 'unknown':
    default:
      return new UnknownError(status, body)
  }
}

/**
 * Map an HTTP response or parsed business response to the corresponding ApiError subclass.
 * In ADR-023:
 * 1. If body.code matches BUSINESS_CODE_TO_KIND, it determines the error kind.
 * 2. Otherwise, fall back to HTTP status code (transport failure or gateway error).
 */
export async function mapHttpError(
  response: Response,
  preparsedPayload?: unknown,
): Promise<ApiError> {
  const body = preparsedPayload !== undefined
    ? parseErrorBody(preparsedPayload)
    : await extractErrorBody(response)

  // 1. Business status code dictionary mapping (ADR-023 primary)
  if (body?.code && body.code in BUSINESS_CODE_TO_KIND) {
    const kind = BUSINESS_CODE_TO_KIND[body.code]!
    return createApiErrorByKind(kind, body, response.status)
  }

  // 2. Fallback to HTTP status code (transport / gateway errors)
  switch (response.status) {
    case 401:
      return new UnauthorizedError(body, response.status)
    case 403:
      return new ForbiddenError(body, response.status)
    case 404:
      return new NotFoundError(body, response.status)
    case 409:
      return new ConflictError(body, response.status)
    case 422:
      return new ValidationError(body, response.status)
    case 429:
      return new RateLimitError(body, response.status)
    default:
      if (response.status >= 500) return new ServerError(response.status, body)
      return new UnknownError(response.status, body)
  }
}

/** Map a thrown fetch/Abort failure to a NetworkError. */
export function mapNetworkError(cause: unknown): NetworkError {
  return new NetworkError(cause)
}

export * from './api-error'
