import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from './http-client'
import {
  ConflictError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  UnauthorizedError,
  ValidationError,
} from '../errors'
import { TimeoutError } from './timeout-error'

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

function makeClient(
  fetchImpl: typeof fetch,
  options: { timeoutMs?: number; token?: string; onUnauthorized?: (e: UnauthorizedError) => void; onUnauthorizedRetry?: () => Promise<boolean> } = {},
) {
  return new ApiClient({
    baseUrl: 'http://api.test/v1',
    fetchImpl,
    timeoutMs: options.timeoutMs ?? 10_000,
    getAccessToken:
      options.token === undefined ? undefined : () => options.token ?? null,
    onUnauthorized: options.onUnauthorized,
    onUnauthorizedRetry: options.onUnauthorizedRetry,
  })
}

describe('ApiClient', () => {
  it('parses a successful JSON response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }))
    const client = makeClient(fetchImpl)
    const result = await client.get<{ ok: boolean }>('/ping')
    expect(result.data).toEqual({ ok: true })
    expect(result.status).toBe(200)
    expect(result.requestId).toBeTruthy()
  })

  it('handles 204 empty responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const client = makeClient(fetchImpl)
    const result = await client.delete('/things/1')
    expect(result.data).toBeNull()
  })

  it('maps 401 to UnauthorizedError and fires the handler', async () => {
    const onUnauthorized = vi.fn()
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { code: 'unauthorized', message: 'nope' }))
    const client = makeClient(fetchImpl, { onUnauthorized })
    await expect(client.get('/x')).rejects.toBeInstanceOf(UnauthorizedError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('retries once after onUnauthorizedRetry succeeds (US-002 auto-refresh)', async () => {
    const onUnauthorized = vi.fn()
    const onUnauthorizedRetry = vi.fn().mockResolvedValue(true)
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { code: 'unauthorized', message: 'nope' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
    const client = makeClient(fetchImpl, { onUnauthorized, onUnauthorizedRetry })
    const result = await client.get<{ ok: boolean }>('/x')
    expect(result.data).toEqual({ ok: true })
    // Refresh succeeded -> request retried, onUnauthorized (session clear) NOT fired.
    expect(onUnauthorizedRetry).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('does NOT retry and fires onUnauthorized when onUnauthorizedRetry fails', async () => {
    const onUnauthorized = vi.fn()
    const onUnauthorizedRetry = vi.fn().mockResolvedValue(false)
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { code: 'unauthorized', message: 'nope' }))
    const client = makeClient(fetchImpl, { onUnauthorized, onUnauthorizedRetry })
    await expect(client.get('/x')).rejects.toBeInstanceOf(UnauthorizedError)
    expect(onUnauthorizedRetry).toHaveBeenCalledTimes(1)
    // Refresh failed -> session cleared, no retry.
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('does not retry the refresh request itself (skipAuth prevents loop)', async () => {
    const onUnauthorized = vi.fn()
    const onUnauthorizedRetry = vi.fn().mockResolvedValue(true)
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { code: 'unauthorized', message: 'nope' }))
    const client = makeClient(fetchImpl, { onUnauthorized, onUnauthorizedRetry })
    // skipAuth: true -> no Authorization header, and the 401 must NOT trigger retry.
    await expect(client.post('/auth/refresh', { skipAuth: true, json: {} })).rejects.toBeInstanceOf(UnauthorizedError)
    expect(onUnauthorizedRetry).not.toHaveBeenCalled()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('maps HTTP statuses to the correct error kinds', async () => {
    const cases: Array<[number, new (...args: never[]) => Error]> = [
      [403, ForbiddenError],
      [404, NotFoundError],
      [409, ConflictError],
      [422, ValidationError],
      [429, RateLimitError],
      [500, ServerError],
    ]
    for (const [status, Klass] of cases) {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(jsonResponse(status, { code: 'x', message: 'err' }))
      const client = makeClient(fetchImpl)
      await expect(client.get('/x')).rejects.toBeInstanceOf(Klass)
    }
  })

  it('maps a rejected fetch to NetworkError', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const client = makeClient(fetchImpl)
    await expect(client.get('/x')).rejects.toBeInstanceOf(NetworkError)
  })

  it('maps a timeout to TimeoutError', async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          }),
      )
    const client = makeClient(fetchImpl, { timeoutMs: 20 })
    await expect(client.get('/x')).rejects.toBeInstanceOf(TimeoutError)
  })

  it('sends the Authorization header from the token hook', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    const client = makeClient(fetchImpl, { token: 'token-abc' })
    await client.get('/x')
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBe('Bearer token-abc')
  })

  it('omits the Authorization header when signed out', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    const client = makeClient(fetchImpl, { token: undefined })
    await client.get('/x')
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBeNull()
  })

  it('sends a request id header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    const client = makeClient(fetchImpl)
    await client.get('/x')
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(headers.get('X-Request-Id')).toBeTruthy()
  })

  it('serializes JSON bodies and query parameters', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    const client = makeClient(fetchImpl)
    await client.post('/things', {
      json: { name: 'x' },
      query: { page: 1, q: 'lao', skip: undefined, empty: '' },
    })
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('?page=1')
    expect(url).toContain('q=lao')
    expect(url).not.toContain('skip')
    expect(url).not.toContain('empty')
    expect(init.body).toBe(JSON.stringify({ name: 'x' }))
  })

  it('unwraps data from unified success envelope { code: "OK", data, request_id }', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        code: 'OK',
        data: { id: 'item-1', name: 'Test' },
        request_id: 'req-unified-123',
      }),
    )
    const client = makeClient(fetchImpl)
    const result = await client.get<{ id: string; name: string }>('/things/1')
    expect(result.data).toEqual({ id: 'item-1', name: 'Test' })
    expect(result.requestId).toBe('req-unified-123')
    expect(result.status).toBe(200)
  })

  it('handles empty success envelope data: null (204 equivalent) without error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        code: 'OK',
        data: null,
        request_id: 'req-empty-456',
      }),
    )
    const client = makeClient(fetchImpl)
    const result = await client.delete('/things/1')
    expect(result.data).toBeNull()
    expect(result.requestId).toBe('req-empty-456')
    expect(result.status).toBe(200)
  })

  it('rejects HTTP 200 failure envelope with code !== "OK" and throws corresponding ApiError', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        code: 'FORBIDDEN',
        error: { message: '没有权限' },
        request_id: 'req-fail-789',
      }),
    )
    const client = makeClient(fetchImpl)
    const errorPromise = client.get('/forbidden-resource')
    await expect(errorPromise).rejects.toBeInstanceOf(ForbiddenError)
    await errorPromise.catch((err) => {
      expect(err.code).toBe('FORBIDDEN')
      expect(err.requestId).toBe('req-fail-789')
      expect(err.message).toBe('没有权限')
    })
  })

  it('reads request_id strictly from envelope top level and matches backend format (US4 / T031)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        200,
        {
          code: 'OK',
          data: { value: 42 },
          request_id: 'req-top-level-strict',
        },
        { 'x-request-id': 'req-header-fallback' },
      ),
    )
    const client = makeClient(fetchImpl)
    const result = await client.get<{ value: number }>('/strict-id')
    expect(result.requestId).toBe('req-top-level-strict')
  })

  it('triggers onUnauthorized and rejects on HTTP 200 UNAUTHENTICATED envelope', async () => {
    const onUnauthorized = vi.fn()
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        code: 'UNAUTHENTICATED',
        error: { message: '登录状态已失效' },
        request_id: 'req-unauth-001',
      }),
    )
    const client = makeClient(fetchImpl, { onUnauthorized })
    await expect(client.get('/secure')).rejects.toBeInstanceOf(UnauthorizedError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})
