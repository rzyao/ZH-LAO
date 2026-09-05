import { randomUUID } from 'node:crypto';
import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { StructuredContent, StructuredContentRevision } from '../../src/modules/content/domain/structured-content.js';
import { PostgresStructuredContentRepository } from '../../src/modules/content/infrastructure/postgres-structured-content-repository.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const logger = pino({ level: 'silent' });

integration('Dictionary PostgreSQL transaction boundary', () => {
  let database: TestDatabase;
  let pool: pg.Pool;

  async function publishWord(repository: PostgresStructuredContentRepository, display: string): Promise<{ contentId: string; revisionId: string }> {
    const now = new Date();
    const contentId = randomUUID();
    const revisionId = randomUUID();
    const content = new StructuredContent({ id: contentId, language: 'zh', contentType: 'zh_word', status: 'active', createdAt: now, updatedAt: now });
    const revision = new StructuredContentRevision({
      id: revisionId, contentId, revisionNumber: 1, contentType: 'zh_word', status: 'approved', createdByOperatorId: null,
      lockVersion: 0, createdAt: now, updatedAt: now,
      snapshot: { fields: { simplified: display }, composition: [], dictionary: { meanings: [], examples: [], equivalents: [], relations: [], tags: [] } },
    });
    await repository.saveNew(content, revision);
    revision.publish(now);
    await repository.publishAtomic(content, revision, null);
    return { contentId, revisionId };
  }

  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 3, connectionTimeoutMs: 2_000, idleTimeoutMs: 2_000 }, logger);
  }, 120_000);

  afterAll(async () => {
    await pool?.end();
    await database?.dispose();
  }, 30_000);

  it('rolls back a Content publish when dictionary materialization fails', async () => {
    const executor = asExecutor(pool);
    const repository = new PostgresStructuredContentRepository(executor, new TransactionManager(pool, logger));
    const now = new Date();
    const contentId = randomUUID();
    const revisionId = randomUUID();
    const content = new StructuredContent({
      id: contentId, language: 'zh', contentType: 'zh_word', status: 'active', createdAt: now, updatedAt: now,
    });
    const revision = new StructuredContentRevision({
      id: revisionId,
      contentId,
      revisionNumber: 1,
      contentType: 'zh_word',
      status: 'approved',
      createdByOperatorId: null,
      lockVersion: 0,
      createdAt: now,
      updatedAt: now,
      snapshot: {
        fields: { simplified: '回滚验证' },
        composition: [],
        dictionary: {
          meanings: [],
          examples: [{ sentenceContentId: randomUUID(), sortOrder: 1 }],
          equivalents: [],
          relations: [],
          tags: [],
        },
      },
    });
    await repository.saveNew(content, revision);
    revision.publish(now);

    await expect(repository.publishAtomic(content, revision, null)).rejects.toThrow('词典目标不存在');

    const persistedRevision = await repository.findRevision(revisionId);
    expect(persistedRevision).toMatchObject({ status: 'approved', lockVersion: 0 });
    const words = await executor.query<{ count: string }>(
      `SELECT count(*)::text AS count
         FROM content.zh_words word
         JOIN content.contents root ON root.id = word.content_id
        WHERE root.public_id = $1`,
      [contentId],
    );
    expect(words.rows[0]).toEqual({ count: '0' });
    expect(await repository.findPublishedDictionaryWordById(contentId)).toBeNull();
  });

  it('exposes only an active Word with a published revision, then hides it when disabled', async () => {
    const executor = asExecutor(pool);
    const repository = new PostgresStructuredContentRepository(executor, new TransactionManager(pool, logger));
    const now = new Date();
    const contentId = randomUUID();
    const revisionId = randomUUID();
    const content = new StructuredContent({
      id: contentId, language: 'zh', contentType: 'zh_word', status: 'active', createdAt: now, updatedAt: now,
    });
    const revision = new StructuredContentRevision({
      id: revisionId,
      contentId,
      revisionNumber: 1,
      contentType: 'zh_word',
      status: 'approved',
      createdByOperatorId: null,
      lockVersion: 0,
      createdAt: now,
      updatedAt: now,
      snapshot: {
        fields: { simplified: '公开验证', pinyinText: 'gōng kāi' },
        composition: [],
        dictionary: {
          meanings: [{ language: 'zh', definition: '可公开查询的词典事实', senseOrder: 1 }],
          examples: [], equivalents: [], relations: [], tags: [{ code: 'test-public', name: '公开测试' }],
        },
      },
    });
    await repository.saveNew(content, revision);
    revision.publish(now);
    await repository.publishAtomic(content, revision, null);

    expect(await repository.findPublishedDictionaryWord('zh', '公开验证')).toMatchObject({
      id: contentId,
      revisionId,
      display: '公开验证',
    });
    expect(await repository.findPublishedDictionaryWordById(contentId)).toMatchObject({
      id: contentId,
      revisionId,
      display: '公开验证',
      meanings: [{ language: 'zh', definition: '可公开查询的词典事实', senseOrder: 1 }],
      tags: [{ code: 'test-public', name: '公开测试' }],
    });
    expect(await repository.searchPublishedDictionaryWords('zh', '公开', 10)).toMatchObject([{ id: contentId }]);

    await executor.query("UPDATE content.contents SET status = 'disabled' WHERE public_id = $1", [contentId]);
    expect(await repository.findPublishedDictionaryWord('zh', '公开验证')).toBeNull();
    expect(await repository.findPublishedDictionaryWordById(contentId)).toBeNull();
    expect(await repository.searchPublishedDictionaryWords('zh', '公开', 10)).toEqual([]);
  });

  it('keeps search pagination stable without repeating the previous page', async () => {
    const repository = new PostgresStructuredContentRepository(asExecutor(pool), new TransactionManager(pool, logger));
    await Promise.all(['游标甲', '游标乙', '游标丙'].map((display) => publishWord(repository, display)));

    const first = await repository.searchPublishedDictionaryWords('zh', '游标', 2);
    const repeated = await repository.searchPublishedDictionaryWords('zh', '游标', 2);
    expect(first).toHaveLength(2);
    expect(repeated.map((item) => item.id)).toEqual(first.map((item) => item.id));
    const last = first[1]!;
    const second = await repository.searchPublishedDictionaryWords('zh', '游标', 2, {
      tier: last.searchOrder!.tier, similarity: last.searchOrder!.similarity, display: last.display, id: last.id,
    });
    expect(second).toHaveLength(1);
    expect(new Set([...first, ...second].map((item) => item.id))).toHaveLength(3);
  });

  it('does not expose draft, rejected, or archived dictionary parents', async () => {
    const executor = asExecutor(pool);
    const repository = new PostgresStructuredContentRepository(executor, new TransactionManager(pool, logger));
    for (const status of ['draft', 'rejected'] as const) {
      const now = new Date();
      const contentId = randomUUID();
      const content = new StructuredContent({ id: contentId, language: 'zh', contentType: 'zh_word', status: 'active', createdAt: now, updatedAt: now });
      const revision = new StructuredContentRevision({
        id: randomUUID(), contentId, revisionNumber: 1, contentType: 'zh_word', status: status === 'rejected' ? 'pending_review' : status, createdByOperatorId: null,
        lockVersion: 0, createdAt: now, updatedAt: now, snapshot: { fields: { simplified: `不可见-${status}` }, composition: [] },
      });
      if (status === 'rejected') revision.reject(randomUUID(), '测试驳回');
      await repository.saveNew(content, revision);
      await executor.query(
        `INSERT INTO content.zh_words (content_id, simplified) SELECT id, $2 FROM content.contents WHERE public_id = $1`,
        [contentId, `不可见-${status}`],
      );
      expect(await repository.findPublishedDictionaryWord('zh', `不可见-${status}`)).toBeNull();
    }
    const archived = await publishWord(repository, '不可见-archived');
    await executor.query("UPDATE content.contents SET status = 'archived' WHERE public_id = $1", [archived.contentId]);
    expect(await repository.findPublishedDictionaryWord('zh', '不可见-archived')).toBeNull();
    expect(await repository.findPublishedDictionaryWordById(archived.contentId)).toBeNull();
  });

  it('removes a dictionary equivalent from the public projection when its published target becomes disabled', async () => {
    const executor = asExecutor(pool);
    const repository = new PostgresStructuredContentRepository(executor, new TransactionManager(pool, logger));
    const target = await publishWord(repository, '失效目标');
    const now = new Date();
    const contentId = randomUUID();
    const revisionId = randomUUID();
    const content = new StructuredContent({ id: contentId, language: 'lo', contentType: 'lo_word', status: 'active', createdAt: now, updatedAt: now });
    const revision = new StructuredContentRevision({
      id: revisionId, contentId, revisionNumber: 1, contentType: 'lo_word', status: 'approved', createdByOperatorId: null,
      lockVersion: 0, createdAt: now, updatedAt: now,
      snapshot: { fields: { text: 'ຄຳຫຼັກ' }, composition: [], dictionary: { meanings: [], examples: [], equivalents: [{ targetContentId: target.contentId, relationType: 'translation', isPrimary: true }], relations: [], tags: [] } },
    });
    await repository.saveNew(content, revision);
    revision.publish(now);
    await repository.publishAtomic(content, revision, null);
    expect(await repository.findPublishedDictionaryWordById(contentId)).toMatchObject({ equivalents: [{ targetContentId: target.contentId }] });

    await executor.query("UPDATE content.contents SET status = 'disabled' WHERE public_id = $1", [target.contentId]);
    expect(await repository.findPublishedDictionaryWordById(contentId)).toMatchObject({ equivalents: [] });
  });
});
