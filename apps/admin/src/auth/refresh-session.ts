import { apiClient } from '@/api/client'
import { readAdminSession, writeAdminSession } from './session-store'
import { setAccessToken } from './token-store'

interface RefreshResponse {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in?: number
  session_expires_at?: string
}

/**
 * Admin session auto-refresh (US-002 / FR-007).
 *
 * Wired into the shared apiClient's `onUnauthorizedRetry` hook: when an
 * authenticated request receives 401, this attempts to refresh the access
 * token using the persisted refresh token and returns true so the client
 * retries the original request once. On failure (refresh token revoked,
 * network error, no session) it clears the session so the app redirects to
 * login.
 *
 * Refresh is single-flight: concurrent 401s share one refresh promise so the
 * backend's refresh-token rotation (which invalidates the old token) is only
 * hit once.
 */
let inFlight: Promise<boolean> | null = null

export async function refreshAdminSession(): Promise<boolean> {
  const session = readAdminSession()
  if (!session?.refreshToken) return false

  // Reuse an in-flight refresh to avoid racing token rotation.
  if (inFlight) return inFlight

  inFlight = doRefresh(session.refreshToken).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function doRefresh(refreshToken: string): Promise<boolean> {
  try {
    const response = await apiClient.post<RefreshResponse>('/api/v1/identity/sessions/refresh', {
      skipAuth: true,
      json: { refresh_token: refreshToken },
    })
    const data = response.data
    if (!data?.access_token || !data?.refresh_token) return false

    const current = readAdminSession()
    if (!current) return false
    // Rotate the persisted session with the new tokens, keeping operator/permissions.
    writeAdminSession({
      ...current,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    })
    setAccessToken(data.access_token)
    return true
  } catch {
    // Refresh failed (revoked/expired/invalid). The unauthorized handler will
    // clear the session; report failure so the original request is NOT retried.
    return false
  }
}
