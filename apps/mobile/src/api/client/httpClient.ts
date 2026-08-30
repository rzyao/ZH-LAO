import axios, { AxiosError } from 'axios';

import { ConfigurationError, UnknownError } from '../errors/errors';
import { normalizeHttpError } from '../errors/mapHttpError';
import { readAppConfig } from '../../config/env';
import { createLogger } from '../../utils/logger';
import { createRequestId } from '../../utils/requestId';

import {
  DEFAULT_TIMEOUT_MS,
  REQUEST_ID_HEADER,
  type HttpClient,
  type HttpMethod,
  type HttpResponse,
  type QueryValue,
  type RequestOptions,
} from './types';

const log = createLogger('http');

/**
 * Access-token provider.
 *
 * The HTTP client does not know anything about the auth domain; it only asks a
 * registered provider for the current bearer token. The token itself lives in
 * memory (never AsyncStorage) and is never logged.
 */
export type AccessTokenProvider = () => string | null | Promise<string | null>;

let accessTokenProvider: AccessTokenProvider | null = null;

export function setAccessTokenProvider(provider: AccessTokenProvider | null): void {
  accessTokenProvider = provider;
}

/** Called when the backend rejects a request with 401. Wired by the auth layer. */
export type UnauthorizedListener = (error: unknown) => void;

let unauthorizedListener: UnauthorizedListener | null = null;

export function setUnauthorizedListener(listener: UnauthorizedListener | null): void {
  unauthorizedListener = listener;
}

function buildQueryString(query: Record<string, QueryValue> | undefined): string {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    params.append(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object') {
    return {};
  }
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (typeof value === 'string' || typeof value === 'number') {
      output[key] = String(value);
    }
  }
  return output;
}

/**
 * Resolves the base URL at request time. Configuration errors fail loudly
 * instead of silently falling back to a guessed host.
 */
function resolveBaseUrl(): string {
  const config = readAppConfig();
  if (!config.apiBaseUrl) {
    throw new ConfigurationError(
      'API base URL is not configured. Set EXPO_PUBLIC_API_URL before making requests.',
    );
  }
  return config.apiBaseUrl;
}

export interface V2HttpClient extends HttpClient {
  /** Test/debug seam: current resolved base URL (empty when unconfigured). */
  readonly baseUrl: string;
}

function createAxiosInstance() {
  return axios.create({
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    // Never throw for any status; the mapper owns error semantics.
    validateStatus: () => true,
  });
}

let instance = createAxiosInstance();

/** Replaces the transport instance. Used by tests only. */
export function __setHttpTransportForTests(next: typeof instance | null): void {
  instance = next ?? createAxiosInstance();
}

async function send<T>(options: RequestOptions): Promise<HttpResponse<T>> {
  const method: HttpMethod = options.method ?? 'GET';
  const requestId = options.requestId ?? createRequestId();
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}${options.path}${buildQueryString(options.query)}`;

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
    [REQUEST_ID_HEADER]: requestId,
  };

  if (!options.skipAuth && accessTokenProvider) {
    const token = await accessTokenProvider();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  log.debug('request', {
    method,
    path: options.path,
    requestId,
    hasAuthorization: Boolean(headers.Authorization),
  });

  let response;
  try {
    response = await instance.request<T>({
      url,
      method,
      data: options.body ?? undefined,
      headers,
      timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      signal: options.signal,
      // Axios would otherwise reject on non-2xx; we classify ourselves.
      validateStatus: () => true,
    });
  } catch (error) {
    const isAxiosError = error instanceof AxiosError;
    const normalized = normalizeHttpError(error, requestId);

    if (normalized.kind === 'unauthorized' && unauthorizedListener) {
      unauthorizedListener(normalized);
    }

    log.warn('request failed', {
      method,
      path: options.path,
      requestId,
      kind: normalized.kind,
      isAxiosError,
    });

    throw normalized;
  }

  const responseHeaders = normalizeHeaders(response.headers);
  const responseRequestId = responseHeaders[REQUEST_ID_HEADER.toLowerCase()] ?? requestId;

  if (response.status >= 400) {
    const normalized = normalizeHttpError(
      {
        response: {
          status: response.status,
          data: response.data,
          headers: response.headers,
        },
        code: `HTTP_${response.status}`,
      },
      requestId,
    );

    if (normalized.kind === 'unauthorized' && unauthorizedListener) {
      unauthorizedListener(normalized);
    }

    log.warn('request rejected', {
      method,
      path: options.path,
      requestId,
      status: response.status,
      kind: normalized.kind,
    });

    throw normalized;
  }

  if (options.validate && !options.validate(response.data)) {
    throw new UnknownError('服务端返回的数据格式不正确。', {
      requestId,
      status: response.status,
      code: 'INVALID_RESPONSE_SHAPE',
    });
  }

  log.debug('response', { method, path: options.path, requestId, status: response.status });

  return {
    data: response.data as T,
    status: response.status,
    requestId: responseRequestId,
    headers: responseHeaders,
  };
}

/**
 * The single V2 HTTP client.
 *
 * No screen and no feature module may create another axios instance.
 */
export const httpClient: V2HttpClient = {
  get baseUrl(): string {
    try {
      return resolveBaseUrl();
    } catch {
      return '';
    }
  },
  request: send,
  get: <T,>(path: string, options?: Omit<RequestOptions, 'path' | 'method'>) =>
    send<T>({ ...options, path, method: 'GET' }),
  post: <T,>(path: string, body?: unknown, options?: Omit<RequestOptions, 'path' | 'method' | 'body'>) =>
    send<T>({ ...options, path, method: 'POST', body }),
  put: <T,>(path: string, body?: unknown, options?: Omit<RequestOptions, 'path' | 'method' | 'body'>) =>
    send<T>({ ...options, path, method: 'PUT', body }),
  patch: <T,>(path: string, body?: unknown, options?: Omit<RequestOptions, 'path' | 'method' | 'body'>) =>
    send<T>({ ...options, path, method: 'PATCH', body }),
  delete: <T,>(path: string, options?: Omit<RequestOptions, 'path' | 'method'>) =>
    send<T>({ ...options, path, method: 'DELETE' }),
};
