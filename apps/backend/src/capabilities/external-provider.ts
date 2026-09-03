/**
 * External Provider HTTP 客户端基础设施（WP-04）。
 *
 * 为未来云 Provider Adapter 提供统一的“外部服务调用”原语：超时（AbortSignal）、
 * 有上限指数退避重试、上游 HTTP 错误建模。外部服务响应不是我们自己的业务状态码，
 * 因此这里只抛传输级错误（UpstreamHttpError / ProviderTimeoutError）；
 * 各 Provider Adapter 在边界用 provider-error.ts 统一翻译为 AppError。
 * 本模块不直接暴露给业务域。
 */
import { mapProviderError, type ProviderContext } from './provider-error.js';

export type RetryPolicy = Readonly<{
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs?: number;
}>;

/** 上游 5xx / 429 / 408 可重试；4xx 为调用方错误不可盲目重试。 */
export const RETRYABLE_HTTP_STATUSES: ReadonlySet<number> = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableHttpStatus(status: number): boolean {
  return RETRYABLE_HTTP_STATUSES.has(status);
}

/** 指数退避：base * 2^(attempt-1)，可设上限。 */
export function backoffDelayMs(attempt: number, policy: RetryPolicy): number {
  const exponential = policy.baseDelayMs * 2 ** (attempt - 1);
  return policy.maxDelayMs === undefined ? exponential : Math.min(exponential, policy.maxDelayMs);
}

export class ProviderTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`External provider call timed out after ${timeoutMs}ms`);
    this.name = 'ProviderTimeoutError';
  }
}

export class UpstreamHttpError extends Error {
  readonly status: number;
  readonly retryable: boolean;
  readonly body: string | undefined;

  constructor(message: string, status: number, retryable: boolean, body: string | undefined) {
    super(message);
    this.name = 'UpstreamHttpError';
    this.status = status;
    this.retryable = retryable;
    this.body = body;
  }
}

function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { name?: unknown; code?: unknown };
  return candidate.name === 'AbortError' || candidate.code === 'ABORT_ERR';
}

/** 给单次外部调用加超时；超时中止 signal 并抛 ProviderTimeoutError。 */
export async function withTimeout<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted && isAbortError(error)) throw new ProviderTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type RetryOptions = Readonly<{
  isRetryable?: (error: unknown, attempt: number) => boolean;
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
}>;

/** 有上限重试：默认全部错误可重试；attempt 达到 maxAttempts（须 >= 1）后抛出最后一次错误。 */
export async function withRetries<T>(operation: () => Promise<T>, policy: RetryPolicy, options: RetryOptions = {}): Promise<T> {
  let lastError: unknown = undefined;
  let attempt = 1;
  while (attempt <= policy.maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= policy.maxAttempts) break;
      if (options.isRetryable !== undefined && !options.isRetryable(error, attempt)) break;
      const delayMs = backoffDelayMs(attempt, policy);
      options.onRetry?.(attempt, delayMs, error);
      await sleep(delayMs);
    }
    attempt += 1;
  }
  throw lastError;
}

const NO_RETRY: RetryPolicy = { maxAttempts: 1, baseDelayMs: 0 };
const DEFAULT_TIMEOUT_MS = 10_000;

function resolveUrl(baseUrl: string, path: string | undefined): string {
  if (path === undefined) return baseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

export type ExternalProviderClientOptions = Readonly<{
  provider: string;
  baseUrl: string;
  headers?: Readonly<Record<string, string>>;
  timeoutMs?: number;
  retry?: RetryPolicy;
}>;

export type ExternalJsonCallOptions = Readonly<{
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** 相对路径（自动拼 baseUrl）或绝对 URL。 */
  path?: string;
  /** JSON 序列化发送；GET 带 body 时由调用方自担语义。 */
  body?: unknown;
  headers?: Readonly<Record<string, string>>;
  timeoutMs?: number;
  retry?: RetryPolicy;
}>;

/**
 * 轻量 JSON HTTP 客户端：统一 timeout + retry + 上游错误建模。
 * 非 2xx / 网络错误 / 超时最终抛 UpstreamHttpError 或 ProviderTimeoutError，
 * 由调用方 Adapter 负责翻译为 AppError。
 */
export class ExternalProviderClient {
  constructor(private readonly options: ExternalProviderClientOptions) {}

  private readonly context = (): ProviderContext => ({ provider: this.options.provider, operation: 'external-http' });

  async json<T>(call: ExternalJsonCallOptions = {}): Promise<T> {
    const timeoutMs = call.timeoutMs ?? this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const retry = call.retry ?? this.options.retry ?? NO_RETRY;
    const method = call.method ?? 'GET';
    const url = resolveUrl(this.options.baseUrl, call.path);
    const headers = new Headers(this.options.headers);
    if (call.headers !== undefined) {
      for (const [name, value] of Object.entries(call.headers)) headers.set(name, value);
    }
    let body: string | undefined;
    if (call.body !== undefined) {
      body = JSON.stringify(call.body);
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    }

    const attempt = async (): Promise<T> => {
      let response: Response;
      try {
        response = await withTimeout((signal) => {
          const init: RequestInit = { method, headers, signal };
          if (body !== undefined) init.body = body;
          return fetch(url, init);
        }, timeoutMs);
      } catch (error) {
        throw mapProviderError(this.context(), error);
      }
      if (response.ok) {
        return (await response.json()) as T;
      }
      const rawBody = await response.text().catch(() => undefined);
      throw new UpstreamHttpError(
        `Provider '${this.options.provider}' responded ${response.status} for ${method} ${url}`,
        response.status,
        isRetryableHttpStatus(response.status),
        rawBody,
      );
    };

    return withRetries(attempt, retry, {
      isRetryable: (error) => (error instanceof UpstreamHttpError ? error.retryable : true),
    });
  }
}
