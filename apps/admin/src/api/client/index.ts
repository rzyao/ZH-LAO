import { env } from '@/app/config'
import { getAccessToken } from '@/auth/token-store'
import { refreshAdminSession } from '@/auth/refresh-session'
import { ApiClient } from './http-client'
import type { ApiError, UnauthorizedError } from '../errors'

/**
 * The single shared V2 API client instance.
 *
 * Created once at module load. Business code imports `apiClient` from here —
 * it must never construct its own fetch wrapper.
 */

type UnauthorizedHandler = (error: UnauthorizedError) => void
type ForbiddenHandler = (error: ApiError) => void

let unauthorizedHandler: UnauthorizedHandler | null = null
let forbiddenHandler: ForbiddenHandler | null = null

/** Register the app-level 401 handler (used by the auth skeleton). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
}

/** Register the app-level 403 handler (used for real-time permission recovery, SC-007). */
export function setForbiddenHandler(handler: ForbiddenHandler | null) {
  forbiddenHandler = handler
}

export const apiClient = new ApiClient({
  baseUrl: env.apiBaseUrl,
  timeoutMs: 15_000,
  getAccessToken,
  onUnauthorized: (error) => {
    unauthorizedHandler?.(error)
  },
  // US-002: auto-refresh the access token on 401 and retry the request once.
  onUnauthorizedRetry: () => refreshAdminSession(),
  onForbidden: (error) => {
    forbiddenHandler?.(error)
  },
})

export { ApiClient } from './http-client'
export { createRequestId } from './request-id'
export { TimeoutError } from './timeout-error'
export type { ApiClientOptions, RequestOptions, ApiResponse, QueryValue } from './http-client'
