import type { FastifyInstance } from 'fastify';
import { AppError } from './app-error.js';
import { normalizePostgresError } from '../database/postgres-errors.js';

export function installErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler(async () => {
    throw new AppError({ code: 'NOT_FOUND', message: 'Route not found', httpStatus: 404 });
  });
  app.setErrorHandler((rawError, request, reply) => {
    const normalized = normalizePostgresError(rawError);
    const error = normalized instanceof AppError
      ? normalized
      : typeof rawError === 'object' && rawError !== null && 'validation' in rawError
        ? new AppError({ code: 'INVALID_REQUEST', message: 'Request validation failed', httpStatus: 400, cause: rawError })
        : new AppError({ code: 'INTERNAL_ERROR', message: 'Internal server error', httpStatus: 500, expose: false, cause: rawError });
    request.log[error.httpStatus >= 500 ? 'error' : 'warn']({ err: rawError, code: error.code, requestId: request.id }, 'Request failed');
    return reply.status(error.httpStatus).send({
      error: { code: error.code, message: error.expose ? error.message : 'Internal server error', request_id: request.id }
    });
  });
}
