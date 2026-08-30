import pg from 'pg';
import type { Logger } from 'pino';
import type { AppConfig } from '../config/env.js';
import type { DatabaseExecutor } from './executor.js';

const { Pool } = pg;
export type PgPool = pg.Pool;

export function createPgPool(config: AppConfig['database'], logger: Logger): PgPool {
  const pool = new Pool({
    connectionString: config.url,
    min: config.poolMin,
    max: config.poolMax,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    idleTimeoutMillis: config.idleTimeoutMs,
    application_name: 'zh-lao-backend'
  });
  pool.on('error', (error) => logger.error({ err: error }, 'Unexpected idle PostgreSQL client error'));
  return pool;
}

export function asExecutor(pool: PgPool): DatabaseExecutor {
  return { query: (text, values) => pool.query(text, values as unknown[]) };
}
