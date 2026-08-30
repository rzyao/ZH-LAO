import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';
import { ProbeRepository } from '../support/probe-repository.js';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { OutboxWriter } from '../../src/outbox/outbox-writer.js';
import { newLogicalUuid } from '../../src/ids/uuid.js';
import { AssetRepository } from '../../src/assets/asset-repository.js';
import { EventHandlerRegistry } from '../../src/events/handler-registry.js';
import { OutboxRepository } from '../../src/outbox/outbox-repository.js';
import { OutboxPublisher } from '../../src/outbox/outbox-publisher.js';
import { buildApp } from '../../src/bootstrap/build-app.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
integration('Foundation on a fresh PostgreSQL V2 database', () => {
  let database: TestDatabase; let pool: pg.Pool; let transactions: TransactionManager;
  const logger = pino({ level: 'silent' });
  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 4, connectionTimeoutMs: 2_000, idleTimeoutMs: 2_000 }, logger);
    transactions = new TransactionManager(pool, logger);
    await pool.query('CREATE SCHEMA foundation_test; CREATE TABLE foundation_test.probes(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, value text NOT NULL)');
  }, 120_000);
  afterAll(async () => { if (pool) await pool.end(); if (database) await database.dispose(); }, 30_000);

  it('connects, commits, rolls back, maps repository rows, and releases clients', async () => {
    await transactions.run(async (executor) => { await new ProbeRepository(executor).insert('commit'); });
    expect(await new ProbeRepository(asExecutor(pool)).count()).toBe(1);
    await expect(transactions.run(async (executor) => { await new ProbeRepository(executor).insert('rollback'); throw new Error('rollback'); })).rejects.toThrow('rollback');
    expect(await new ProbeRepository(asExecutor(pool)).count()).toBe(1);
  });

  it('writes canonical probe and outbox atomically and enforces event constraints', async () => {
    const writer = new OutboxWriter(); const aggregateId = newLogicalUuid(); const eventId = newLogicalUuid();
    await transactions.run(async (executor) => {
      await new ProbeRepository(executor).insert('atomic');
      await writer.write(executor, { id: eventId, sourceDomain: 'foundation_test', type: 'foundation.probe', aggregateType: 'probe', aggregateId, payload: { ok: true }, headers: {}, occurredAt: new Date() });
    });
    expect((await pool.query('SELECT count(*)::int AS count FROM infrastructure.system_outbox_events WHERE event_id=$1', [eventId])).rows[0].count).toBe(1);
    const rollbackEvent = newLogicalUuid();
    await expect(transactions.run(async (executor) => { await new ProbeRepository(executor).insert('atomic-rollback'); await writer.write(executor, { id: rollbackEvent, sourceDomain: 'foundation_test', type: 'foundation.probe', aggregateType: 'probe', aggregateId, payload: {}, headers: {}, occurredAt: new Date() }); throw new Error('stop'); })).rejects.toThrow('stop');
    expect((await pool.query('SELECT count(*)::int AS count FROM infrastructure.system_outbox_events WHERE event_id=$1', [rollbackEvent])).rows[0].count).toBe(0);
    await expect(writer.write(asExecutor(pool), { id: eventId, sourceDomain: 'foundation_test', type: 'duplicate', aggregateType: 'probe', aggregateId, payload: {}, headers: {}, occurredAt: new Date() })).rejects.toMatchObject({ code: '23505' });
    await expect(pool.query(`INSERT INTO infrastructure.system_outbox_events(id,event_id,source_domain,event_type,aggregate_type,aggregate_id,payload,headers,occurred_at) VALUES($1,$2,'x','x','x',$3,'[]','{}',now())`, [newLogicalUuid(), newLogicalUuid(), aggregateId])).rejects.toMatchObject({ code: '23514' });
  });

  it('claims concurrently once, publishes, and retries failures', async () => {
    const eventId = newLogicalUuid(); const writer = new OutboxWriter();
    await writer.write(asExecutor(pool), { id: eventId, sourceDomain: 'foundation_test', type: 'foundation.publish', aggregateType: 'probe', aggregateId: newLogicalUuid(), payload: {}, headers: {}, occurredAt: new Date(Date.now() - 1_000) });
    const handled = vi.fn(); const registry = new EventHandlerRegistry(); registry.register('foundation.publish', { handle: async () => { handled(); } });
    const first = new OutboxPublisher(new OutboxRepository(asExecutor(pool)), registry, logger, { batchSize: 10, leaseMs: 30_000 });
    const second = new OutboxPublisher(new OutboxRepository(asExecutor(pool)), registry, logger, { batchSize: 10, leaseMs: 30_000 });
    await Promise.all([first.runOnce(), second.runOnce()]); expect(handled).toHaveBeenCalledOnce();
    expect((await pool.query('SELECT published_at,attempt_count FROM infrastructure.system_outbox_events WHERE event_id=$1', [eventId])).rows[0]).toMatchObject({ attempt_count: 1 });
    const failingId = newLogicalUuid(); await writer.write(asExecutor(pool), { id: failingId, sourceDomain: 'foundation_test', type: 'foundation.fail', aggregateType: 'probe', aggregateId: newLogicalUuid(), payload: {}, headers: {}, occurredAt: new Date(Date.now() - 1_000) });
    await first.runOnce(); const failed = (await pool.query('SELECT attempt_count,last_error,published_at FROM infrastructure.system_outbox_events WHERE event_id=$1', [failingId])).rows[0];
    expect(failed.attempt_count).toBe(1); expect(failed.last_error).toContain('No handler'); expect(failed.published_at).toBeNull();
  });

  it('creates and reads canonical asset metadata and respects uniqueness', async () => {
    const repository = new AssetRepository(asExecutor(pool)); const id = newLogicalUuid();
    await repository.create({ id, storageProvider: 'test', storageBucket: 'bucket', storageKey: 'asset/1', mimeType: 'audio/ogg', sizeBytes: 12n, status: 'pending', metadata: { fixture: true } });
    expect(await repository.findById(id)).toMatchObject({ id, sizeBytes: 12n, status: 'pending' });
    await expect(repository.create({ id: newLogicalUuid(), storageProvider: 'test', storageBucket: 'bucket', storageKey: 'asset/1', mimeType: 'audio/ogg', sizeBytes: 1n, status: 'pending', metadata: {} })).rejects.toMatchObject({ code: '23505' });
    await expect(pool.query(`UPDATE infrastructure.assets SET status='deleted' WHERE id=$1`, [id])).rejects.toMatchObject({ code: '23514' });
  });

  it('is ready only for a complete baseline and does not mutate schema', async () => {
    const before = (await pool.query(`SELECT count(*)::int AS count FROM public.v2_schema_migrations`)).rows[0].count;
    const app = buildApp({ logger, database: asExecutor(pool) });
    expect((await app.inject('/health/ready')).statusCode).toBe(200);
    expect((await pool.query(`SELECT count(*)::int AS count FROM public.v2_schema_migrations`)).rows[0].count).toBe(before);
    await app.close();
  });
});
