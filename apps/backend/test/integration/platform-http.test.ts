import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { buildApp } from '../../src/bootstrap/build-app.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';
import { buildPlatformModule } from '../../src/modules/platform/http/composition.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('Platform HTTP Runtime Endpoints', () => {
  let database: TestDatabase;
  let pool: pg.Pool;
  const logger = pino({ level: 'silent' });

  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool(
      { url: database.url, poolMin: 0, poolMax: 4, connectionTimeoutMs: 2_000, idleTimeoutMs: 2_000 },
      logger,
    );
  }, 120_000);

  afterAll(async () => {
    if (pool) await pool.end();
    if (database) await database.dispose();
  }, 30_000);

  it('serves POST /api/v1/platform/features/resolve and rejects unknown keys as fail-closed', async () => {
    const executor = asExecutor(pool);
    const platform = buildPlatformModule(executor);
    const app = buildApp({ logger, database: executor });
    await platform.registerRoutes(app);

    await platform.featureFlagUseCases.createFeatureFlag(executor, {
      key: 'audio_stream',
      name: 'Audio Stream',
      defaultEnabled: true,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/features/resolve',
      payload: {
        keys: ['audio_stream', 'unregistered_flag'],
        client_platform: 'android',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.features).toEqual([
      { key: 'audio_stream', enabled: true, reason: 'default_enabled' },
      { key: 'unregistered_flag', enabled: false, reason: 'flag_not_found' },
    ]);
  });

  it('serves POST /api/v1/platform/app-version/check and GET /api/v1/platform/regions', async () => {
    const executor = asExecutor(pool);
    const platform = buildPlatformModule(executor);
    const app = buildApp({ logger, database: executor });
    await platform.registerRoutes(app);

    await platform.regionUseCases.createRegion(executor, {
      code: 'MY',
      name: 'Malaysia',
      defaultLocale: 'ms-MY',
      timezone: 'Asia/Kuala_Lumpur',
    });

    await platform.appVersionUseCases.createAppVersionDraft(executor, {
      clientPlatform: 'android',
      version: '3.0.0',
      buildNumber: 30001,
      releaseNotes: 'V3 release',
    });
    await platform.appVersionUseCases.publishAppVersion(executor, 'android', 30001);

    const versionRes = await app.inject({
      method: 'POST',
      url: '/api/v1/platform/app-version/check',
      payload: {
        client_platform: 'android',
        current_version: '3.0.0',
        build_number: 30001,
      },
    });
    expect(versionRes.statusCode).toBe(200);
    expect(versionRes.json()).toMatchObject({
      supported: true,
      latest_version: '3.0.0',
      latest_build_number: 30001,
      update_available: false,
    });

    const regionsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/regions',
    });
    expect(regionsRes.statusCode).toBe(200);
    expect(regionsRes.json().regions.some((r: { code: string }) => r.code === 'MY')).toBe(true);

    const singleRegionRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/regions/MY',
    });
    expect(singleRegionRes.statusCode).toBe(200);
    expect(singleRegionRes.json().code).toBe('MY');

    const notFoundRegionRes = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/regions/ZZ',
    });
    expect(notFoundRegionRes.statusCode).toBe(404);
  });

  it('serves GET /api/v1/platform/announcements', async () => {
    const executor = asExecutor(pool);
    const platform = buildPlatformModule(executor);
    const app = buildApp({ logger, database: executor });
    await platform.registerRoutes(app);

    const a = await platform.announcementUseCases.createAnnouncementDraft(executor, {
      title: 'HTTP Notice',
      content: 'Hello World',
      startsAt: new Date(Date.now() - 1000),
    });
    await platform.announcementUseCases.publishAnnouncement(executor, a.publicId);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/platform/announcements',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().announcements.some((item: { title: string }) => item.title === 'HTTP Notice')).toBe(true);
  });
});
