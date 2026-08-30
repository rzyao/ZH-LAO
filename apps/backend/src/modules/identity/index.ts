import type { FastifyInstance } from 'fastify';
import { registerIdentityHttp } from './http/index.js';

export type IdentityModule = Readonly<{
  registerHttp(app: FastifyInstance): Promise<void>;
}>;

export const identityModule: IdentityModule = {
  registerHttp: registerIdentityHttp
};
