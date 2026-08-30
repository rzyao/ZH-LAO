import type { FastifyInstance } from 'fastify';
import type { DatabaseExecutor } from '../../../database/executor.js';
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
import { PlatformPublicService } from '../application/services/platform-public-service.js';
import { registerPlatformRuntimeRoutes } from './routes.js';

export type PlatformModule = Readonly<{
  publicService: PlatformPublicService;
  featureFlagUseCases: FeatureFlagUseCases;
  runtimeConfigUseCases: RuntimeConfigUseCases;
  appVersionUseCases: AppVersionUseCases;
  announcementUseCases: AnnouncementUseCases;
  regionUseCases: RegionUseCases;
  runtimeConfigRegistry: RuntimeConfigRegistry;
  registerRoutes: (app: FastifyInstance) => Promise<void>;
}>;

export function buildPlatformModule(executor: DatabaseExecutor): PlatformModule {
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

  return {
    publicService,
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
