import type pg from 'pg';
import type { Logger } from 'pino';
import type { DatabaseExecutor } from './executor.js';

export class TransactionManager {
  constructor(private readonly pool: pg.Pool, private readonly logger: Logger) {}

  async run<T>(callback: (executor: DatabaseExecutor) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      try {
        const result = await callback({ query: (text, values) => client.query(text, values as unknown[]) });
        await client.query('COMMIT');
        return result;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          this.logger.error({ err: rollbackError, originalError: error }, 'PostgreSQL transaction rollback failed');
        }
        throw error;
      }
    } finally {
      client.release();
    }
  }
}
