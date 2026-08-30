import { ApiError } from '../errors/api-error'

/**
 * A request that exceeded the configured timeout. A specialization of
 * NetworkError so callers can rely on `kind === 'network'`.
 */
export class TimeoutError extends ApiError {
  constructor(timeoutMs: number) {
    super({
      kind: 'network',
      code: 'timeout',
      message: `请求超时（${timeoutMs}ms），请稍后重试。`,
      retryable: true,
    })
    this.name = 'TimeoutError'
  }
}
