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

export const BUSINESS_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  // unauthorized
  UNAUTHENTICATED: '登录状态已失效，请重新登录。',
  INVALID_CREDENTIAL: '手机号或验证码错误，请重新输入。',
  SESSION_EXPIRED: '登录已过期，请重新登录。',
  SESSION_REVOKED: '登录已被注销，请重新登录。',
  TOKEN_EXPIRED: '凭证已过期，请重新登录。',
  OPERATOR_ACCESS_DENIED: '当前操作员未被授权访问该系统。',

  // forbidden
  FORBIDDEN: '没有权限执行该操作。',
  ACCOUNT_DISABLED: '账号已被禁用，请联系管理员。',
  ACCOUNT_CLOSED: '账号已注销。',
  OPERATOR_DISABLED: '操作员账号已停用。',
  SYSTEM_ROLE_PROTECTED: '系统内置角色受保护，禁止修改或删除。',
  ROLE_DISABLED: '角色已停用，无法分配或使用。',

  // not_found
  NOT_FOUND: '请求的资源不存在。',
  DEVICE_NOT_FOUND: '未找到指定设备。',
  PHONE_NOT_BOUND: '手机号未绑定。',
  PLATFORM_NOT_FOUND: '未找到平台配置。',
  RUNTIME_CONFIG_UNAVAILABLE: '运行时配置不可用。',
  APP_VERSION_POLICY_UNAVAILABLE: '版本控制策略不可用。',
  OPERATOR_NOT_FOUND: '操作员不存在。',
  ROLE_NOT_FOUND: '角色不存在。',
  AUDIT_LOG_NOT_FOUND: '审计日志不存在。',

  // validation
  VALIDATION_ERROR: '提交的数据有误，请检查后重试。',
  INVALID_ARGUMENT: '请求参数无效，请检查输入。',
  INVALID_DATA: '数据格式不正确。',
  INVALID_REQUEST: '请求格式不合规。',
  INVALID_PHONE: '手机号格式不正确。',
  IDENTITY_EMPTY_PROFILE_UPDATE: '更新内容不能为空。',
  OTP_EXPIRED: '验证码已过期，请重新获取。',
  OTP_LOCKED: '验证码尝试次数过多，请稍后再试。',
  OTP_INVALID: '验证码错误，请重新输入。',
  OTP_SECRET_INVALID: '验证密钥无效。',
  PLATFORM_INVALID_ARGUMENT: '平台参数无效。',
  FEATURE_FLAG_INVALID_SCOPE: '特性开关作用域无效。',
  RUNTIME_CONFIG_INVALID_VALUE: '配置值格式不正确。',
  RUNTIME_CONFIG_KEY_UNREGISTERED: '配置键未注册。',
  REGION_INVALID: '地区参数无效。',
  INVALID_PERMISSION: '权限标识不合法。',
  ILLEGAL_STATE_TRANSITION: '当前状态不允许执行该流转操作。',

  // conflict
  CONFLICT: '数据存在冲突，请刷新后重试。',
  STALE_VERSION_CONFLICT: '数据已被其他人修改，请刷新页面后重试。',
  DEVICE_OWNERSHIP_CONFLICT: '设备已被其他账号绑定。',
  PHONE_ALREADY_BOUND: '该手机号已被绑定。',
  IDENTITY_CONFLICT: '身份信息冲突。',
  IDENTITY_REFERENTIAL_CONFLICT: '存在依赖该身份的关联数据，无法操作。',
  LEARNING_DIRECTION_IMMUTABLE: '学习方向不可修改。',
  OTP_ALREADY_USED: '验证码已使用，请重新获取。',
  BOOTSTRAP_ALREADY_COMPLETED: '系统初始化已完成，禁止重复初始化。',
  PLATFORM_CONFLICT: '平台数据冲突。',
  FEATURE_FLAG_RETIRED: '特性开关已下线。',
  RUNTIME_CONFIG_RETIRED: '运行时配置已废弃。',
  APP_VERSION_MISMATCH: '应用版本不匹配。',
  APP_VERSION_INVALID_TRANSITION: '应用版本状态流转不合法。',
  ANNOUNCEMENT_INVALID_TRANSITION: '公告状态流转不合法。',
  REGION_RETIRED: '该地区已停用。',
  OPERATOR_ALREADY_EXISTS: '该操作员账号已存在。',
  OPERATOR_AUTH_SUBJECT_NOT_FOUND: '未找到关联的认证主体。',
  OPERATOR_AUTH_SUBJECT_INACTIVE: '关联的认证主体未激活。',
  ROLE_CODE_CONFLICT: '角色代码已存在，请使用其他代码。',
  LAST_SUPER_ADMIN_REQUIRED: '必须保留至少一个超级管理员，无法移除或禁用。',
  UNICODE_CONFLICT: '统一编码冲突。',
  ACTIVE_WORK_CONFLICT: '存在正在处理中的业务任务，无法执行该操作。',

  // rate_limit
  RATE_LIMITED: '请求过于频繁，请稍后再试。',
  LOGIN_RATE_LIMITED: '登录尝试过于频繁，账号已被临时锁定，请稍后再试。',
  OTP_RATE_LIMITED: '验证码发送过于频繁，请稍后再试。',

  // server
  INTERNAL_ERROR: '服务器开小差了，请稍后重试。',
  PROVIDER_UNAVAILABLE: '第三方服务暂时不可用，请稍后重试。',
  IDENTITY_REPOSITORY_FAILURE: '身份存储服务异常，请稍后重试。',
  OPERATOR_AUDIT_PERSISTENCE_FAILED: '审计日志记录失败。',
  AUTHENTICATION_UNAVAILABLE: '认证服务暂时不可用，请稍后重试。',
}

export function getErrorMessageByCode(code?: string, fallbackKind?: ApiErrorKind): string {
  if (code && code in BUSINESS_ERROR_MESSAGES) {
    return BUSINESS_ERROR_MESSAGES[code]!
  }
  if (fallbackKind && fallbackKind in ERROR_MESSAGES) {
    return ERROR_MESSAGES[fallbackKind]
  }
  return ERROR_MESSAGES.unknown
}

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

/**
 * Business status code to ApiErrorKind dictionary (ADR-023).
 * When responses arrive via HTTP 200, the top-level `code` determines the error kind.
 */
export const BUSINESS_CODE_TO_KIND: Readonly<Record<string, ApiErrorKind>> = {
  // unauthorized
  UNAUTHENTICATED: 'unauthorized',
  INVALID_CREDENTIAL: 'unauthorized',
  SESSION_EXPIRED: 'unauthorized',
  SESSION_REVOKED: 'unauthorized',
  TOKEN_EXPIRED: 'unauthorized',
  OPERATOR_ACCESS_DENIED: 'unauthorized',
  unauthorized: 'unauthorized',

  // forbidden
  FORBIDDEN: 'forbidden',
  ACCOUNT_DISABLED: 'forbidden',
  ACCOUNT_CLOSED: 'forbidden',
  OPERATOR_DISABLED: 'forbidden',
  SYSTEM_ROLE_PROTECTED: 'forbidden',
  ROLE_DISABLED: 'forbidden',
  forbidden: 'forbidden',

  // not_found
  NOT_FOUND: 'not_found',
  DEVICE_NOT_FOUND: 'not_found',
  PHONE_NOT_BOUND: 'not_found',
  PLATFORM_NOT_FOUND: 'not_found',
  RUNTIME_CONFIG_UNAVAILABLE: 'not_found',
  APP_VERSION_POLICY_UNAVAILABLE: 'not_found',
  OPERATOR_NOT_FOUND: 'not_found',
  ROLE_NOT_FOUND: 'not_found',
  AUDIT_LOG_NOT_FOUND: 'not_found',
  not_found: 'not_found',

  // validation
  VALIDATION_ERROR: 'validation',
  INVALID_ARGUMENT: 'validation',
  INVALID_DATA: 'validation',
  INVALID_REQUEST: 'validation',
  INVALID_PHONE: 'validation',
  IDENTITY_EMPTY_PROFILE_UPDATE: 'validation',
  OTP_EXPIRED: 'validation',
  OTP_LOCKED: 'validation',
  OTP_INVALID: 'validation',
  OTP_SECRET_INVALID: 'validation',
  PLATFORM_INVALID_ARGUMENT: 'validation',
  FEATURE_FLAG_INVALID_SCOPE: 'validation',
  RUNTIME_CONFIG_INVALID_VALUE: 'validation',
  RUNTIME_CONFIG_KEY_UNREGISTERED: 'validation',
  REGION_INVALID: 'validation',
  INVALID_PERMISSION: 'validation',
  ILLEGAL_STATE_TRANSITION: 'validation',
  validation: 'validation',
  validation_failed: 'validation',

  // conflict
  CONFLICT: 'conflict',
  STALE_VERSION_CONFLICT: 'conflict',
  DEVICE_OWNERSHIP_CONFLICT: 'conflict',
  PHONE_ALREADY_BOUND: 'conflict',
  IDENTITY_CONFLICT: 'conflict',
  IDENTITY_REFERENTIAL_CONFLICT: 'conflict',
  LEARNING_DIRECTION_IMMUTABLE: 'conflict',
  OTP_ALREADY_USED: 'conflict',
  BOOTSTRAP_ALREADY_COMPLETED: 'conflict',
  PLATFORM_CONFLICT: 'conflict',
  FEATURE_FLAG_RETIRED: 'conflict',
  RUNTIME_CONFIG_RETIRED: 'conflict',
  APP_VERSION_MISMATCH: 'conflict',
  APP_VERSION_INVALID_TRANSITION: 'conflict',
  ANNOUNCEMENT_INVALID_TRANSITION: 'conflict',
  REGION_RETIRED: 'conflict',
  OPERATOR_ALREADY_EXISTS: 'conflict',
  OPERATOR_AUTH_SUBJECT_NOT_FOUND: 'conflict',
  OPERATOR_AUTH_SUBJECT_INACTIVE: 'conflict',
  ROLE_CODE_CONFLICT: 'conflict',
  LAST_SUPER_ADMIN_REQUIRED: 'conflict',
  UNICODE_CONFLICT: 'conflict',
  ACTIVE_WORK_CONFLICT: 'conflict',
  conflict: 'conflict',

  // rate_limit
  RATE_LIMITED: 'rate_limit',
  LOGIN_RATE_LIMITED: 'rate_limit',
  OTP_RATE_LIMITED: 'rate_limit',
  rate_limit: 'rate_limit',
  rate_limited: 'rate_limit',

  // server
  INTERNAL_ERROR: 'server',
  PROVIDER_UNAVAILABLE: 'server',
  IDENTITY_REPOSITORY_FAILURE: 'server',
  OPERATOR_AUDIT_PERSISTENCE_FAILED: 'server',
  AUTHENTICATION_UNAVAILABLE: 'server',
  server: 'server',
  server_error: 'server',
}

function resolveRequestId(body?: ApiErrorBody): string | undefined {
  return body?.request_id ?? body?.requestId
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
  constructor(body?: ApiErrorBody, status: number = 401) {
    super({
      kind: 'unauthorized',
      status,
      code: body?.code ?? 'unauthorized',
      message: body?.message || getErrorMessageByCode(body?.code, 'unauthorized'),
      details: body?.details,
      requestId: resolveRequestId(body),
      retryable: false,
    })
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(body?: ApiErrorBody, status: number = 403) {
    super({
      kind: 'forbidden',
      status,
      code: body?.code ?? 'forbidden',
      message: body?.message || getErrorMessageByCode(body?.code, 'forbidden'),
      details: body?.details,
      requestId: resolveRequestId(body),
      retryable: false,
    })
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(body?: ApiErrorBody, status: number = 404) {
    super({
      kind: 'not_found',
      status,
      code: body?.code ?? 'not_found',
      message: body?.message || getErrorMessageByCode(body?.code, 'not_found'),
      details: body?.details,
      requestId: resolveRequestId(body),
      retryable: false,
    })
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ApiError {
  constructor(body?: ApiErrorBody, status: number = 422) {
    super({
      kind: 'validation',
      status,
      code: body?.code ?? 'validation_failed',
      message: body?.message || getErrorMessageByCode(body?.code, 'validation'),
      details: body?.details,
      requestId: resolveRequestId(body),
      retryable: false,
    })
    this.name = 'ValidationError'
  }
}

export class ConflictError extends ApiError {
  constructor(body?: ApiErrorBody, status: number = 409) {
    super({
      kind: 'conflict',
      status,
      code: body?.code ?? 'conflict',
      message: body?.message || getErrorMessageByCode(body?.code, 'conflict'),
      details: body?.details,
      requestId: resolveRequestId(body),
      retryable: false,
    })
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApiError {
  readonly retryAfterSeconds?: number

  constructor(body?: ApiErrorBody, status: number = 429) {
    let retryAfterSeconds: number | undefined
    if (body?.details && typeof body.details === 'object') {
      const details = body.details as Record<string, unknown>
      if (typeof details.retry_after_seconds === 'number') {
        retryAfterSeconds = details.retry_after_seconds
      } else if (typeof details.retryAfterSeconds === 'number') {
        retryAfterSeconds = details.retryAfterSeconds
      }
    }

    super({
      kind: 'rate_limit',
      status,
      code: body?.code ?? 'rate_limited',
      message: body?.message || getErrorMessageByCode(body?.code, 'rate_limit'),
      details: body?.details,
      requestId: resolveRequestId(body),
      retryable: true,
    })
    this.name = 'RateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class ServerError extends ApiError {
  constructor(status: number = 500, body?: ApiErrorBody) {
    super({
      kind: 'server',
      status,
      code: body?.code ?? 'server_error',
      message: body?.message || getErrorMessageByCode(body?.code, 'server'),
      details: body?.details,
      requestId: resolveRequestId(body),
      retryable: true,
    })
    this.name = 'ServerError'
  }
}

export class UnknownError extends ApiError {
  constructor(status: number = 500, body?: ApiErrorBody) {
    super({
      kind: 'unknown',
      status,
      code: body?.code ?? 'unknown_error',
      message: body?.message || getErrorMessageByCode(body?.code, 'unknown'),
      details: body?.details,
      requestId: resolveRequestId(body),
      retryable: false,
    })
    this.name = 'UnknownError'
  }
}

export type ApiErrorAction =
  | 'logout'
  | 'notify'
  | 'highlight_fields'
  | 'reload'
  | 'countdown'
  | 'report'
  | 'none'

/**
 * Recommended frontend UI action based on business status code and kind (ADR-023 / US3).
 */
export function getRecommendedAction(error: ApiError): ApiErrorAction {
  if (error.kind === 'unauthorized') {
    return 'logout'
  }
  if (error.code === 'STALE_VERSION_CONFLICT' || error.kind === 'conflict') {
    return 'reload'
  }
  if (error.kind === 'validation') {
    return 'highlight_fields'
  }
  if (error.kind === 'rate_limit') {
    return 'countdown'
  }
  if (error.kind === 'forbidden') {
    return 'notify'
  }
  if (error.kind === 'server') {
    return 'report'
  }
  return 'none'
}
