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

  it('converts unknown values and never leaks raw internals to users', () => {
    expect(toAppError(new Error('boom'))).toBeInstanceOf(UnknownError);
    expect(toAppError('weird')).toBeInstanceOf(UnknownError);
    expect(toUserMessage(new UnknownError('ops'))).toBe('ops');
    expect(toUserMessage(new UnknownError('ops', { requestId: 'aabbccddeeff' }))).toContain('aabbccd');
  });
});
