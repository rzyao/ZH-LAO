import type { FastifyInstance } from 'fastify';
import { registerIdentityHttp } from './http/index.js';
import type { IdentityHttpDependencies } from './http/routes.js';

export type IdentityModule = Readonly<{
  registerHttp(app: FastifyInstance, dependencies: IdentityHttpDependencies): Promise<void>;
}>;

export const identityModule: IdentityModule = {
  registerHttp: registerIdentityHttp
};
