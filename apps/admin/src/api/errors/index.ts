import type { ApiErrorBody } from '../contracts/error'
import {
  ConflictError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  UnauthorizedError,
  UnknownError,
  ValidationError,
} from './api-error'
import type { ApiError } from './api-error'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseErrorBody(payload: unknown): ApiErrorBody | undefined {
  if (!isRecord(payload)) return undefined
  if (typeof payload.code !== 'string' || typeof payload.message !== 'string') {
    return undefined
  }
  const requestId =
    typeof payload.requestId === 'string' ? payload.requestId : undefined
  return {
    code: payload.code,
    message: payload.message,
    details: payload.details,
    requestId,
  }
}

function extractErrorBody(response: Response): Promise<ApiErrorBody | undefined> {
  return response
    .json()
    .then(parseErrorBody)
    .catch(() => undefined)
}

/** Map an HTTP response to the corresponding ApiError subclass. */
export async function mapHttpError(
  response: Response,
): Promise<ApiError> {
  const body = await extractErrorBody(response)
  switch (response.status) {
    case 401:
      return new UnauthorizedError(body)
    case 403:
      return new ForbiddenError(body)
    case 404:
      return new NotFoundError(body)
    case 409:
      return new ConflictError(body)
    case 422:
      return new ValidationError(body)
    case 429:
      return new RateLimitError(body)
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
