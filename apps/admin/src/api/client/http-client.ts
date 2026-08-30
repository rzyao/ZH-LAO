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
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
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
  private readonly fetchImpl: typeof fetch
  private readonly defaultHeaders: Record<string, string>

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl
    this.timeoutMs = options.timeoutMs ?? 15_000
    this.getAccessToken = options.getAccessToken
    this.onUnauthorized = options.onUnauthorized
    this.fetchImpl = options.fetchImpl ?? fetch
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

  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = `${joinUrl(this.baseUrl, path)}${serializeQuery(options.query)}`
    const requestId = createRequestId()
    const timeoutMs = options.timeoutMs ?? this.timeoutMs

    const controller = new AbortController()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)

    // Forward external cancellation (e.g. React Query signal).
    const externalSignal = options.signal
    const onExternalAbort = () => controller.abort()
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort()
      else externalSignal.addEventListener('abort', onExternalAbort)
    }

    const headers = new Headers(this.defaultHeaders)
    headers.set('Accept', 'application/json')
    headers.set('X-Request-Id', requestId)

    const token = options.skipAuth ? null : this.getAccessToken?.() ?? null
    if (token) headers.set('Authorization', `Bearer ${token}`)

    let body: BodyInit | null = null
    if (options.body !== undefined) {
      body = options.body
    } else if (options.json !== undefined) {
      headers.set('Content-Type', 'application/json')
      body = JSON.stringify(options.json)
    }

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers,
        body,
        signal: controller.signal,
        credentials: 'include',
        ...options,
      })

      if (!response.ok) {
        const error = await mapHttpError(response)
        if (error instanceof UnauthorizedError) {
          this.onUnauthorized?.(error)
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
