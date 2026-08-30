import { env } from '@/app/config'
import { getAccessToken } from '@/auth/token-store'
import { ApiClient } from './http-client'
import type { UnauthorizedError } from '../errors'

/**
 * The single shared V2 API client instance.
 *
 * Created once at module load. Business code imports `apiClient` from here —
 * it must never construct its own fetch wrapper.
 */

type UnauthorizedHandler = (error: UnauthorizedError) => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/** Register the app-level 401 handler (used by the auth skeleton). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
}

export const apiClient = new ApiClient({
  baseUrl: env.apiBaseUrl,
  timeoutMs: 15_000,
  getAccessToken,
  onUnauthorized: (error) => {
    unauthorizedHandler?.(error)
  },
})

export { ApiClient } from './http-client'
export { createRequestId } from './request-id'
export { TimeoutError } from './timeout-error'
export type { ApiClientOptions, RequestOptions, ApiResponse, QueryValue } from './http-client'
