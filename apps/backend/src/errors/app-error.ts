import type { BusinessStatusCode } from './business-codes.js';

export type AppErrorOptions = {
  code: BusinessStatusCode;
  message: string;
  /** 参考语义：仅日志/监控/兼容说明用，不决定响应状态码（ADR-023：HTTP 一律 200）。 */
  httpStatus?: number;
  expose?: boolean;
  details?: unknown;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: BusinessStatusCode;
  readonly httpStatus: number;
  readonly expose: boolean;
  readonly details?: unknown;
  override readonly cause?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    // httpStatus 保留为参考语义；默认 500（保守），由调用方显式传入业务语义。
    this.httpStatus = options.httpStatus ?? 500;
    this.expose = options.expose ?? this.httpStatus < 500;
    if (options.details !== undefined) this.details = options.details;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}
