import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import { OutboxWriter } from '../../src/outbox/outbox-writer.js';
import { IdentityEventWriter, IdentityState } from '../../src/modules/identity/application/index.js';
import { parseRefreshTokenHash, parseUserPublicId } from '../../src/modules/identity/domain/index.js';
import { createIdentityRepositories } from '../../src/modules/identity/infrastructure/index.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const logger = pino({ level: 'silent' });

integration('IDN-14 identity state', () => {
  let db: TestDatabase; let pool: pg.Pool; let tx: TransactionManager;
  beforeAll(async () => { db = await createTestDatabase(adminUrl!); pool = createPgPool({ url: db.url, poolMin: 0, poolMax: 3, connectionTimeoutMs: 2000, idleTimeoutMs: 2000 }, logger); tx = new TransactionManager(pool, logger); }, 120000);
  afterAll(async () => { await pool?.end(); await db?.dispose(); });

  it('disables user, revokes active sessions, and records public status events', async () => {
    const r = createIdentityRepositories(asExecutor(pool));
    const u = await r.users.create({ publicId: parseUserPublicId(newLogicalUuid()), status: 'active' });
    const s = await r.sessions.create({ userId: u.id, refreshTokenHash: parseRefreshTokenHash('state-hash'), expiresAt: new Date(Date.now() + 60_000) });
    const state = new IdentityState(tx, createIdentityRepositories, new IdentityEventWriter(new OutboxWriter()));
    expect(await state.changeStatus(u.publicId, 'disabled')).toMatchObject({ status: 'disabled' });
    expect((await r.sessions.findByRefreshTokenHash(s.refreshTokenHash))?.status).toBe('revoked');
    expect((await pool.query("SELECT count(*)::int AS count FROM infrastructure.system_outbox_events WHERE event_type='identity.account_status_changed.v1' ")).rows[0]!.count).toBe(1);
    await state.changeStatus(u.publicId, 'active');
    await expect(state.changeStatus(u.publicId, 'closed')).resolves.toMatchObject({ status: 'closed' });
    await expect(state.changeStatus(u.publicId, 'active')).rejects.toMatchObject({ code: 'INVALID_DATA' });
  });
});
