/**
 * Unified API error and envelope contract (ADR-023).
 *
 * Success envelope:
 *   { code: "OK", data: <payload>, request_id: string }
 * Empty success envelope:
 *   { code: "OK", data: null, request_id: string }
 * Failure envelope:
 *   { code: string, error: { message: string, details?: unknown }, request_id: string }
 *
 * Backward-compatible shape:
 *   { code, message, details?, requestId?, request_id?, error? }
 */

export interface ApiErrorDetail {
  message: string
  details?: unknown
}

export interface ApiErrorBody {
  /** Stable machine-readable error code, e.g. `VALIDATION_ERROR` or `validation_failed`. */
  code: string
  /** Human-readable message safe to display. */
  message: string
  /** Optional structured details (e.g. field errors). */
  details?: unknown
  /** Server request/trace id used for support (canonical snake_case). */
  request_id?: string
  /** Server request/trace id used for support (legacy camelCase). */
  requestId?: string
  /** Canonical nested error details. */
  error?: ApiErrorDetail
}

export interface ApiResponseEnvelope<T = unknown> {
  code: string
  data?: T
  error?: ApiErrorDetail
  request_id: string
}

export const ERROR_BODY_KEYS = ['code', 'message', 'details', 'requestId', 'request_id', 'error'] as const
