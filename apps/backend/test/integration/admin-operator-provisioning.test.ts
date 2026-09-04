import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { AdminOperatorProvisioningService } from '../../src/modules/admin-operator-provisioning/application/admin-operator-provisioning-service.js';
import { AdminAccountWriter } from '../../src/modules/identity/application/services/admin-account-writer.js';
import { AdminOperatorWriter } from '../../src/modules/operations/application/services/admin-operator-writer.js';
import { PostgresOperationsRepository } from '../../src/modules/operations/infrastructure/repositories.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('Admin operator provisioning transaction', () => {
  let database: TestDatabase;
  let pool: pg.Pool;
  const logger = pino({ level: 'silent' });

  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 3, connectionTimeoutMs: 2_000, idleTimeoutMs: 2_000 }, logger);
  }, 120_000);
  afterAll(async () => { await pool?.end(); await database?.dispose(); }, 30_000);

  it('rolls back the new Identity account when the Operations audit write fails', async () => {
    const base = new PostgresOperationsRepository();
    const failingRepository = {
      createOperator: base.createOperator.bind(base),
      insertAudit: async () => { throw new Error('simulated audit failure'); },
    };
    const service = new AdminOperatorProvisioningService(
      new TransactionManager(pool, logger),
      new AdminAccountWriter(),
      new AdminOperatorWriter(failingRepository as never),
    );
    const username = `operator_rollback_${Date.now()}`;

    await expect(service.create(
      { operatorId: '00000000-0000-4000-8000-000000000001', authSubjectId: '00000000-0000-4000-8000-000000000002' },
      { username, displayName: 'Rollback operator' },
    )).rejects.toThrow('simulated audit failure');

    expect((await pool.query('SELECT count(*)::int AS count FROM identity.admin_credentials WHERE username=$1', [username])).rows[0]!.count).toBe(0);
    expect((await pool.query('SELECT count(*)::int AS count FROM operations.operators WHERE display_name=$1', ['Rollback operator'])).rows[0]!.count).toBe(0);
  });
});
