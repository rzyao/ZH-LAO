import type { ApiErrorBody } from '../contracts/error'

/**
 * Frozen ApiError hierarchy. Every request failure in the Admin is normalized
 * to one of these kinds by the API client.
 */
export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'rate_limit'
  | 'server'
  | 'unknown'

export const API_ERROR_KINDS: readonly ApiErrorKind[] = [
  'network',
  'unauthorized',
  'forbidden',
  'not_found',
  'validation',
  'conflict',
  'rate_limit',
  'server',
  'unknown',
]

export const ERROR_MESSAGES: Record<ApiErrorKind, string> = {
  network: '网络连接失败，请检查网络后重试。',
  unauthorized: '登录状态已失效，请重新登录。',
  forbidden: '没有权限执行该操作。',
  not_found: '请求的资源不存在。',
  validation: '提交的数据有误，请检查后重试。',
  conflict: '数据冲突，请刷新后重试。',
  rate_limit: '请求过于频繁，请稍后重试。',
  server: '服务器开小差了，请稍后重试。',
  unknown: '发生未知错误，请稍后重试。',
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: string
  readonly details: unknown
  readonly requestId?: string
  /** Whether an automatic retry may be sensible. */
  readonly retryable: boolean

  constructor(options: {
    kind: ApiErrorKind
    status?: number | null
    code?: string
    message?: string
    details?: unknown
    requestId?: string
    retryable?: boolean
  }) {
    super(options.message ?? ERROR_MESSAGES[options.kind])
    this.name = 'ApiError'
    this.kind = options.kind
    this.status = options.status ?? null
    this.code = options.code ?? options.kind
    this.details = options.details
    this.requestId = options.requestId
    this.retryable = options.retryable ?? isRetryableKind(options.kind)
  }
}

function isRetryableKind(kind: ApiErrorKind): boolean {
  return kind === 'network' || kind === 'rate_limit' || kind === 'server'
}

export class NetworkError extends ApiError {
  constructor(cause?: unknown) {
    super({ kind: 'network', code: 'network_error', retryable: true })
    this.name = 'NetworkError'
    this.cause = cause
  }
}

export class UnauthorizedError extends ApiError {
  constructor(body?: ApiErrorBody) {
    super({
      kind: 'unauthorized',
      status: 401,
      code: body?.code ?? 'unauthorized',
      message: body?.message ?? ERROR_MESSAGES.unauthorized,
      details: body?.details,
      requestId: body?.requestId,
      retryable: false,
    })
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(body?: ApiErrorBody) {
    super({
      kind: 'forbidden',
      status: 403,
      code: body?.code ?? 'forbidden',
      message: body?.message ?? ERROR_MESSAGES.forbidden,
      details: body?.details,
      requestId: body?.requestId,
      retryable: false,
    })
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(body?: ApiErrorBody) {
    super({
      kind: 'not_found',
      status: 404,
      code: body?.code ?? 'not_found',
      message: body?.message ?? ERROR_MESSAGES.not_found,
      details: body?.details,
      requestId: body?.requestId,
      retryable: false,
    })
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ApiError {
  constructor(body?: ApiErrorBody) {
    super({
      kind: 'validation',
      status: 422,
      code: body?.code ?? 'validation_failed',
      message: body?.message ?? ERROR_MESSAGES.validation,
      details: body?.details,
      requestId: body?.requestId,
      retryable: false,
    })
    this.name = 'ValidationError'
  }
}

export class ConflictError extends ApiError {
  constructor(body?: ApiErrorBody) {
    super({
      kind: 'conflict',
      status: 409,
      code: body?.code ?? 'conflict',
      message: body?.message ?? ERROR_MESSAGES.conflict,
      details: body?.details,
      requestId: body?.requestId,
      retryable: false,
    })
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApiError {
  constructor(body?: ApiErrorBody) {
    super({
      kind: 'rate_limit',
      status: 429,
      code: body?.code ?? 'rate_limited',
      message: body?.message ?? ERROR_MESSAGES.rate_limit,
      details: body?.details,
      requestId: body?.requestId,
      retryable: true,
    })
    this.name = 'RateLimitError'
  }
}

export class ServerError extends ApiError {
  constructor(status: number, body?: ApiErrorBody) {
    super({
      kind: 'server',
      status,
      code: body?.code ?? 'server_error',
      message: body?.message ?? ERROR_MESSAGES.server,
      details: body?.details,
      requestId: body?.requestId,
      retryable: true,
    })
    this.name = 'ServerError'
  }
}

export class UnknownError extends ApiError {
  constructor(status: number, body?: ApiErrorBody) {
    super({
      kind: 'unknown',
      status,
      code: body?.code ?? 'unknown_error',
      message: body?.message ?? ERROR_MESSAGES.unknown,
      details: body?.details,
      requestId: body?.requestId,
      retryable: false,
    })
    this.name = 'UnknownError'
  }
}
