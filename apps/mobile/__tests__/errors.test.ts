import {
  ConflictError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
  UnauthorizedError,
  UnknownError,
  ValidationError,
  getErrorMessageByCode,
  getRecommendedAction,
  toAppError,
  toUserMessage,
} from '../src/api/errors/errors';
import {
  extractRequestId,
  extractServerMessage,
  mapHttpFailure,
  normalizeHttpError,
} from '../src/api/errors/mapHttpError';

describe('Error foundation', () => {
  it('maps HTTP statuses onto the unified error model', () => {
    const cases: [number, new () => InstanceType<typeof Error>][] = [
      [401, UnauthorizedError],
      [403, ForbiddenError],
      [404, NotFoundError],
      [400, ValidationError],
      [422, ValidationError],
      [409, ConflictError],
      [429, RateLimitError],
      [500, ServerError],
      [503, ServerError],
    ];
    for (const [status, Expected] of cases) {
      const error = mapHttpFailure({ status, code: null, headers: null, body: null, requestId: null, kind: null });
      expect(error).toBeInstanceOf(Expected);
      expect(error.status).toBe(status);
    }
  });

  it('maps missing response to network/timeout', () => {
    const network = mapHttpFailure({ status: null, code: 'EAI_AGAIN', headers: null, body: null, requestId: null, kind: 'network' });
    expect(network).toBeInstanceOf(NetworkError);
    const timeout = mapHttpFailure({ status: null, code: 'ECONNABORTED', headers: null, body: null, requestId: null, kind: 'timeout' });
    expect(timeout).toBeInstanceOf(TimeoutError);
  });

  it('extracts requestId from headers and body', () => {
    expect(extractRequestId({ 'x-request-id': 'abc-1' }, null)).toBe('abc-1');
    expect(extractRequestId({ 'X-Correlation-Id': 'corr' }, null)).toBe('corr');
    expect(extractRequestId(null, { requestId: 'body-id' })).toBe('body-id');
    expect(extractRequestId(null, { error: { traceId: 'trace-9' } })).toBe('trace-9');
    expect(extractRequestId(null, null)).toBeNull();
  });

  it('reads request_id strictly from unified envelope top level, prioritizing over headers (US4 / T032)', () => {
    expect(
      extractRequestId(
        { 'x-request-id': 'req-transport-header' },
        { code: 'VALIDATION_ERROR', error: { message: 'invalid' }, request_id: 'req-envelope-top-level' },
      ),
    ).toBe('req-envelope-top-level');

    expect(
      extractServerMessage({
        code: 'VALIDATION_ERROR',
        error: { message: '信封中的错误描述' },
        request_id: 'req-envelope-top-level',
      }),
    ).toBe('信封中的错误描述');
  });

  it('extracts a safe server message without internals', () => {
    expect(extractServerMessage({ message: 'hi' })).toBe('hi');
    expect(extractServerMessage({ error: { message: 'nested' } })).toBe('nested');
    expect(extractServerMessage({ stack: 'secret' })).toBeNull();
    expect(extractServerMessage('text')).toBeNull();
  });

  it('parses Retry-After for rate limiting', () => {
    const error = mapHttpFailure({
      status: 429,
      code: null,
      headers: { 'retry-after': '30' },
      body: null,
      requestId: null,
      kind: null,
    });
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfterSeconds).toBe(30);
  });

  it('normalises axios-style thrown errors', () => {
    const unauthorized = normalizeHttpError(
      { response: { status: 401, data: { message: 'expired' }, headers: {} } },
      'req-1',
    );
    expect(unauthorized).toBeInstanceOf(UnauthorizedError);
    expect(unauthorized.requestId).toBe('req-1');

    const abort = normalizeHttpError({ name: 'CanceledError', code: 'ERR_CANCELED' }, null);
    expect(abort).toBeInstanceOf(TimeoutError);

    const timeout = normalizeHttpError({ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' }, null);
    expect(timeout).toBeInstanceOf(TimeoutError);

    const offline = normalizeHttpError(new Error('getaddrinfo failed'), null);
    expect(offline).toBeInstanceOf(NetworkError);
  });

  it('flags retryable and auth failures', () => {
    expect(new NetworkError().isRetryable).toBe(true);
    expect(new ServerError().isRetryable).toBe(true);
    expect(new ValidationError().isRetryable).toBe(false);
    expect(new UnauthorizedError().isAuthFailure).toBe(true);
    expect(new ForbiddenError().isAuthFailure).toBe(false);
  });

  it('maps HTTP 200 business error envelope to the corresponding AppError subclass by code', () => {
    const cases: [string, new (...args: any[]) => Error][] = [
      ['UNAUTHENTICATED', UnauthorizedError],
      ['INVALID_CREDENTIAL', UnauthorizedError],
      ['SESSION_EXPIRED', UnauthorizedError],
      ['FORBIDDEN', ForbiddenError],
      ['ACCOUNT_DISABLED', ForbiddenError],
      ['OPERATOR_DISABLED', ForbiddenError],
      ['NOT_FOUND', NotFoundError],
      ['VALIDATION_ERROR', ValidationError],
      ['INVALID_ARGUMENT', ValidationError],
      ['CONFLICT', ConflictError],
      ['STALE_VERSION_CONFLICT', ConflictError],
      ['RATE_LIMITED', RateLimitError],
      ['INTERNAL_ERROR', ServerError],
      ['UNKNOWN_CODE_XYZ', UnknownError],
    ];

    for (const [code, Expected] of cases) {
      const error = normalizeHttpError(
        {
          response: {
            status: 200,
            data: {
              code,
              error: { message: `failed with ${code}` },
              request_id: 'req-biz-123',
            },
            headers: {},
          },
        },
        'req-fallback',
      );
      expect(error).toBeInstanceOf(Expected);
      expect(error.requestId).toBe('req-biz-123');
      expect(error.code).toBe(code);
      expect(error.message).toBe(`failed with ${code}`);
    }
  });

  it('converts unknown values and never leaks raw internals to users', () => {
    expect(toAppError(new Error('boom'))).toBeInstanceOf(UnknownError);
    expect(toAppError('weird')).toBeInstanceOf(UnknownError);
    expect(toUserMessage(new UnknownError('ops'))).toBe('ops');
    expect(toUserMessage(new UnknownError('ops', { requestId: 'aabbccddeeff' }))).toContain('aabbccd');
  });

  it('correctly branches 6 core business error categories on HTTP 200 and yields recommended actions (ADR-023 / US3 / T027)', () => {
    // 1. UNAUTHENTICATED -> logout
    const unauthErr = normalizeHttpError(
      {
        response: {
          status: 200,
          data: {
            code: 'UNAUTHENTICATED',
            error: { message: 'session expired' },
            request_id: 'req-unauth-mobile',
          },
          headers: {},
        },
      },
      'fallback-req',
    );
    expect(unauthErr).toBeInstanceOf(UnauthorizedError);
    expect(unauthErr.code).toBe('UNAUTHENTICATED');
    expect(unauthErr.requestId).toBe('req-unauth-mobile');
    expect(getRecommendedAction(unauthErr)).toBe('logout');

    // 2. FORBIDDEN -> notify
    const forbiddenErr = normalizeHttpError(
      {
        response: {
          status: 200,
          data: {
            code: 'FORBIDDEN',
            error: { message: 'permission denied' },
            request_id: 'req-forbidden-mobile',
          },
          headers: {},
        },
      },
      'fallback-req',
    );
    expect(forbiddenErr).toBeInstanceOf(ForbiddenError);
    expect(getRecommendedAction(forbiddenErr)).toBe('notify');

    // 3. VALIDATION_ERROR -> highlight_fields
    const validationErr = normalizeHttpError(
      {
        response: {
          status: 200,
          data: {
            code: 'VALIDATION_ERROR',
            error: {
              message: 'bad input',
              details: [{ field: 'phone', issue: 'invalid' }],
            },
            request_id: 'req-val-mobile',
          },
          headers: {},
        },
      },
      'fallback-req',
    );
    expect(validationErr).toBeInstanceOf(ValidationError);
    expect(validationErr.details).toEqual({
      code: 'VALIDATION_ERROR',
      error: {
        message: 'bad input',
        details: [{ field: 'phone', issue: 'invalid' }],
      },
      request_id: 'req-val-mobile',
    });
    expect(getRecommendedAction(validationErr)).toBe('highlight_fields');

    // 4. STALE_VERSION_CONFLICT -> reload
    const conflictErr = normalizeHttpError(
      {
        response: {
          status: 200,
          data: {
            code: 'STALE_VERSION_CONFLICT',
            error: { message: 'stale' },
            request_id: 'req-conflict-mobile',
          },
          headers: {},
        },
      },
      'fallback-req',
    );
    expect(conflictErr).toBeInstanceOf(ConflictError);
    expect(getRecommendedAction(conflictErr)).toBe('reload');

    // 5. RATE_LIMITED -> countdown
    const rateLimitErr = normalizeHttpError(
      {
        response: {
          status: 200,
          data: {
            code: 'RATE_LIMITED',
            error: {
              message: 'too fast',
              details: { retry_after_seconds: 45 },
            },
            request_id: 'req-rate-mobile',
          },
          headers: { 'retry-after': '45' },
        },
      },
      'fallback-req',
    );
    expect(rateLimitErr).toBeInstanceOf(RateLimitError);
    expect((rateLimitErr as RateLimitError).retryAfterSeconds).toBe(45);
    expect(getRecommendedAction(rateLimitErr)).toBe('countdown');

    // 6. INTERNAL_ERROR -> report
    const serverErr = normalizeHttpError(
      {
        response: {
          status: 200,
          data: {
            code: 'INTERNAL_ERROR',
            error: { message: 'internal fault' },
            request_id: 'req-srv-mobile',
          },
          headers: {},
        },
      },
      'fallback-req',
    );
    expect(serverErr).toBeInstanceOf(ServerError);
    expect(getRecommendedAction(serverErr)).toBe('report');

    // Business code error message lookup test (T030)
    expect(getErrorMessageByCode('STALE_VERSION_CONFLICT')).toBe('数据已被其他人修改，请刷新页面后重试。');
    expect(getErrorMessageByCode('OTP_RATE_LIMITED')).toBe('验证码发送过于频繁，请稍后再试。');
  });
});
