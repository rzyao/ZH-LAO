import type { FastifyInstance } from 'fastify';
import type { AuthenticationProvider } from '../../../auth/authentication-provider.js';
import type { OperationsAuditRecorder, OperationsAuthorizer, OperationsTransactionalAuditBoundary } from '../../operations/public/index.js';
import type { ContentRepository } from '../application/ports/repositories.js';
import type { StructuredContentRepository } from '../application/ports/structured-content-repository.js';
import type { CurriculumRepository } from '../application/ports/curriculum-repository.js';
import type {
  ContentTransactionRunner,
  LaoLetterAdminRepository,
} from '../application/ports/lo-letter-admin-repository.js';
import type { ManageLaoLetterBatchTasks } from '../application/use-cases/manage-lo-letter-batch-tasks.js';
import { adminContentRoutes } from './admin-routes.js';
import { publicContentRoutes } from './public-routes.js';
import { structuredAdminRoutes } from './structured-admin-routes.js';
import { loLetterBatchRoutes } from './lo-letter-batch-routes.js';

export async function registerContentRoutes(app: FastifyInstance, dependencies: {
  contentRepository: ContentRepository;
  structuredContentRepository?: StructuredContentRepository;
  curriculumRepository?: CurriculumRepository;
  laoLetterAdminRepository?: Pick<LaoLetterAdminRepository, 'list' | 'resolveQuerySelection' | 'resolveExplicitSelection'>;
  contentTransactions?: ContentTransactionRunner;
  laoLetterBatchTaskManager?: Pick<ManageLaoLetterBatchTasks,
    'createTask' | 'listOwnedTasks' | 'getOwnedTask' | 'retryFailed'>;
  authentication: AuthenticationProvider;
  authorizer: OperationsAuthorizer;
  audit: OperationsAuditRecorder;
  transactionalAudit?: OperationsTransactionalAuditBoundary;
}): Promise<void> {
  await app.register(publicContentRoutes, {
    prefix: '/api/v1/content',
    contentRepository: dependencies.contentRepository,
    ...(dependencies.curriculumRepository === undefined
      ? {}
      : { curriculumRepository: dependencies.curriculumRepository }),
  });
  await app.register(adminContentRoutes, {
    prefix: '/api/v1/admin/content',
    ...dependencies,
  });
  if (dependencies.laoLetterAdminRepository && dependencies.contentTransactions) {
    await app.register(loLetterBatchRoutes, {
      prefix: '/api/v1/admin/content',
      laoLetterAdminRepository: dependencies.laoLetterAdminRepository,
      contentTransactions: dependencies.contentTransactions,
      ...(dependencies.laoLetterBatchTaskManager === undefined
        ? {}
        : { laoLetterBatchTaskManager: dependencies.laoLetterBatchTaskManager }),
      authentication: dependencies.authentication,
      authorizer: dependencies.authorizer,
    });
  }
  if (dependencies.structuredContentRepository) {
    await app.register(structuredAdminRoutes, {
      prefix: '/api/v1/admin/content',
      structuredContentRepository: dependencies.structuredContentRepository,
      authentication: dependencies.authentication,
      authorizer: dependencies.authorizer,
      audit: dependencies.audit,
    });
  }
}
