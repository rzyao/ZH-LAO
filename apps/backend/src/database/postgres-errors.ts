import { AppError } from '../errors/app-error.js';
import { CONFLICT, INVALID_DATA } from '../errors/business-codes.js';

type PgLikeError = Error & { code?: string; constraint?: string };

export function normalizePostgresError(error: unknown): AppError | unknown {
  if (!(error instanceof Error)) return error;
  const pgError = error as PgLikeError;
  if (pgError.code === '23505') return new AppError({ code: CONFLICT, message: 'The resource already exists', httpStatus: 409, cause: error });
  if (pgError.code?.startsWith('23')) return new AppError({ code: INVALID_DATA, message: 'The request violates a data constraint', httpStatus: 400, cause: error });
  return error;
}
