import type { FastifyInstance } from 'fastify';
import { registerIdentityRoutes, type IdentityHttpDependencies } from './routes.js';

export async function registerIdentityHttp(app: FastifyInstance, dependencies: IdentityHttpDependencies): Promise<void> {
  await registerIdentityRoutes(app, dependencies);
}
