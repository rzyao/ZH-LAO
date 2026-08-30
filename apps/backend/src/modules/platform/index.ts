import type { FastifyInstance } from 'fastify';
import { registerPlatformHttp, type PlatformRuntimeHttpDependencies } from './http/index.js';

export * from './domain/index.js';
export * from './application/index.js';
export * from './infrastructure/index.js';
export * from './http/index.js';

export type PlatformModuleRoot = Readonly<{
  registerHttp(app: FastifyInstance, dependencies: PlatformRuntimeHttpDependencies): Promise<void>;
}>;

export const platformModule: PlatformModuleRoot = {
  registerHttp: registerPlatformHttp,
};
