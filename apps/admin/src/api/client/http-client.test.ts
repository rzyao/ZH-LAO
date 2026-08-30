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
  options: { timeoutMs?: number; token?: string; onUnauthorized?: (e: UnauthorizedError) => void } = {},
) {
  return new ApiClient({
    baseUrl: 'http://api.test/v1',
    fetchImpl,
    timeoutMs: options.timeoutMs ?? 10_000,
    getAccessToken:
      options.token === undefined ? undefined : () => options.token ?? null,
    onUnauthorized: options.onUnauthorized,
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
})
