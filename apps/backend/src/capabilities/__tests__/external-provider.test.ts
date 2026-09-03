import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ExternalProviderClient,
  ProviderTimeoutError,
  UpstreamHttpError,
  backoffDelayMs,
  mapProviderError,
} from '../index.js';
import { AppError } from '../../errors/app-error.js';
import { INTERNAL_ERROR, PROVIDER_UNAVAILABLE } from '../../errors/business-codes.js';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const abortError = (): DOMException => new DOMException('The operation was aborted', 'AbortError');

describe('backoffDelayMs (WP-04)', () => {
  it('grows exponentially from base and respects maxDelayMs cap', () => {
    expect(backoffDelayMs(1, { maxAttempts: 3, baseDelayMs: 100 })).toBe(100);
    expect(backoffDelayMs(2, { maxAttempts: 3, baseDelayMs: 100 })).toBe(200);
    expect(backoffDelayMs(3, { maxAttempts: 3, baseDelayMs: 100 })).toBe(400);
    expect(backoffDelayMs(4, { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 250 })).toBe(250);
  });
});

describe('ExternalProviderClient (WP-04)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('performs a GET, resolves URL against baseUrl and returns parsed JSON', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new ExternalProviderClient({ provider: 'tts-upstream', baseUrl: 'https://api.example.com' });
    const result = await client.json<{ ok: boolean }>({ path: '/v1/ping' });
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example.com/v1/ping');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'GET' });
  });

  it('serializes POST bodies as JSON and sets content-type header', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({ accepted: true }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new ExternalProviderClient({ provider: 'translation-upstream', baseUrl: 'https://api.example.com/' });
    const result = await client.json<{ accepted: boolean }>({ method: 'POST', path: 'v1/translate', body: { text: 'hi' } });
    expect(result).toEqual({ accepted: true });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.body).toBe(JSON.stringify({ text: 'hi' }));
    expect((init?.headers as Headers).get('content-type')).toBe('application/json');
  });

  it('raises ProviderTimeoutError as PROVIDER_UNAVAILABLE AppError when upstream exceeds timeoutMs', async () => {
    const slowFetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(abortError()));
        }),
    );
    vi.stubGlobal('fetch', slowFetch);
    const client = new ExternalProviderClient({ provider: 'slow', baseUrl: 'https://slow.example.com/', timeoutMs: 20 });
    const error = await client.json({ path: '/v1/x' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: PROVIDER_UNAVAILABLE });
    expect((error as AppError).cause).toBeInstanceOf(ProviderTimeoutError);
  });

  it('retries retryable upstream 5xx up to maxAttempts then succeeds', async () => {
    let calls = 0;
    const flakyFetch = vi.fn(async () => {
      calls += 1;
      return calls < 3 ? jsonResponse({ nope: true }, 503) : jsonResponse({ ok: true });
    });
    vi.stubGlobal('fetch', flakyFetch);
    const client = new ExternalProviderClient({
      provider: 'flaky',
      baseUrl: 'https://api.example.com/',
      retry: { maxAttempts: 3, baseDelayMs: 0 },
    });
    const result = await client.json<{ ok: boolean }>({ path: '/v1/x' });
    expect(result).toEqual({ ok: true });
    expect(calls).toBe(3);
  });

  it('stops retrying on retry boundary exhaustion and surfaces the last upstream error', async () => {
    let calls = 0;
    const failingFetch = vi.fn(async () => {
      calls += 1;
      return jsonResponse({ nope: true }, 503);
    });
    vi.stubGlobal('fetch', failingFetch);
    const client = new ExternalProviderClient({
      provider: 'flaky',
      baseUrl: 'https://api.example.com/',
      retry: { maxAttempts: 2, baseDelayMs: 0 },
    });
    const error = await client.json({ path: '/v1/x' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(UpstreamHttpError);
    expect(error).toMatchObject({ status: 503, retryable: true });
    expect(calls).toBe(2);
  });

  it('does not retry non-retryable upstream 4xx errors', async () => {
    let calls = 0;
    const badRequestFetch = vi.fn(async () => {
      calls += 1;
      return jsonResponse({ reason: 'bad payload' }, 400);
    });
    vi.stubGlobal('fetch', badRequestFetch);
    const client = new ExternalProviderClient({
      provider: 'flaky',
      baseUrl: 'https://api.example.com/',
      retry: { maxAttempts: 3, baseDelayMs: 0 },
    });
    const error = await client.json({ path: '/v1/x' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(UpstreamHttpError);
    expect(error).toMatchObject({ status: 400, retryable: false });
    expect(calls).toBe(1);
  });

  it('retries transient network failures', async () => {
    let calls = 0;
    const networkFetch = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('fetch failed');
      return jsonResponse({ ok: true });
    });
    vi.stubGlobal('fetch', networkFetch);
    const client = new ExternalProviderClient({
      provider: 'unstable',
      baseUrl: 'https://api.example.com/',
      retry: { maxAttempts: 3, baseDelayMs: 0 },
    });
    await expect(client.json<{ ok: boolean }>({ path: '/v1/x' })).resolves.toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it('without a retry policy performs exactly one attempt', async () => {
    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls += 1;
      return jsonResponse({ nope: true }, 500);
    });
    vi.stubGlobal('fetch', fetchMock);
    const client = new ExternalProviderClient({ provider: 'x', baseUrl: 'https://api.example.com/' });
    await expect(client.json({ path: '/v1/x' })).rejects.toBeInstanceOf(UpstreamHttpError);
    expect(calls).toBe(1);
  });
});

describe('mapProviderError (WP-04 / ADR-023 boundary translation)', () => {
  it('wraps upstream transport errors into PROVIDER_UNAVAILABLE AppError keeping the cause', () => {
    const upstream = new UpstreamHttpError('boom', 503, true, undefined);
    const mapped = mapProviderError({ provider: 'translation', operation: 'translate' }, upstream);
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped).toMatchObject({ code: PROVIDER_UNAVAILABLE, httpStatus: 503 });
    expect(mapped.cause).toBe(upstream);
  });

  it('passes existing AppError through without double wrapping', () => {
    const original = new AppError({ code: INTERNAL_ERROR, message: 'inner', httpStatus: 500, expose: false });
    const mapped = mapProviderError({ provider: 'x', operation: 'y' }, original);
    expect(mapped).toBe(original);
    expect(mapped.code).toBe(INTERNAL_ERROR);
  });
});
