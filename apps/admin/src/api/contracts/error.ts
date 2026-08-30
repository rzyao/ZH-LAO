/**
 * V2 unified API error contract.
 *
 * Frozen envelope — every V2 endpoint error body uses this shape:
 *   { code, message, details?, requestId? }
 *
 * The frontend maps HTTP/transport failures into this shape via
 * `api/errors`. Domain-specific `code` values are owned by each Domain phase;
 * the envelope itself is global.
 */

export interface ApiErrorBody {
  /** Stable machine-readable error code, e.g. `validation_failed`. */
  code: string
  /** Human-readable message safe to display. */
  message: string
  /** Optional structured details (e.g. field errors). */
  details?: unknown
  /** Server request/trace id used for support. */
  requestId?: string
}

export const ERROR_BODY_KEYS = ['code', 'message', 'details', 'requestId'] as const
