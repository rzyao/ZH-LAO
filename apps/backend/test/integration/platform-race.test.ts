import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';
import { buildPlatformModule } from '../../src/modules/platform/http/composition.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('Platform concurrency and race conditions on real PostgreSQL', () => {
  let database: TestDatabase;
  let pool: pg.Pool;
  let transactions: TransactionManager;
  const logger = pino({ level: 'silent' });

  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool(
      { url: database.url, poolMin: 0, poolMax: 10, connectionTimeoutMs: 5_000, idleTimeoutMs: 5_000 },
      logger,
    );
    transactions = new TransactionManager(pool, logger);
  }, 120_000);

  afterAll(async () => {
    if (pool) await pool.end();
    if (database) await database.dispose();
  }, 30_000);

  it('concurrent feature flag override upserts on same scope produce single canonical row', async () => {
    const platform = buildPlatformModule({
      executor: asExecutor(pool),
      transactionManager: transactions,
    });

    await platform.managementService!.createRegion({
      code: 'VN',
      name: 'Vietnam',
      defaultLocale: 'vi-VN',
      timezone: 'Asia/Ho_Chi_Minh',
    });
    await platform.managementService!.createFeatureFlag({
      key: 'race_flag_1',
      name: 'Race Flag 1',
      defaultEnabled: false,
    });

    // Run 10 concurrent upserts on the same region+client scope via transaction manager
    const promises = Array.from({ length: 10 }).map((_, i) =>
      platform.managementService!.setFeatureFlagOverride({
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
    const platform = buildPlatformModule({
      executor: asExecutor(pool),
      transactionManager: transactions,
    });

    await platform.managementService!.createFeatureFlag({
      key: 'race_flag_2',
      name: 'Race Flag 2',
      defaultEnabled: false,
    });

    const tasks = [
      platform.managementService!.setFeatureFlagOverride({
        key: 'race_flag_2',
        clientPlatform: 'ios',
        enabled: true,
      }),
      platform.managementService!.removeFeatureFlagOverride({
        key: 'race_flag_2',
        clientPlatform: 'ios',
      }),
      platform.managementService!.setFeatureFlagOverride({
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

  it('Race A: concurrent policy commands modifying the same platform/build serialize cleanly under transaction advisory lock', async () => {
    const platform = buildPlatformModule({
      executor: asExecutor(pool),
      transactionManager: transactions,
    });

    await platform.managementService!.createAppVersionDraft({
      clientPlatform: 'ios',
      version: '1.0.0',
      buildNumber: 100,
      releaseNotes: 'v1.0.0',
    });
    await platform.managementService!.createAppVersionDraft({
      clientPlatform: 'ios',
      version: '2.0.0',
      buildNumber: 200,
      releaseNotes: 'v2.0.0',
    });

    await platform.managementService!.publishAppVersion('ios', 100);
    await platform.managementService!.publishAppVersion('ios', 200);

    // Concurrently set policy on build 100
    const p1 = platform.managementService!.setAppVersionPolicy('ios', 100, {
      status: 'deprecated',
      updatePolicy: 'optional',
    });
    const p2 = platform.managementService!.setAppVersionPolicy('ios', 100, {
      status: 'blocked',
      updatePolicy: 'required',
    });

    await Promise.allSettled([p1, p2]);

    const res = await platform.appVersionUseCases.checkAppVersion(asExecutor(pool), {
      clientPlatform: 'ios',
      currentVersion: '1.0.0',
      buildNumber: 100,
    });
    expect(['deprecated', 'blocked']).toContain(res.currentStatus);
  });

  it('Race B: concurrent block(100) vs modifying(200) strictly protects higher-active-target invariant under advisory lock', async () => {
    const platform = buildPlatformModule({
      executor: asExecutor(pool),
      transactionManager: transactions,
    });

    await platform.managementService!.createAppVersionDraft({
      clientPlatform: 'android',
      version: '1.0.0',
      buildNumber: 100,
      releaseNotes: 'v1.0.0',
    });
    await platform.managementService!.createAppVersionDraft({
      clientPlatform: 'android',
      version: '2.0.0',
      buildNumber: 200,
      releaseNotes: 'v2.0.0',
    });

    await platform.managementService!.publishAppVersion('android', 100);
    await platform.managementService!.publishAppVersion('android', 200);

    // Concurrently:
    // A: try to set 100 to blocked/required
    // B: try to set 200 to blocked/required (which will fail because 200 has no higher active target, or if attempted, advisory lock serializes them)
    const taskA = platform.managementService!.setAppVersionPolicy('android', 100, {
      status: 'blocked',
      updatePolicy: 'required',
    });
    const taskB = platform.managementService!.setAppVersionPolicy('android', 200, {
      status: 'blocked',
      updatePolicy: 'required',
    });

    const results = await Promise.allSettled([taskA, taskB]);

    // Task B MUST be rejected because 200 has no higher active target
    expect(results[1].status).toBe('rejected');

    // Verify invariant in database: 100 is blocked, but 200 remains active (the valid upgrade target)
    const check100 = await platform.appVersionUseCases.checkAppVersion(asExecutor(pool), {
      clientPlatform: 'android',
      currentVersion: '1.0.0',
      buildNumber: 100,
    });
    expect(check100).toMatchObject({
      supported: false,
      updateRequired: true,
      latestBuildNumber: 200,
      reason: 'blocked',
    });
  });
});
