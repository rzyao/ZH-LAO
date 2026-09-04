import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/bootstrap/build-app.js';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import type { DatabaseExecutor } from '../../src/database/executor.js';
import { parseLogicalUuid } from '../../src/ids/uuid.js';
import { registerContentRoutes } from '../../src/modules/content/http/composition.js';
import { PostgresContentRepository } from '../../src/modules/content/infrastructure/index.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;

integration('Content HTTP route integration', () => {
  let database: TestDatabase;
  let pool: pg.Pool;
  let executor: DatabaseExecutor;

  beforeAll(async () => {
    database = await createTestDatabase(adminUrl!);
    pool = createPgPool(
      { url: database.url, poolMin: 0, poolMax: 4, connectionTimeoutMs: 2_000, idleTimeoutMs: 2_000 },
      pino({ level: 'silent' }),
    );
    executor = asExecutor(pool);
  }, 120_000);

  afterAll(async () => {
    await pool?.end();
    await database?.dispose();
  }, 30_000);

  it('serves the mounted public alphabet endpoint against PostgreSQL', async () => {
    const app = buildApp({ logger: pino({ level: 'silent' }), database: executor });
    await registerContentRoutes(app, {
      contentRepository: new PostgresContentRepository(executor),
      authentication: { authenticate: async () => null },
      authorizer: { requirePermission: async () => ({ operatorId: 'operator-1', authSubjectId: 'subject-1' }) },
      audit: { recordSuccessfulAction: async () => undefined },
    });

    const response = await app.inject({ method: 'GET', url: '/api/v1/content/letters' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'OK', data: { items: [] } });
    await app.close();
  });

  it('persists the complete draft-review-publish workflow through mounted management endpoints', async () => {
    const operatorId = '11111111-1111-4111-8111-111111111111';
    const app = buildApp({ logger: pino({ level: 'silent' }), database: executor });
    await registerContentRoutes(app, {
      contentRepository: new PostgresContentRepository(executor),
      authentication: { authenticate: async () => ({ subjectId: parseLogicalUuid(operatorId) }) },
      authorizer: { requirePermission: async () => ({ operatorId, authSubjectId: operatorId }) },
      audit: { recordSuccessfulAction: async () => undefined },
    });

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/content/letters',
      payload: { unicodeChar: 'ກ', classification: 'consonant', subtype: 'cons_middle', ipaPhonetic: 'k', description: 'ko', sortOrder: 1 },
    });
    expect(created.statusCode).toBe(200);
    const createdData = (created.json() as { data: { characterId: string; revisionId: string } }).data;
    expect(await new PostgresContentRepository(executor).findRevisionById(createdData.revisionId)).toMatchObject({
      id: createdData.revisionId,
      characterId: createdData.characterId,
      reviewStatus: 'draft',
    });

    const submitted = await app.inject({ method: 'POST', url: `/api/v1/admin/content/letters/${createdData.characterId}/revisions/${createdData.revisionId}/submit` });
    expect(submitted.json()).toMatchObject({ code: 'OK', data: { status: 'pending_review' } });
    const approved = await app.inject({ method: 'POST', url: `/api/v1/admin/content/letters/${createdData.characterId}/revisions/${createdData.revisionId}/review`, payload: { action: 'approve' } });
    expect(approved.json()).toMatchObject({ code: 'OK', data: { status: 'approved' } });
    const published = await app.inject({ method: 'POST', url: `/api/v1/admin/content/letters/${createdData.characterId}/revisions/${createdData.revisionId}/publish` });
    expect(published.json()).toMatchObject({ code: 'OK', data: { status: 'published' } });
    expect(await new PostgresContentRepository(executor).findRevisionById(createdData.revisionId)).toMatchObject({
      reviewStatus: 'published',
      reviewedByOperatorId: operatorId,
      reviewedAt: expect.any(Date),
    });
    await app.close();
  });
});
