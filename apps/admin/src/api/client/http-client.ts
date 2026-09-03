import { ApiError } from '../errors/api-error'
import { mapHttpError, mapNetworkError, UnauthorizedError } from '../errors'
import { createRequestId } from './request-id'
import { TimeoutError } from './timeout-error'

export type QueryValue = string | number | boolean | undefined | null

export interface ApiClientOptions {
  baseUrl: string
  /** Default per-request timeout in milliseconds. */
  timeoutMs?: number
  /** Returns the current access token, or null when signed out. */
  getAccessToken?: () => string | null
  /** Invoked when a request fails with 401. */
  onUnauthorized?: (error: UnauthorizedError) => void
  /**
   * Invoked when a request fails with 401 to give the app a chance to refresh
   * the access token. Return true to retry the original request once. The
   * retry happens with the token that getAccessToken() returns after this
   * resolves. Used by the admin session auto-refresh (US-002).
   */
  onUnauthorizedRetry?: () => Promise<boolean>
  /** Invoked when a request fails with 403 (e.g. to trigger silent /me permission refresh). */
  onForbidden?: (error: ApiError) => void
  /** Inject a fetch implementation (used by tests). */
  fetchImpl?: typeof fetch
  /** Extra default headers applied to every request. */
  defaultHeaders?: Record<string, string>
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method' | 'signal'> {
  /** URL query parameters; undefined/null/'' are omitted. */
  query?: Record<string, QueryValue>
  /** JSON body; serialized automatically. */
  json?: unknown
  /** Optional external signal (e.g. TanStack Query `signal`). */
  signal?: AbortSignal
  /** Per-request timeout override. */
  timeoutMs?: number
  /** Set false to skip the Authorization header for this request. */
  skipAuth?: boolean
  /** Raw body (overrides `json`); caller is responsible for serialization. */
  body?: BodyInit | null
}

export interface ApiResponse<T> {
  data: T
  status: number
  requestId: string
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')
  // The default frontend base is `/api`, while business contracts already
  // include `/api/v1`; avoid producing `/api/api/v1`.
  if (base.endsWith('/api') && normalizedPath.startsWith('api/')) {
    return `${base}/${normalizedPath.slice(4)}`
  }
  if (base === '/api' && normalizedPath.startsWith('health/')) {
    return `/${normalizedPath}`
  }
  return `${base}/${normalizedPath}`
}

function serializeQuery(
  query: Record<string, QueryValue> | undefined,
): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const str = params.toString()
  return str ? `?${str}` : ''
}

/**
 * The single V2 API client for the whole Admin.
 *
 * Responsibilities (ADM-F06):
 * - base URL
 * - JSON serialization / parsing
 * - timeout + external AbortSignal
 * - Authorization header via a token hook
 * - request id header
 * - unified error mapping
 * - network failure normalization
 *
 * Business components must NEVER `fetch()` directly and never build their own
 * HTTP wrapper.
 */
export class ApiClient {
  readonly baseUrl: string
  readonly timeoutMs: number
  private readonly getAccessToken?: () => string | null
  private readonly onUnauthorized?: (error: UnauthorizedError) => void
  private readonly onUnauthorizedRetry?: () => Promise<boolean>
  private readonly onForbidden?: (error: ApiError) => void
  private readonly fetchImpl: typeof fetch
  private readonly defaultHeaders: Record<string, string>

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl
    this.timeoutMs = options.timeoutMs ?? 15_000
    this.getAccessToken = options.getAccessToken
    this.onUnauthorized = options.onUnauthorized
    this.onUnauthorizedRetry = options.onUnauthorizedRetry
    this.onForbidden = options.onForbidden
    this.fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init))
    this.defaultHeaders = options.defaultHeaders ?? {}
  }

  async get<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, options)
  }

  async post<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, options)
  }

  async put<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, options)
  }

  async patch<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, options)
  }

  async delete<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, options)
  }

  /** Perform a single fetch with the current access token + body. */
  private async performFetch(
    method: string,
    url: string,
    fetchOptions: Record<string, unknown>,
    buildHeaders: () => Headers,
    buildBody: (headers: Headers) => BodyInit | null,
    signal: AbortSignal,
  ): Promise<Response> {
    const headers = buildHeaders()
    return this.fetchImpl(url, {
      ...fetchOptions,
      method,
      headers,
      body: buildBody(headers),
      signal,
      credentials: 'include',
    })
  }

  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const { query, json, timeoutMs: requestTimeoutMs, skipAuth, signal: externalSignal, body: rawBody, ...fetchOptions } = options
    const url = `${joinUrl(this.baseUrl, path)}${serializeQuery(query)}`
    const requestId = createRequestId()
    const timeoutMs = requestTimeoutMs ?? this.timeoutMs

    const controller = new AbortController()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)

    // Forward external cancellation (e.g. React Query signal).
    const onExternalAbort = () => controller.abort()
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort()
      else externalSignal.addEventListener('abort', onExternalAbort)
    }

    const buildHeaders = (): Headers => {
      const headers = new Headers(this.defaultHeaders)
      headers.set('Accept', 'application/json')
      headers.set('X-Request-Id', requestId)
      const token = skipAuth ? null : this.getAccessToken?.() ?? null
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    }

    const buildBody = (headers: Headers): BodyInit | null => {
      if (rawBody !== undefined) return rawBody
      if (json !== undefined) {
        headers.set('Content-Type', 'application/json')
        return JSON.stringify(json)
      }
      return null
    }

    try {
      let response = await this.performFetch(method, url, fetchOptions, buildHeaders, buildBody, controller.signal)

      // US-002: on 401, give the app one chance to refresh the access token and
      // retry the exact same request once. The refresh itself (skipAuth) never
      // retries, preventing a refresh loop. onUnauthorized (which clears the
      // session) fires only when the retry is unavailable or refresh fails.
      if (!response.ok && !skipAuth && this.onUnauthorizedRetry) {
        const bodyText = await response.text().catch(() => '')
        const error = await mapHttpErrorFrom(response, bodyText)
        if (error instanceof UnauthorizedError) {
          const refreshed = await this.onUnauthorizedRetry()
          if (refreshed && !externalSignal?.aborted) {
            response = await this.performFetch(method, url, fetchOptions, buildHeaders, buildBody, controller.signal)
          } else {
            this.onUnauthorized?.(error)
            throw error
          }
        }
      } else if (!response.ok) {
        const error = await mapHttpError(response)
        if (error instanceof UnauthorizedError) {
          this.onUnauthorized?.(error)
        } else if (error.kind === 'forbidden') {
          this.onForbidden?.(error)
        }
        throw error
      }

      if (!response.ok) {
        const error = await mapHttpError(response)
        if (error.kind === 'forbidden') {
          this.onForbidden?.(error)
        }
        throw error
      }

      const status = response.status
      let data: unknown = null
      if (status === 204) {
        data = null
      } else {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch {
            data = text
          }
        }
      }

      return {
        data: data as T,
        status,
        requestId,
      }
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (externalSignal?.aborted) {
        // The caller cancelled the request; re-throw as-is.
        throw error
      }
      if (timedOut) {
        throw new TimeoutError(timeoutMs)
      }
      throw mapNetworkError(error)
    } finally {
      clearTimeout(timer)
      externalSignal?.removeEventListener('abort', onExternalAbort)
    }
  }
}

/** Map an HTTP error from a response that has already been consumed. */
async function mapHttpErrorFrom(response: Response, bodyText: string): Promise<ApiError> {
  let body: unknown = null
  try {
    body = bodyText ? JSON.parse(bodyText) : null
  } catch {
    body = bodyText
  }
  const consumed = {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: response.headers,
    url: response.url,
    json: async () => body,
    text: async () => bodyText,
  } as unknown as Response
  return mapHttpError(consumed)
}
