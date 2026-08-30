export type AppErrorOptions = {
  code: string;
  message: string;
  httpStatus: number;
  expose?: boolean;
  details?: unknown;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly expose: boolean;
  readonly details?: unknown;
  override readonly cause?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.expose = options.expose ?? options.httpStatus < 500;
    if (options.details !== undefined) this.details = options.details;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}
