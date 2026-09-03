/**
 * Capability 层统一错误出口（WP-04 / ADR-023 兼容）。
 *
 * 原则：不重新设计 API Error Contract。所有跨出 Capability 层、可能到达业务域
 * 或 HTTP 层的错误都必须是 AppError（业务状态码词汇表内取值），由既有
 * error-handler / response-envelope 统一序列化。Provider Adapter 内部产生的
 * 传输级错误（见 external-provider.ts）在边界处用本模块翻译为 AppError。
 */
import { AppError } from '../errors/app-error.js';
import { PROVIDER_UNAVAILABLE } from '../errors/business-codes.js';

export type ProviderContext = Readonly<{
  provider: string;
  operation: string;
}>;

export type ProviderUnavailableOptions = Readonly<{
  message?: string;
  cause?: unknown;
  /** 供日志/监控判断是否值得重试；缺省不输出。 */
  retryable?: boolean;
}>;

/** Provider 未接线 / 不可达 / 失败安全时的统一 AppError（PROVIDER_UNAVAILABLE）。 */
export function providerUnavailable(context: ProviderContext, options: ProviderUnavailableOptions = {}): AppError {
  return new AppError({
    code: PROVIDER_UNAVAILABLE,
    message: options.message ?? `Provider '${context.provider}' is unavailable for ${context.operation}`,
    httpStatus: 503,
    expose: true,
    details: {
      provider: context.provider,
      operation: context.operation,
      ...(options.retryable !== undefined ? { retryable: options.retryable } : {}),
    },
    ...(options.cause !== undefined ? { cause: options.cause } : {}),
  });
}

/**
 * 边界翻译：把 Adapter 抛出的任意底层错误包装为 AppError。
 * 已是 AppError 的错误原样透传（避免二次包装/掩盖业务码）。
 */
export function mapProviderError(context: ProviderContext, error: unknown): AppError {
  if (error instanceof AppError) return error;
  return providerUnavailable(context, { cause: error });
}
