import type { FastifyInstance } from 'fastify';
import type { AuthenticationProvider } from '../../../auth/authentication-provider.js';
import type { DatabaseExecutor } from '../../../database/executor.js';
import type { TransactionManager } from '../../../database/transaction-manager.js';
import type { IdentityPublicQueries } from '../../identity/public/index.js';
import { OperationsService } from '../application/services/index.js';
import { PostgresOperationsRepository } from '../infrastructure/index.js';
import { registerOperationsRoutes } from './routes.js';
import type { AdminOperatorProvisioningService } from '../../admin-operator-provisioning/application/admin-operator-provisioning-service.js';

export type OperationsModule = Readonly<{ service: OperationsService; registerHttp(app:FastifyInstance):Promise<void> }>;
export function buildOperationsModule(options:{executor:DatabaseExecutor;transactionManager:TransactionManager;identity:IdentityPublicQueries;authentication:AuthenticationProvider;service?:OperationsService;provisioning?:AdminOperatorProvisioningService}):OperationsModule {
  const service = options.service ?? new OperationsService(options.transactionManager, options.executor, new PostgresOperationsRepository(), options.identity);
  return {service,registerHttp:async app=>registerOperationsRoutes(app,{service,authentication:options.authentication,...(options.provisioning?{provisioning:options.provisioning}:{})})};
}
