import { beforeEach, describe, expect, it, vi } from 'vitest'
import { writeAdminSession, readAdminSession } from './session-store'
import { setAccessToken, getAccessToken } from './token-store'
import { refreshAdminSession } from './refresh-session'
import { assertUuid } from '@/api/contracts'

// Mock the api client so the refresh call hits a controllable stub.
const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }))
vi.mock('@/api/client', async (importOriginal) => {
  const actual = (await importOriginal()) as { apiClient: { post: (...args: unknown[]) => unknown } }
  return {
    ...actual,
    apiClient: Object.assign(actual.apiClient, { post: postMock }),
  }
})

const operator = { id: assertUuid('00000000-0000-4000-8000-000000000001'), name: 'admin', roleId: 'super_admin' }

beforeEach(() => {
  window.localStorage.clear()
  setAccessToken(null)
  postMock.mockReset()
})

describe('refreshAdminSession (US-002 / FR-007)', () => {
  it('refreshes tokens, updates session + token store, and reports success', async () => {
    writeAdminSession({ accessToken: 'old-access', refreshToken: 'old-refresh', operator, permissions: ['operations.operators.read'] })
    setAccessToken('old-access')
    postMock.mockResolvedValue({
      data: { access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'Bearer', expires_in: 900 },
      status: 200,
      requestId: 'req-1',
    })

    const ok = await refreshAdminSession()
    expect(ok).toBe(true)
    expect(postMock).toHaveBeenCalledWith('/api/v1/identity/sessions/refresh', expect.objectContaining({ skipAuth: true, json: { refresh_token: 'old-refresh' } }))
    expect(getAccessToken()).toBe('new-access')
    expect(readAdminSession()).toEqual(expect.objectContaining({ accessToken: 'new-access', refreshToken: 'new-refresh' }))
  })

  it('returns false when no persisted session / refresh token exists', async () => {
    const ok = await refreshAdminSession()
    expect(ok).toBe(false)
    expect(postMock).not.toHaveBeenCalled()
  })

  it('returns false when the refresh request fails (revoked/expired)', async () => {
    writeAdminSession({ accessToken: 'old-access', refreshToken: 'old-refresh', operator, permissions: [] })
    postMock.mockRejectedValue(new Error('INVALID_CREDENTIAL'))
    const ok = await refreshAdminSession()
    expect(ok).toBe(false)
    // Tokens must not be rotated on failure.
    expect(getAccessToken()).toBeNull()
  })

  it('is single-flight: concurrent calls share one refresh request', async () => {
    writeAdminSession({ accessToken: 'old-access', refreshToken: 'old-refresh', operator, permissions: [] })
    let resolveFn: (value: unknown) => void
    postMock.mockImplementation(() => new Promise((resolve) => { resolveFn = resolve }))
    const p1 = refreshAdminSession()
    const p2 = refreshAdminSession()
    expect(postMock).toHaveBeenCalledTimes(1)
    resolveFn!({ data: { access_token: 'new-access', refresh_token: 'new-refresh' }, status: 200, requestId: 'req-1' })
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1).toBe(true)
    expect(r2).toBe(true)
    expect(postMock).toHaveBeenCalledTimes(1)
  })
})
