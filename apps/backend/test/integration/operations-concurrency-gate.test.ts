import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';
import { OperationsService } from '../../src/modules/operations/application/services/index.js';
import { PostgresOperationsRepository } from '../../src/modules/operations/infrastructure/index.js';
import { parseUserPublicId, type IdentityPublicQueries } from '../../src/modules/identity/public/index.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const logger = pino({ level: 'silent' });

integration('Operations final concurrency gate', () => {
  let database: TestDatabase;
  let pool: pg.Pool;
  const activeSubjects = new Set<string>();

  const identity: IdentityPublicQueries = {
    async getIdentityAccountStatus(id) { return activeSubjects.has(id) ? 'active' : null; },
    async isIdentityActive(id) { return activeSubjects.has(id); },
    async getIdentitySummary(id) { return activeSubjects.has(id) ? { userPublicId: parseUserPublicId(id), status: 'active' } : null; },
  };

  const subject = () => {
    const id = crypto.randomUUID();
    activeSubjects.add(id);
    return id;
  };

  const service = () => new OperationsService(
    new TransactionManager(pool, logger),
    asExecutor(pool),
    new PostgresOperationsRepository(),
    identity,
  );

  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool({
      url: database.url,
      poolMin: 0,
      poolMax: 12,
      connectionTimeoutMs: 3_000,
      idleTimeoutMs: 3_000,
    }, logger);
    await service().bootstrap(subject(), 'Root Operator');
  }, 120_000);

  afterAll(async () => {
    if (pool) await pool.end();
    if (database) await database.dispose();
  }, 30_000);

  const rootContext = async () => {
    const root = (await service().listOperators({ page: 1, pageSize: 20 })).items.find(o => o.displayName === 'Root Operator')!;
    return { operatorId: root.id, authSubjectId: root.authSubjectId };
  };

  it('serializes duplicate concurrent role assignment and removal into one real mutation and one audit', async () => {
    const s = service();
    const actor = await rootContext();
    const target = await s.createOperator(actor, { authSubjectId: subject(), displayName: 'Concurrent Assignment Target' });
    const role = await s.createRole(actor, { code: 'concurrent_assignment', name: 'Concurrent Assignment' });

    const assigned = await Promise.all([
      s.assignRole(actor, target.id, role.id),
      s.assignRole(actor, target.id, role.id),
    ]);
    expect([...assigned].sort()).toEqual([false, true]);
    expect((await s.listAssignedRoles(target.id)).filter(r => r.id === role.id)).toHaveLength(1);
    expect((await s.listAudits({ operatorId: actor.operatorId, actionKey: 'operations.operator_roles.assign', targetId: target.id, limit: 20 })).items).toHaveLength(1);

    const revoked = await Promise.all([
      s.revokeRole(actor, target.id, role.id),
      s.revokeRole(actor, target.id, role.id),
    ]);
    expect([...revoked].sort()).toEqual([false, true]);
    expect((await s.listAssignedRoles(target.id)).some(r => r.id === role.id)).toBe(false);
    expect((await s.listAudits({ operatorId: actor.operatorId, actionKey: 'operations.operator_roles.revoke', targetId: target.id, limit: 20 })).items).toHaveLength(1);
  });

  it('reduces concurrent duplicate auth_subject_id creation to one canonical operator', async () => {
    const s = service();
    const actor = await rootContext();
    const authSubjectId = subject();
    const results = await Promise.allSettled([
      s.createOperator(actor, { authSubjectId, displayName: 'Duplicate Subject A' }),
      s.createOperator(actor, { authSubjectId, displayName: 'Duplicate Subject B' }),
    ]);

    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toMatchObject({ code: 'OPERATOR_ALREADY_EXISTS' });
    const operators = await s.listOperators({ page: 1, pageSize: 100 });
    expect(operators.items.filter(o => o.authSubjectId === authSubjectId)).toHaveLength(1);
  });

  it('reduces concurrent duplicate role code creation to one canonical role', async () => {
    const s = service();
    const actor = await rootContext();
    const results = await Promise.allSettled([
      s.createRole(actor, { code: 'duplicate_role_code', name: 'Duplicate Role A' }),
      s.createRole(actor, { code: 'duplicate_role_code', name: 'Duplicate Role B' }),
    ]);

    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toMatchObject({ code: 'ROLE_CODE_CONFLICT' });
    const roles = await s.listRoles({ page: 1, pageSize: 100 });
    expect(roles.items.filter(r => r.code === 'duplicate_role_code')).toHaveLength(1);
  });

  it('linearizes operator-disable versus authorization and denies every authorization after commit', async () => {
    const s = service();
    const actor = await rootContext();
    const authSubjectId = subject();
    const target = await s.createOperator(actor, { authSubjectId, displayName: 'Operator Race Target' });
    const role = await s.createRole(actor, { code: 'operator_disable_race', name: 'Operator Disable Race' });
    await s.setRolePermissions(actor, role.id, ['operations.operators.read']);
    await s.assignRole(actor, target.id, role.id);
    const auth = { subjectId: parseUserPublicId(authSubjectId) };

    const [authorization, disable] = await Promise.allSettled([
      s.requirePermission(auth, 'operations.operators.read'),
      s.setOperatorStatus(actor, target.id, 'disabled'),
    ]);
    expect(disable.status).toBe('fulfilled');
    expect(['fulfilled', 'rejected']).toContain(authorization.status);
    await expect(s.requirePermission(auth, 'operations.operators.read')).rejects.toMatchObject({ code: 'OPERATOR_DISABLED' });
  });

  it('linearizes role-disable versus authorization and denies every authorization after commit', async () => {
    const s = service();
    const actor = await rootContext();
    const authSubjectId = subject();
    const target = await s.createOperator(actor, { authSubjectId, displayName: 'Role Race Target' });
    const role = await s.createRole(actor, { code: 'role_disable_race', name: 'Role Disable Race' });
    await s.setRolePermissions(actor, role.id, ['operations.operators.read']);
    await s.assignRole(actor, target.id, role.id);
    const auth = { subjectId: parseUserPublicId(authSubjectId) };

    const [authorization, disable] = await Promise.allSettled([
      s.requirePermission(auth, 'operations.operators.read'),
      s.setRoleStatus(actor, role.id, 'disabled'),
    ]);
    expect(disable.status).toBe('fulfilled');
    expect(['fulfilled', 'rejected']).toContain(authorization.status);
    await expect(s.requirePermission(auth, 'operations.operators.read')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
