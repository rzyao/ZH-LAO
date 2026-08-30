import type { FastifyInstance } from 'fastify';
import type { DatabaseExecutor } from '../database/executor.js';
import { hasCompatibleBaseline } from '../database/migration-compatibility.js';

export type ReadinessState = { isShuttingDown: boolean };
export async function checkReadiness(executor: DatabaseExecutor, state: ReadinessState): Promise<boolean> {
  if (state.isShuttingDown) return false;
  return hasCompatibleBaseline(executor);
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
