import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';
import { buildPlatformModule } from '../../src/modules/platform/http/composition.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('Platform concurrency and race conditions on real PostgreSQL', () => {
  let database: TestDatabase;
  let pool: pg.Pool;
  const logger = pino({ level: 'silent' });

  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool(
      { url: database.url, poolMin: 0, poolMax: 10, connectionTimeoutMs: 5_000, idleTimeoutMs: 5_000 },
      logger,
    );
  }, 120_000);

  afterAll(async () => {
    if (pool) await pool.end();
    if (database) await database.dispose();
  }, 30_000);

  it('concurrent feature flag override upserts on same scope produce single canonical row', async () => {
    const platform = buildPlatformModule(asExecutor(pool));
    const executor = asExecutor(pool);

    await platform.regionUseCases.createRegion(executor, {
      code: 'VN',
      name: 'Vietnam',
      defaultLocale: 'vi-VN',
      timezone: 'Asia/Ho_Chi_Minh',
    });
    await platform.featureFlagUseCases.createFeatureFlag(executor, {
      key: 'race_flag_1',
      name: 'Race Flag 1',
      defaultEnabled: false,
    });

    // Run 10 concurrent upserts on the same region+client scope
    const promises = Array.from({ length: 10 }).map((_, i) =>
      platform.featureFlagUseCases.setFeatureFlagOverride(executor, {
        key: 'race_flag_1',
        regionCode: 'VN',
        clientPlatform: 'android',
        enabled: i % 2 === 0,
      }),
    );

    await Promise.all(promises);

    const countRes = await pool.query(
      `SELECT count(*)::int AS count FROM platform.feature_flag_overrides o
       JOIN platform.feature_flags f ON f.id = o.feature_flag_id
       WHERE f.key = 'race_flag_1'`,
    );
    expect(countRes.rows[0]?.count).toBe(1);
  });

  it('concurrent set vs remove override leaves deterministic final state without errors', async () => {
    const platform = buildPlatformModule(asExecutor(pool));
    const executor = asExecutor(pool);

    await platform.featureFlagUseCases.createFeatureFlag(executor, {
      key: 'race_flag_2',
      name: 'Race Flag 2',
      defaultEnabled: false,
    });

    const tasks = [
      platform.featureFlagUseCases.setFeatureFlagOverride(executor, {
        key: 'race_flag_2',
        clientPlatform: 'ios',
        enabled: true,
      }),
      platform.featureFlagUseCases.removeFeatureFlagOverride(executor, {
        key: 'race_flag_2',
        clientPlatform: 'ios',
      }),
      platform.featureFlagUseCases.setFeatureFlagOverride(executor, {
        key: 'race_flag_2',
        clientPlatform: 'ios',
        enabled: false,
      }),
    ];

    await Promise.all(tasks);

    const countRes = await pool.query(
      `SELECT count(*)::int AS count FROM platform.feature_flag_overrides o
       JOIN platform.feature_flags f ON f.id = o.feature_flag_id
       WHERE f.key = 'race_flag_2'`,
    );
    expect(countRes.rows[0]?.count).toBeLessThanOrEqual(1);
  });

  it('concurrent app version policy updates are serialized via platform advisory lock', async () => {
    const platform = buildPlatformModule(asExecutor(pool));
    const executor = asExecutor(pool);

    await platform.appVersionUseCases.createAppVersionDraft(executor, {
      clientPlatform: 'ios',
      version: '1.0.0',
      buildNumber: 100,
      releaseNotes: 'v1.0.0',
    });
    await platform.appVersionUseCases.createAppVersionDraft(executor, {
      clientPlatform: 'ios',
      version: '2.0.0',
      buildNumber: 200,
      releaseNotes: 'v2.0.0',
    });

    await platform.appVersionUseCases.publishAppVersion(executor, 'ios', 100);
    await platform.appVersionUseCases.publishAppVersion(executor, 'ios', 200);

    // Concurrently set policy on build 100
    const p1 = platform.appVersionUseCases.setAppVersionPolicy(executor, 'ios', 100, {
      status: 'deprecated',
      updatePolicy: 'optional',
    });
    const p2 = platform.appVersionUseCases.setAppVersionPolicy(executor, 'ios', 100, {
      status: 'blocked',
      updatePolicy: 'required',
    });

    await Promise.allSettled([p1, p2]);

    const res = await platform.appVersionUseCases.checkAppVersion(executor, {
      clientPlatform: 'ios',
      currentVersion: '1.0.0',
      buildNumber: 100,
    });
    expect(['deprecated', 'blocked']).toContain(res.currentStatus);
  });
});
