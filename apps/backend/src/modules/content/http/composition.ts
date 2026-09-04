import type { FastifyInstance } from 'fastify';
import type { AuthenticationProvider } from '../../../auth/authentication-provider.js';
import type { OperationsAuditRecorder, OperationsAuthorizer } from '../../operations/public/index.js';
import type { ContentRepository } from '../application/ports/repositories.js';
import { adminContentRoutes } from './admin-routes.js';
import { publicContentRoutes } from './public-routes.js';

export async function registerContentRoutes(app: FastifyInstance, dependencies: {
  contentRepository: ContentRepository;
  authentication: AuthenticationProvider;
  authorizer: OperationsAuthorizer;
  audit: OperationsAuditRecorder;
}): Promise<void> {
  await app.register(publicContentRoutes, {
    prefix: '/api/v1/content',
    contentRepository: dependencies.contentRepository,
  });
  await app.register(adminContentRoutes, {
    prefix: '/api/v1/admin/content',
    ...dependencies,
  });
}
