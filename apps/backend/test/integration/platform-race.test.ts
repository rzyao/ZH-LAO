import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';
import { buildPlatformModule } from '../../src/modules/platform/http/composition.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

async function waitForAdvisoryLockWaiter(pool: pg.Pool): Promise<void> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await pool.query<{ count: number }>(
      `SELECT count(*)::int AS count
       FROM pg_stat_activity
       WHERE datname = current_database()
         AND state = 'active'
         AND wait_event_type = 'Lock'
         AND query LIKE '%pg_advisory_xact_lock%'
         AND query NOT LIKE '%pg_stat_activity%'`,
    );
    if ((result.rows[0]?.count ?? 0) > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('Timed out waiting for a Platform advisory-lock waiter');
}

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

  it('concurrent set vs remove override leaves at most one canonical row without errors', async () => {
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

  it('Race A: app-version management command actually waits for the platform transaction advisory lock', async () => {
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

    let releaseHolder!: () => void;
    const holderRelease = new Promise<void>((resolve) => {
      releaseHolder = resolve;
    });
    let holderLocked!: () => void;
    const holderLockedPromise = new Promise<void>((resolve) => {
      holderLocked = resolve;
    });

    const holder = transactions.run(async (tx) => {
      await tx.query('SELECT pg_advisory_xact_lock($1)', [3002]);
      holderLocked();
      await holderRelease;
    });

    await holderLockedPromise;

    let commandSettled = false;
    const command = platform.managementService!.setAppVersionPolicy('ios', 100, {
      status: 'deprecated',
      updatePolicy: 'optional',
    }).finally(() => {
      commandSettled = true;
    });

    await waitForAdvisoryLockWaiter(pool);
    expect(commandSettled).toBe(false);

    releaseHolder();
    await holder;
    await command;

    const res = await platform.appVersionUseCases.checkAppVersion(asExecutor(pool), {
      clientPlatform: 'ios',
      currentVersion: '1.0.0',
      buildNumber: 100,
    });
    expect(res).toMatchObject({
      currentStatus: 'deprecated',
      updatePolicy: 'optional',
      latestBuildNumber: 200,
    });
  });

  it('Race B: same-platform policy commands preserve the higher-active-target invariant', async () => {
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

    const [lowerResult, highestResult] = await Promise.allSettled([
      platform.managementService!.setAppVersionPolicy('android', 100, {
        status: 'blocked',
        updatePolicy: 'required',
      }),
      platform.managementService!.setAppVersionPolicy('android', 200, {
        status: 'blocked',
        updatePolicy: 'required',
      }),
    ]);

    expect(lowerResult.status).toBe('fulfilled');
    expect(highestResult.status).toBe('rejected');

    const rows = await pool.query<{
      build_number: string;
      status: string;
      update_policy: string;
    }>(
      `SELECT build_number::text, status, update_policy
       FROM platform.app_versions
       WHERE client_platform = 'android'
       ORDER BY build_number ASC`,
    );

    expect(rows.rows).toEqual([
      { build_number: '100', status: 'blocked', update_policy: 'required' },
      { build_number: '200', status: 'active', update_policy: 'none' },
    ]);
  });
});
