/**
 * Unified mobile error model.
 *
 * Every failure that reaches a screen is normalised into one of these classes.
 * Screens must never render raw backend stack traces or internal messages.
 */

export type AppErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'rate_limit'
  | 'server'
  | 'unknown';

export interface AppErrorOptions {
  /** Correlation id returned by the backend (`requestId` / `traceId`). */
  readonly requestId?: string | null;
  /** HTTP status when the failure came from a response. */
  readonly status?: number | null;
  /** Stable backend error code, independent of the human readable message. */
  readonly code?: string | null;
  /** Structured details, e.g. field-level validation failures. */
  readonly details?: unknown;
  readonly cause?: unknown;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly requestId: string | null;
  readonly status: number | null;
  readonly code: string | null;
  readonly details: unknown;
  override readonly cause: unknown;

  constructor(
    kind: AppErrorKind,
    message: string,
    options: AppErrorOptions = {},
  ) {
    super(message);
    this.name = new.target.name;
    this.kind = kind;
    this.requestId = options.requestId ?? null;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.details = options.details ?? null;
    this.cause = options.cause ?? null;
  }

  /** True when retrying the same request could plausibly succeed. */
  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }

  /** True when the session must be treated as expired. */
  get isAuthFailure(): boolean {
    return this.kind === 'unauthorized';
  }
}

/** Device has no connectivity / DNS / TLS / socket failure. */
export class NetworkError extends AppError {
  constructor(message = '网络连接不可用，请检查网络后重试。', options: AppErrorOptions = {}) {
    super('network', message, options);
  }
}

/** Request exceeded its timeout or was aborted by the caller. */
export class TimeoutError extends AppError {
  constructor(message = '请求超时，请稍后重试。', options: AppErrorOptions = {}) {
    super('timeout', message, options);
  }
}

/** 401 — no valid session. */
export class UnauthorizedError extends AppError {
  constructor(message = '登录状态已失效，请重新登录。', options: AppErrorOptions = {}) {
    super('unauthorized', message, options);
  }
}

/** 403 — authenticated but not permitted. */
export class ForbiddenError extends AppError {
  constructor(message = '你没有权限执行此操作。', options: AppErrorOptions = {}) {
    super('forbidden', message, options);
  }
}

/** 404 — resource does not exist or is not visible. */
export class NotFoundError extends AppError {
  constructor(message = '请求的内容不存在。', options: AppErrorOptions = {}) {
    super('not_found', message, options);
  }
}

/** 422 / field-level validation failure. */
export class ValidationError extends AppError {
  constructor(message = '提交的内容有误，请检查后重试。', options: AppErrorOptions = {}) {
    super('validation', message, options);
  }
}

/** 409 — state conflict (duplicate, version mismatch). */
export class ConflictError extends AppError {
  constructor(message = '数据存在冲突，请刷新后重试。', options: AppErrorOptions = {}) {
    super('conflict', message, options);
  }
}

/** 429 — too many requests. */
export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number | null;

  constructor(
    message = '操作过于频繁，请稍后再试。',
    options: AppErrorOptions & { retryAfterSeconds?: number | null } = {},
  ) {
    super('rate_limit', message, options);
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

/** 5xx — backend failure. */
export class ServerError extends AppError {
  constructor(message = '服务暂时不可用，请稍后重试。', options: AppErrorOptions = {}) {
    super('server', message, options);
  }
}

/** Fallback for anything the client cannot classify. */
export class UnknownError extends AppError {
  constructor(message = '发生未知错误，请稍后重试。', options: AppErrorOptions = {}) {
    super('unknown', message, options);
  }
}

/** Configuration failure — surfaced as a blocking config screen, never retried. */
export class ConfigurationError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super('unknown', message, options);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  if (error instanceof Error) {
    return new UnknownError(error.message, { cause: error });
  }
  return new UnknownError('发生未知错误，请稍后重试。', { cause: error });
}

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
  NOT_FOUND: '请求的内容不存在。',
  DEVICE_NOT_FOUND: '未找到指定设备。',
  PHONE_NOT_BOUND: '手机号未绑定。',
  PLATFORM_NOT_FOUND: '未找到平台配置。',
  RUNTIME_CONFIG_UNAVAILABLE: '运行时配置不可用。',
  APP_VERSION_POLICY_UNAVAILABLE: '版本控制策略不可用。',
  OPERATOR_NOT_FOUND: '操作员不存在。',
  ROLE_NOT_FOUND: '角色不存在。',
  AUDIT_LOG_NOT_FOUND: '审计日志不存在。',

  // validation
  VALIDATION_ERROR: '提交的内容有误，请检查后重试。',
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
  RATE_LIMITED: '操作过于频繁，请稍后再试。',
  LOGIN_RATE_LIMITED: '登录尝试过于频繁，账号已被临时锁定，请稍后再试。',
  OTP_RATE_LIMITED: '验证码发送过于频繁，请稍后再试。',

  // server
  INTERNAL_ERROR: '服务暂时不可用，请稍后重试。',
  PROVIDER_UNAVAILABLE: '第三方服务暂时不可用，请稍后重试。',
  IDENTITY_REPOSITORY_FAILURE: '身份存储服务异常，请稍后重试。',
  OPERATOR_AUDIT_PERSISTENCE_FAILED: '审计日志记录失败。',
  AUTHENTICATION_UNAVAILABLE: '认证服务暂时不可用，请稍后重试。',
};

export function getErrorMessageByCode(code?: string | null, fallbackKind?: AppErrorKind): string {
  if (code && code in BUSINESS_ERROR_MESSAGES) {
    return BUSINESS_ERROR_MESSAGES[code]!;
  }
  switch (fallbackKind) {
    case 'network': return '网络连接不可用，请检查网络后重试。';
    case 'timeout': return '请求超时，请稍后重试。';
    case 'unauthorized': return '登录状态已失效，请重新登录。';
    case 'forbidden': return '你没有权限执行此操作。';
    case 'not_found': return '请求的内容不存在。';
    case 'validation': return '提交的内容有误，请检查后重试。';
    case 'conflict': return '数据存在冲突，请刷新后重试。';
    case 'rate_limit': return '操作过于频繁，请稍后再试。';
    case 'server': return '服务暂时不可用，请稍后重试。';
    default: return '发生未知错误，请稍后重试。';
  }
}

export type MobileAppErrorAction =
  | 'logout'
  | 'notify'
  | 'highlight_fields'
  | 'reload'
  | 'countdown'
  | 'report'
  | 'none';

/**
 * Recommended Mobile UI action based on business status code and kind (ADR-023 / US3).
 */
export function getRecommendedAction(error: AppError): MobileAppErrorAction {
  if (error.kind === 'unauthorized') {
    return 'logout';
  }
  if (error.code === 'STALE_VERSION_CONFLICT' || error.kind === 'conflict') {
    return 'reload';
  }
  if (error.kind === 'validation') {
    return 'highlight_fields';
  }
  if (error.kind === 'rate_limit') {
    return 'countdown';
  }
  if (error.kind === 'forbidden') {
    return 'notify';
  }
  if (error.kind === 'server') {
    return 'report';
  }
  return 'none';
}

/**
 * Maps an error to text that is safe to show a user. Backend stack traces and
 * internal diagnostics are explicitly never surfaced.
 */
export function toUserMessage(error: unknown): string {
  const appError = toAppError(error);
  const msg = appError.message || getErrorMessageByCode(appError.code, appError.kind);
  if (appError.requestId) {
    return `${msg}（请求号 ${appError.requestId.slice(0, 8)}）`;
  }
  return msg;
}
