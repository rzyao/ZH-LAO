import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppError } from '../../../errors/app-error.js';
import type { DatabaseExecutor } from '../../../database/executor.js';
import type {
  AnnouncementUseCases,
  AppVersionUseCases,
  FeatureFlagUseCases,
  RegionUseCases,
} from '../application/use-cases/index.js';

const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError({
      code: 'PLATFORM_INVALID_ARGUMENT',
      message: 'Request validation failed',
      httpStatus: 400,
      details: result.error.issues,
    });
  }
  return result.data;
};

const resolveFeaturesSchema = z
  .object({
    keys: z.array(z.string().regex(/^[a-z][a-z0-9_]{0,99}$/)).min(1).max(100),
    region_code: z.string().regex(/^[A-Z][A-Z0-9_]{1,7}$/).optional(),
    client_platform: z.enum(['android', 'ios']).optional(),
  })
  .strict();

const checkAppVersionSchema = z
  .object({
    client_platform: z.enum(['android', 'ios']),
    current_version: z.string().min(1).max(32),
    build_number: z.number().int().positive(),
  })
  .strict();

const getAnnouncementsQuerySchema = z
  .object({
    region_code: z.string().regex(/^[A-Z][A-Z0-9_]{1,7}$/).optional(),
    client_platform: z.enum(['android', 'ios']).optional(),
  })
  .strict();

const getRegionParamsSchema = z
  .object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]{1,7}$/),
  })
  .strict();

export type PlatformRuntimeHttpDependencies = Readonly<{
  executor: DatabaseExecutor;
  featureFlagUseCases: FeatureFlagUseCases;
  appVersionUseCases: AppVersionUseCases;
  announcementUseCases: AnnouncementUseCases;
  regionUseCases: RegionUseCases;
}>;

export async function registerPlatformRuntimeRoutes(
  app: FastifyInstance,
  dependencies: PlatformRuntimeHttpDependencies,
): Promise<void> {
  const { executor, featureFlagUseCases, appVersionUseCases, announcementUseCases, regionUseCases } = dependencies;

  app.post('/api/v1/platform/features/resolve', async (request) => {
    const body = parse(resolveFeaturesSchema, request.body);
    const results = await featureFlagUseCases.resolveFeatures(executor, {
      keys: body.keys,
      context: {
        regionCode: body.region_code,
        clientPlatform: body.client_platform,
      },
    });

    return {
      features: results.map((r) => ({
        key: r.key,
        enabled: r.enabled,
        reason: r.reason,
      })),
    };
  });

  app.post('/api/v1/platform/app-version/check', async (request) => {
    const body = parse(checkAppVersionSchema, request.body);
    const result = await appVersionUseCases.checkAppVersion(executor, {
      clientPlatform: body.client_platform,
      currentVersion: body.current_version,
      buildNumber: body.build_number,
    });

    return {
      client_platform: result.clientPlatform,
      current_version: result.currentVersion,
      current_build_number: result.currentBuildNumber,
      known_build: result.knownBuild,
      supported: result.supported,
      update_available: result.updateAvailable,
      update_required: result.updateRequired,
      current_status: result.currentStatus,
      update_policy: result.updatePolicy,
      latest_version: result.latestVersion,
      latest_build_number: result.latestBuildNumber,
      minimum_supported_version: result.minimumSupportedVersion,
      minimum_supported_build_number: result.minimumSupportedBuildNumber,
      latest_release_notes: result.latestReleaseNotes,
      reason: result.reason,
    };
  });

  app.get('/api/v1/platform/announcements', async (request) => {
    const query = parse(getAnnouncementsQuerySchema, request.query);
    const announcements = await announcementUseCases.getActiveAnnouncements(executor, {
      regionCode: query.region_code,
      clientPlatform: query.client_platform,
    });

    return {
      announcements: announcements.map((a) => ({
        announcement_id: a.announcementId,
        title: a.title,
        content: a.content,
        starts_at: a.startsAt,
        ends_at: a.endsAt,
      })),
    };
  });

  app.get('/api/v1/platform/regions', async () => {
    const regions = await regionUseCases.listActiveRegions(executor);
    return {
      regions: regions.map((r) => ({
        code: r.code,
        name: r.name,
        default_locale: r.defaultLocale,
        timezone: r.timezone,
      })),
    };
  });

  app.get('/api/v1/platform/regions/:code', async (request) => {
    const params = parse(getRegionParamsSchema, request.params);
    const region = await regionUseCases.getRegion(executor, params.code);
    if (!region || region.status !== 'active') {
      throw new AppError({
        code: 'PLATFORM_NOT_FOUND',
        message: `Region '${params.code}' not found or inactive`,
        httpStatus: 404,
      });
    }

    return {
      code: region.code,
      name: region.name,
      default_locale: region.defaultLocale,
      timezone: region.timezone,
    };
  });
}
