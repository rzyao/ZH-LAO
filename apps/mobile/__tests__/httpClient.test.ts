import { httpClient, __setHttpTransportForTests, setUnauthorizedListener } from '../src/api/client/httpClient';
import {
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
  ServerError,
} from '../src/api/errors/errors';

describe('Mobile httpClient unified envelope handling (ADR-023 / US1)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_URL;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_API_URL = originalEnv;
    __setHttpTransportForTests(null);
  });

  it('unwraps data from successful { code: "OK", data, request_id } envelope', async () => {
    const mockAxios = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        headers: { 'x-request-id': 'req-transport-1' },
        data: {
          code: 'OK',
          data: { greeting: 'hello' },
          request_id: 'req-envelope-1',
        },
      }),
    } as unknown as Parameters<typeof __setHttpTransportForTests>[0];

    __setHttpTransportForTests(mockAxios);

    const res = await httpClient.get<{ greeting: string }>('/test');
    expect(res.data).toEqual({ greeting: 'hello' });
    expect(res.requestId).toBe('req-envelope-1');
    expect(res.status).toBe(200);
  });

  it('handles empty success envelope { code: "OK", data: null, request_id } without error', async () => {
    const mockAxios = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          code: 'OK',
          data: null,
          request_id: 'req-empty-1',
        },
      }),
    } as unknown as Parameters<typeof __setHttpTransportForTests>[0];

    __setHttpTransportForTests(mockAxios);

    const res = await httpClient.delete('/item/1');
    expect(res.data).toBeNull();
    expect(res.requestId).toBe('req-empty-1');
  });

  it('rejects HTTP 200 business error envelopes by code', async () => {
    const cases = [
      { code: 'UNAUTHENTICATED', Expected: UnauthorizedError },
      { code: 'FORBIDDEN', Expected: ForbiddenError },
      { code: 'NOT_FOUND', Expected: NotFoundError },
      { code: 'VALIDATION_ERROR', Expected: ValidationError },
      { code: 'CONFLICT', Expected: ConflictError },
      { code: 'RATE_LIMITED', Expected: RateLimitError },
      { code: 'INTERNAL_ERROR', Expected: ServerError },
    ];

    for (const item of cases) {
      const mockAxios = {
        request: jest.fn().mockResolvedValue({
          status: 200,
          headers: {},
          data: {
            code: item.code,
            error: { message: `failed with ${item.code}` },
            request_id: `req-${item.code}`,
          },
        }),
      } as unknown as Parameters<typeof __setHttpTransportForTests>[0];

      __setHttpTransportForTests(mockAxios);

      await expect(httpClient.get('/test')).rejects.toBeInstanceOf(item.Expected);
    }
  });

  it('notifies unauthorizedListener when business code is UNAUTHENTICATED on HTTP 200', async () => {
    const listener = jest.fn();
    setUnauthorizedListener(listener);

    const mockAxios = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        headers: {},
        data: {
          code: 'UNAUTHENTICATED',
          error: { message: 'session invalid' },
          request_id: 'req-auth-fail',
        },
      }),
    } as unknown as Parameters<typeof __setHttpTransportForTests>[0];

    __setHttpTransportForTests(mockAxios);

    await expect(httpClient.get('/profile')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(listener).toHaveBeenCalledTimes(1);

    setUnauthorizedListener(null);
  });

  it('sends X-Request-Id header on all requests (US4 / T033)', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const mockAxios = {
      request: jest.fn().mockImplementation((config) => {
        capturedHeaders = config.headers;
        return Promise.resolve({
          status: 200,
          headers: {},
          data: { code: 'OK', data: { ok: true }, request_id: 'req-header-test' },
        });
      }),
    } as unknown as Parameters<typeof __setHttpTransportForTests>[0];

    __setHttpTransportForTests(mockAxios);

    await httpClient.get('/header-check');
    expect(capturedHeaders).toBeDefined();
    expect(capturedHeaders!['X-Request-Id']).toBeDefined();
    expect(typeof capturedHeaders!['X-Request-Id']).toBe('string');
    expect(capturedHeaders!['X-Request-Id'].length).toBeGreaterThan(0);
  });
});
