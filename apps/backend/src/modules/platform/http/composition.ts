import type { FastifyInstance } from 'fastify';
import type { DatabaseExecutor } from '../../../database/executor.js';
import type { TransactionManager } from '../../../database/transaction-manager.js';
import {
  PostgresAnnouncementRepository,
  PostgresAppVersionRepository,
  PostgresFeatureFlagOverrideRepository,
  PostgresFeatureFlagRepository,
  PostgresRegionRepository,
  PostgresRuntimeConfigRepository,
} from '../infrastructure/repositories.js';
import {
  AnnouncementUseCases,
  AppVersionUseCases,
  createDefaultRuntimeConfigRegistry,
  FeatureFlagUseCases,
  RegionUseCases,
  RuntimeConfigRegistry,
  RuntimeConfigUseCases,
} from '../application/use-cases/index.js';
import {
  PlatformManagementService,
  PlatformPublicService,
} from '../application/services/index.js';
import { registerPlatformRuntimeRoutes } from './routes.js';

export type PlatformModule = Readonly<{
  publicService: PlatformPublicService;
  managementService?: PlatformManagementService | undefined;
  featureFlagUseCases: FeatureFlagUseCases;
  runtimeConfigUseCases: RuntimeConfigUseCases;
  appVersionUseCases: AppVersionUseCases;
  announcementUseCases: AnnouncementUseCases;
  regionUseCases: RegionUseCases;
  runtimeConfigRegistry: RuntimeConfigRegistry;
  registerRoutes: (app: FastifyInstance) => Promise<void>;
}>;

export type PlatformModuleOptions = Readonly<{
  executor: DatabaseExecutor;
  transactionManager?: TransactionManager | undefined;
}>;

export function buildPlatformModule(optionsOrExecutor: DatabaseExecutor | PlatformModuleOptions): PlatformModule {
  const executor = 'executor' in optionsOrExecutor ? optionsOrExecutor.executor : optionsOrExecutor;
  const transactionManager = 'transactionManager' in optionsOrExecutor ? optionsOrExecutor.transactionManager : undefined;

  const flagRepo = new PostgresFeatureFlagRepository();
  const overrideRepo = new PostgresFeatureFlagOverrideRepository();
  const configRepo = new PostgresRuntimeConfigRepository();
  const appVersionRepo = new PostgresAppVersionRepository();
  const announcementRepo = new PostgresAnnouncementRepository();
  const regionRepo = new PostgresRegionRepository();

  const runtimeConfigRegistry = createDefaultRuntimeConfigRegistry();

  const featureFlagUseCases = new FeatureFlagUseCases(flagRepo, overrideRepo, regionRepo);
  const runtimeConfigUseCases = new RuntimeConfigUseCases(configRepo, runtimeConfigRegistry);
  const appVersionUseCases = new AppVersionUseCases(appVersionRepo);
  const announcementUseCases = new AnnouncementUseCases(announcementRepo, regionRepo);
  const regionUseCases = new RegionUseCases(regionRepo);

  const publicService = new PlatformPublicService(
    executor,
    featureFlagUseCases,
    runtimeConfigUseCases,
    regionUseCases,
  );

  const managementService = transactionManager
    ? new PlatformManagementService(
        transactionManager,
        featureFlagUseCases,
        runtimeConfigUseCases,
        appVersionUseCases,
        announcementUseCases,
        regionUseCases,
      )
    : undefined;

  return {
    publicService,
    managementService,
    featureFlagUseCases,
    runtimeConfigUseCases,
    appVersionUseCases,
    announcementUseCases,
    regionUseCases,
    runtimeConfigRegistry,
    registerRoutes: async (app: FastifyInstance) => {
      await registerPlatformRuntimeRoutes(app, {
        executor,
        featureFlagUseCases,
        appVersionUseCases,
        announcementUseCases,
        regionUseCases,
      });
    },
  };
}
