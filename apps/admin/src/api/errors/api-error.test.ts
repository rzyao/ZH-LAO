import { describe, expect, it } from 'vitest'
import { mapHttpError, mapNetworkError } from './index'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
  UnauthorizedError,
  UnknownError,
  ValidationError,
} from './api-error'
import { NetworkError } from './api-error'

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('error mapping', () => {
  it('maps every supported status', async () => {
    const cases: Array<[number, new (...args: never[]) => Error]> = [
      [401, UnauthorizedError],
      [403, ForbiddenError],
      [404, NotFoundError],
      [409, ConflictError],
      [422, ValidationError],
      [429, RateLimitError],
      [500, ServerError],
      [502, ServerError],
      [418, UnknownError],
    ]
    for (const [status, Klass] of cases) {
      const error = await mapHttpError(response(status, { code: 'c', message: 'm' }))
      expect(error).toBeInstanceOf(Klass)
    }
  })

  it('keeps the envelope fields', async () => {
    const error = await mapHttpError(
      response(422, { code: 'validation_failed', message: '字段错误', details: { a: 1 }, requestId: 'req-1' }),
    )
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe('validation_failed')
    expect(error.message).toBe('字段错误')
    expect(error.details).toEqual({ a: 1 })
    expect(error.requestId).toBe('req-1')
  })

  it('marks retryable errors', async () => {
    const rate = await mapHttpError(response(429, { code: 'r', message: 'm' }))
    expect(rate.retryable).toBe(true)
    const notFound = await mapHttpError(response(404, { code: 'n', message: 'm' }))
    expect(notFound.retryable).toBe(false)
  })

  it('maps network failures to NetworkError', () => {
    expect(mapNetworkError(new TypeError('Failed to fetch'))).toBeInstanceOf(NetworkError)
  })

  it('correctly branches 6 core business error categories on HTTP 200 and yields recommended actions (ADR-023 / US3 / T026)', async () => {
    const { getRecommendedAction, getErrorMessageByCode } = await import('./api-error')

    // 1. UNAUTHENTICATED -> logout
    const unauthErr = await mapHttpError(
      response(200, {
        code: 'UNAUTHENTICATED',
        error: { message: 'session expired' },
        request_id: 'req-unauth-1',
      }),
    )
    expect(unauthErr).toBeInstanceOf(UnauthorizedError)
    expect(unauthErr.code).toBe('UNAUTHENTICATED')
    expect(unauthErr.requestId).toBe('req-unauth-1')
    expect(getRecommendedAction(unauthErr)).toBe('logout')

    // 2. FORBIDDEN -> notify
    const forbiddenErr = await mapHttpError(
      response(200, {
        code: 'FORBIDDEN',
        error: { message: 'permission denied' },
        request_id: 'req-forbidden-1',
      }),
    )
    expect(forbiddenErr).toBeInstanceOf(ForbiddenError)
    expect(getRecommendedAction(forbiddenErr)).toBe('notify')

    // 3. VALIDATION_ERROR -> highlight_fields
    const validationErr = await mapHttpError(
      response(200, {
        code: 'VALIDATION_ERROR',
        error: {
          message: 'invalid input',
          details: [{ field: 'email', issue: 'invalid' }],
        },
        request_id: 'req-val-1',
      }),
    )
    expect(validationErr).toBeInstanceOf(ValidationError)
    expect(validationErr.details).toEqual([{ field: 'email', issue: 'invalid' }])
    expect(getRecommendedAction(validationErr)).toBe('highlight_fields')

    // 4. STALE_VERSION_CONFLICT -> reload
    const conflictErr = await mapHttpError(
      response(200, {
        code: 'STALE_VERSION_CONFLICT',
        error: { message: 'stale' },
        request_id: 'req-conflict-1',
      }),
    )
    expect(conflictErr).toBeInstanceOf(ConflictError)
    expect(getRecommendedAction(conflictErr)).toBe('reload')

    // 5. RATE_LIMITED -> countdown
    const rateLimitErr = await mapHttpError(
      response(200, {
        code: 'RATE_LIMITED',
        error: {
          message: 'too many requests',
          details: { retry_after_seconds: 60 },
        },
        request_id: 'req-rate-1',
      }),
    )
    expect(rateLimitErr).toBeInstanceOf(RateLimitError)
    expect((rateLimitErr as RateLimitError).retryAfterSeconds).toBe(60)
    expect(getRecommendedAction(rateLimitErr)).toBe('countdown')

    // 6. INTERNAL_ERROR -> report
    const serverErr = await mapHttpError(
      response(200, {
        code: 'INTERNAL_ERROR',
        error: { message: 'server fault' },
        request_id: 'req-srv-1',
      }),
    )
    expect(serverErr).toBeInstanceOf(ServerError)
    expect(getRecommendedAction(serverErr)).toBe('report')

    // Business code error message lookup test (T029)
    expect(getErrorMessageByCode('STALE_VERSION_CONFLICT')).toBe('数据已被其他人修改，请刷新页面后重试。')
    expect(getErrorMessageByCode('LOGIN_RATE_LIMITED')).toBe('登录尝试过于频繁，账号已被临时锁定，请稍后再试。')
  })
})
