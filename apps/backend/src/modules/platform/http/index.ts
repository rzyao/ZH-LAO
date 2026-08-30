import type { FastifyInstance } from 'fastify';
import { registerPlatformRuntimeRoutes, type PlatformRuntimeHttpDependencies } from './routes.js';

export * from './routes.js';
export * from './composition.js';

export async function registerPlatformHttp(
  app: FastifyInstance,
  dependencies: PlatformRuntimeHttpDependencies,
): Promise<void> {
  await registerPlatformRuntimeRoutes(app, dependencies);
}
