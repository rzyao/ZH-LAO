import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import type { Logger } from 'pino';
import type { DatabaseExecutor } from '../database/executor.js';
import type { AuthenticationProvider } from '../auth/authentication-provider.js';
import { installAuthContext } from '../auth/auth-hook.js';
import { installErrorHandler } from '../errors/error-handler.js';
import { registerHealthRoutes, type ReadinessState } from '../http/health-routes.js';
import { installRequestContext } from '../http/request-context.js';
import { installResponseEnvelope } from '../http/response-envelope.js';

export type AppDependencies = { logger: Logger; database: DatabaseExecutor; readinessState?: ReadinessState; authenticationProvider?: AuthenticationProvider };

export function buildApp(dependencies: AppDependencies): FastifyInstance {
  const app: FastifyInstance = Fastify({ loggerInstance: dependencies.logger as FastifyBaseLogger, requestIdHeader: 'x-request-id', genReqId: () => randomUUID() });
  installRequestContext(app);
  installAuthContext(app);
  installErrorHandler(app);
  installResponseEnvelope(app);
  registerHealthRoutes(app, dependencies.database, dependencies.readinessState ?? { isShuttingDown: false });
  return app;
}
