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
})
