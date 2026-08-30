import type { FastifyInstance } from 'fastify';
import type { PlatformRuntimeHttpDependencies } from './http/index.js';
import { registerPlatformRuntimeRoutes } from './http/routes.js';

export type PlatformModuleRoot = Readonly<{
  registerHttp(app: FastifyInstance, dependencies: PlatformRuntimeHttpDependencies): Promise<void>;
}>;

export const platformModule: PlatformModuleRoot = {
  registerHttp: async (app: FastifyInstance, dependencies: PlatformRuntimeHttpDependencies) => {
    await registerPlatformRuntimeRoutes(app, dependencies);
  },
};
