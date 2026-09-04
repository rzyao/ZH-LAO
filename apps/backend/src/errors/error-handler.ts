import type { FastifyInstance } from 'fastify';
import { AppError } from './app-error.js';
import { normalizePostgresError } from '../database/postgres-errors.js';
import { INTERNAL_ERROR, INVALID_REQUEST, NOT_FOUND } from './business-codes.js';

/**
 * 统一错误信封（ADR-023）：`{ code, error: { message, details? }, request_id }`，
 * HTTP 一律 200。`request_id` 顶层携带（含认证前失败，取自 Fastify 请求入口 id）。
 */
export function installErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler(async () => {
    throw new AppError({ code: NOT_FOUND, message: 'Route not found', httpStatus: 404 });
  });
  app.setErrorHandler((rawError, request, reply) => {
    const normalized = normalizePostgresError(rawError);
    const error = normalized instanceof AppError
      ? normalized
      : typeof rawError === 'object' && rawError !== null && 'validation' in rawError
        ? new AppError({ code: INVALID_REQUEST, message: 'Request validation failed', httpStatus: 400, cause: rawError })
        : new AppError({ code: INTERNAL_ERROR, message: 'Internal server error', httpStatus: 500, expose: false, cause: rawError });
    request.log[error.httpStatus >= 500 ? 'error' : 'warn']({ err: rawError, code: error.code, requestId: request.id }, 'Request failed');
    // ADR-023：HTTP 一律 200；业务成败由 code 权威表达。httpStatus 仅日志/监控参考。
    return reply.code(200).send({
      code: error.code,
      error: {
        message: error.expose ? error.message : 'Internal server error',
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
      request_id: request.id,
      // Never include the query string: it can contain credentials or other sensitive input.
      request_path: new URL(request.raw.url ?? request.url, 'http://localhost').pathname,
    });
  });
}
