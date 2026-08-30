/**
 * V2 HTTP client contract.
 *
 * Only `src/api/client` may talk to the transport. Screens and features go
 * through feature hooks -> domain adapters -> this client.
 */

import type { AppErrorKind } from '../errors/errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  /** Absolute path starting with `/`. Base URL is prepended by the client. */
  readonly path: string;
  readonly method?: HttpMethod;
  readonly query?: Record<string, QueryValue>;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  /** Caller-controlled cancellation. */
  readonly signal?: AbortSignal;
  /** Per-request timeout override in milliseconds. */
  readonly timeoutMs?: number;
  /** Opt out of automatic Authorization injection (e.g. token endpoints). */
  readonly skipAuth?: boolean;
  /** Reuse a caller supplied correlation id instead of generating one. */
  readonly requestId?: string;
  /** Expected response shape guard; throws when the payload does not match. */
  readonly validate?: (payload: unknown) => boolean;
}

export interface HttpResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly requestId: string | null;
  readonly headers: Record<string, string>;
}

export interface HttpClient {
  request<T>(options: RequestOptions): Promise<HttpResponse<T>>;
  get<T>(path: string, options?: Omit<RequestOptions, 'path' | 'method'>): Promise<HttpResponse<T>>;
  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'path' | 'method' | 'body'>,
  ): Promise<HttpResponse<T>>;
  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'path' | 'method' | 'body'>,
  ): Promise<HttpResponse<T>>;
  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'path' | 'method' | 'body'>,
  ): Promise<HttpResponse<T>>;
  delete<T>(
    path: string,
    options?: Omit<RequestOptions, 'path' | 'method'>,
  ): Promise<HttpResponse<T>>;
}

/** Wire-level failure classification used by the error mapper. */
export interface RawHttpFailure {
  readonly status: number | null;
  readonly code: string | null;
  readonly headers: Record<string, string> | null;
  readonly body: unknown;
  readonly requestId: string | null;
  readonly kind: AppErrorKind | null;
}

export const REQUEST_ID_HEADER = 'X-Request-Id';

export const DEFAULT_TIMEOUT_MS = 15_000;
