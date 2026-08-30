import type { FastifyInstance } from 'fastify';
import type { DatabaseExecutor } from '../database/executor.js';

export type ReadinessState = { isShuttingDown: boolean };
export async function checkReadiness(executor: DatabaseExecutor, state: ReadinessState): Promise<boolean> {
  if (state.isShuttingDown) return false;
  const result = await executor.query<{ database_ok: boolean }>(`
    SELECT (to_regclass('infrastructure.assets') IS NOT NULL
      AND to_regclass('infrastructure.system_outbox_events') IS NOT NULL
      AND to_regclass('public.v2_schema_migrations') IS NOT NULL) AS database_ok
  `);
  return result.rows[0]?.database_ok === true;
}

export function registerHealthRoutes(app: FastifyInstance, executor: DatabaseExecutor, state: ReadinessState): void {
  app.get('/health/live', async () => ({ status: 'ok' }));
  app.get('/health/ready', async (_request, reply) => {
    try {
      if (await checkReadiness(executor, state)) return { status: 'ok' };
    } catch (error) {
      app.log.warn({ err: error }, 'Readiness database check failed');
    }
    return reply.status(503).send({ status: 'unavailable' });
  });
}
