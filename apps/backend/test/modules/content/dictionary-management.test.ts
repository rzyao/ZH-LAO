import pino from 'pino';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { registerContentRoutes } from '../../../src/modules/content/http/composition.js';
import type { ContentRepository } from '../../../src/modules/content/application/ports/repositories.js';
import type { StructuredContentRepository } from '../../../src/modules/content/application/ports/structured-content-repository.js';
import { StructuredContent, StructuredContentRevision } from '../../../src/modules/content/domain/structured-content.js';
import { ManageStructuredContentUseCases } from '../../../src/modules/content/application/use-cases/manage-structured-content.js';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { AppError } from '../../../src/errors/app-error.js';
import { FORBIDDEN } from '../../../src/errors/business-codes.js';

describe('Dictionary aggregate management routes', () => {
  it('rejects a missing Word write permission before draft persistence or successful audit', async () => {
    const contentId = '00000000-0000-4000-8000-000000000091';
    const now = new Date('2026-01-01T00:00:00.000Z');
    const content = new StructuredContent({ id: contentId, language: 'zh', contentType: 'zh_word', status: 'active', createdAt: now, updatedAt: now });
    let saved = false;
    let audited = false;
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository: {} as ContentRepository,
      structuredContentRepository: { findContent: async () => content, saveRevision: async () => { saved = true; } } as unknown as StructuredContentRepository,
      authentication: { authenticate: async () => ({ subjectId: contentId as never }) },
      authorizer: { requirePermission: async () => { throw new AppError({ code: FORBIDDEN, message: 'Permission denied', httpStatus: 403 }); } },
      audit: { recordSuccessfulAction: async () => { audited = true; } },
    });
    const response = await app.inject({ method: 'PUT', url: `/api/v1/admin/content/knowledge/${contentId}/meanings`, payload: { expectedLockVersion: 0, meanings: [] } });
    expect(response.json()).toMatchObject({ code: FORBIDDEN });
    expect(saved).toBe(false);
    expect(audited).toBe(false);
    await app.close();
  });

  it('replaces a Word meanings section through the parent Content UUID only', async () => {
    const contentId = '00000000-0000-4000-8000-000000000001';
    const revisionId = '00000000-0000-4000-8000-000000000002';
    const now = new Date('2026-01-01T00:00:00.000Z');
    const content = new StructuredContent({
      id: contentId, language: 'zh', contentType: 'zh_word', status: 'active', createdAt: now, updatedAt: now,
    });
    const revision = new StructuredContentRevision({
      id: revisionId, contentId, revisionNumber: 1, contentType: 'zh_word',
      snapshot: { fields: { simplified: '你好' }, composition: [] },
      status: 'draft', createdByOperatorId: '00000000-0000-4000-8000-000000000003',
      lockVersion: 0, createdAt: now, updatedAt: now,
    });
    const audits: string[] = [];
    const repository = {
      findContent: async () => content,
      findActiveRevision: async () => revision,
      findRevision: async () => revision,
      resolveComposition: async () => [],
      findIdempotencyRecord: async () => null,
      saveIdempotencyRecord: async () => undefined,
      saveRevision: async () => undefined,
    } as unknown as StructuredContentRepository;
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository: {} as ContentRepository,
      structuredContentRepository: repository,
      authentication: { authenticate: async () => ({ subjectId: contentId as never }) },
      authorizer: { requirePermission: async () => ({ operatorId: '00000000-0000-4000-8000-000000000003', authSubjectId: 'subject-1' }) },
      audit: { recordSuccessfulAction: async (input) => { audits.push(input.actionKey); } },
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/content/knowledge/00000000-0000-4000-8000-000000000001/meanings',
      headers: { 'idempotency-key': 'meanings-001' },
      payload: { expectedLockVersion: 0, meanings: [{ language: 'lo', definition: 'ສະບາຍດີ', senseOrder: 1 }] },
    });

    expect(response.json()).toMatchObject({ code: 'OK', data: { status: 'draft', lockVersion: 1 } });
    expect(JSON.stringify(response.json())).not.toMatch(/"id"\s*:\s*\d+/);
    expect(audits).toEqual(['content.zh_words.update_dictionary']);
    const stale = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/content/knowledge/00000000-0000-4000-8000-000000000001/meanings',
      headers: { 'idempotency-key': 'meanings-002' },
      payload: { expectedLockVersion: 0, meanings: [{ language: 'lo', definition: 'ສະບາຍດີ', senseOrder: 1 }] },
    });
    expect(stale.json()).toMatchObject({ code: 'STALE_VERSION_CONFLICT' });
    expect(audits).toEqual(['content.zh_words.update_dictionary']);
    await app.close();
  });

  it('rejects a self-referencing dictionary relation before submit persists anything', async () => {
    const contentId = '00000000-0000-4000-8000-000000000021';
    const now = new Date('2026-01-01T00:00:00.000Z');
    const content = new StructuredContent({
      id: contentId, language: 'lo', contentType: 'lo_word', status: 'active', createdAt: now, updatedAt: now,
    });
    const revision = new StructuredContentRevision({
      id: '00000000-0000-4000-8000-000000000022', contentId, revisionNumber: 1, contentType: 'lo_word',
      snapshot: {
        fields: { text: 'ສະບາຍດີ' },
        composition: [{ contentId: '00000000-0000-4000-8000-000000000023', position: 1 }],
        dictionary: {
          meanings: [], examples: [], equivalents: [],
          relations: [{ targetContentId: contentId, relationType: 'related', sortOrder: 1 }],
          tags: [],
        },
      },
      status: 'draft', createdByOperatorId: null, lockVersion: 0, createdAt: now, updatedAt: now,
    });
    let saved = false;
    const service = new ManageStructuredContentUseCases({
      findContent: async () => content,
      findRevision: async () => revision,
      resolveComposition: async () => [{
        contentId: '00000000-0000-4000-8000-000000000023',
        contentType: 'lo_syllable',
        position: 1,
        publishedRevisionId: '00000000-0000-4000-8000-000000000024',
      }],
      saveRevision: async () => { saved = true; },
    } as unknown as StructuredContentRepository);

    await expect(service.submit(contentId, revision.id)).rejects.toThrow('不允许自引用');
    expect(saved).toBe(false);
  });

  it('keeps a Word draft unchanged when an example target is disabled before submit', async () => {
    const contentId = '00000000-0000-4000-8000-000000000071';
    const targetId = '00000000-0000-4000-8000-000000000072';
    const now = new Date('2026-01-01T00:00:00.000Z');
    const content = new StructuredContent({ id: contentId, language: 'zh', contentType: 'zh_word', status: 'active', createdAt: now, updatedAt: now });
    const disabledSentence = new StructuredContent({ id: targetId, language: 'zh', contentType: 'zh_sentence', status: 'disabled', createdAt: now, updatedAt: now });
    const revision = new StructuredContentRevision({
      id: '00000000-0000-4000-8000-000000000073', contentId, revisionNumber: 1, contentType: 'zh_word',
      snapshot: { fields: { simplified: '你好' }, composition: [{ contentId: '00000000-0000-4000-8000-000000000074', position: 1 }], dictionary: { meanings: [], examples: [{ sentenceContentId: targetId, sortOrder: 1 }], equivalents: [], relations: [], tags: [] } },
      status: 'draft', createdByOperatorId: null, lockVersion: 0, createdAt: now, updatedAt: now,
    });
    let saved = false;
    const service = new ManageStructuredContentUseCases({
      findContent: async (id: string) => id === contentId ? content : id === targetId ? disabledSentence : null,
      findRevision: async () => revision,
      resolveComposition: async () => [{ contentId: '00000000-0000-4000-8000-000000000074', contentType: 'zh_hanzi', position: 1, publishedRevisionId: '00000000-0000-4000-8000-000000000075' }],
      findPublishedRevision: async () => null,
      saveRevision: async () => { saved = true; },
    } as unknown as StructuredContentRepository);
    await expect(service.submit(contentId, revision.id)).rejects.toThrow('尚未正式发布或不可用');
    expect(revision.status).toBe('draft');
    expect(saved).toBe(false);
  });

  it('submits a Word draft only after its legal dictionary target has a published revision', async () => {
    const contentId = '00000000-0000-4000-8000-000000000076';
    const targetId = '00000000-0000-4000-8000-000000000077';
    const now = new Date('2026-01-01T00:00:00.000Z');
    const word = new StructuredContent({ id: contentId, language: 'zh', contentType: 'zh_word', status: 'active', createdAt: now, updatedAt: now });
    const equivalent = new StructuredContent({ id: targetId, language: 'lo', contentType: 'lo_word', status: 'active', createdAt: now, updatedAt: now });
    const revision = new StructuredContentRevision({
      id: '00000000-0000-4000-8000-000000000078', contentId, revisionNumber: 1, contentType: 'zh_word',
      snapshot: { fields: { simplified: '你好' }, composition: [{ contentId: '00000000-0000-4000-8000-000000000079', position: 1 }], dictionary: { meanings: [], examples: [], equivalents: [{ targetContentId: targetId, relationType: 'translation', isPrimary: true }], relations: [], tags: [] } },
      status: 'draft', createdByOperatorId: null, lockVersion: 0, createdAt: now, updatedAt: now,
    });
    let saved = 0;
    const service = new ManageStructuredContentUseCases({
      findContent: async (id: string) => id === contentId ? word : id === targetId ? equivalent : null,
      findRevision: async () => revision,
      resolveComposition: async () => [{ contentId: '00000000-0000-4000-8000-000000000079', contentType: 'zh_hanzi', position: 1, publishedRevisionId: '00000000-0000-4000-8000-000000000080' }],
      findPublishedRevision: async (id: string) => id === targetId ? revision : null,
      saveRevision: async () => { saved += 1; },
    } as unknown as StructuredContentRepository);

    await expect(service.submit(contentId, revision.id)).resolves.toEqual({ status: 'pending_review' });
    expect(revision.status).toBe('pending_review');
    expect(saved).toBe(1);
  });

  it('rejects a missing Word review permission before changing a pending revision or auditing', async () => {
    const contentId = '00000000-0000-4000-8000-000000000084';
    const revisionId = '00000000-0000-4000-8000-000000000085';
    const now = new Date('2026-01-01T00:00:00.000Z');
    const revision = new StructuredContentRevision({
      id: revisionId, contentId, revisionNumber: 1, contentType: 'zh_word', snapshot: { fields: { simplified: '你好' }, composition: [] },
      status: 'pending_review', createdByOperatorId: null, lockVersion: 1, createdAt: now, updatedAt: now,
    });
    let saved = false;
    let audited = false;
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository: {} as ContentRepository,
      structuredContentRepository: { findRevision: async () => revision, saveRevision: async () => { saved = true; } } as unknown as StructuredContentRepository,
      authentication: { authenticate: async () => ({ subjectId: contentId as never }) },
      authorizer: { requirePermission: async () => { throw new AppError({ code: FORBIDDEN, message: 'Permission denied', httpStatus: 403 }); } },
      audit: { recordSuccessfulAction: async () => { audited = true; } },
    });
    const response = await app.inject({
      method: 'POST', url: `/api/v1/admin/content/zh/words/${contentId}/revisions/${revisionId}/review`,
      headers: { 'idempotency-key': 'review-denied-001' }, payload: { action: 'approve' },
    });
    expect(response.json()).toMatchObject({ code: FORBIDDEN });
    expect(revision.status).toBe('pending_review');
    expect(saved).toBe(false);
    expect(audited).toBe(false);
    await app.close();
  });

  it('rejects a blank review remark without changing a pending dictionary revision', async () => {
    const contentId = '00000000-0000-4000-8000-000000000081';
    const now = new Date('2026-01-01T00:00:00.000Z');
    const revision = new StructuredContentRevision({
      id: '00000000-0000-4000-8000-000000000082', contentId, revisionNumber: 1, contentType: 'zh_word',
      snapshot: { fields: { simplified: '你好' }, composition: [] }, status: 'pending_review', createdByOperatorId: null,
      lockVersion: 1, createdAt: now, updatedAt: now,
    });
    let saved = false;
    const service = new ManageStructuredContentUseCases({
      findRevision: async () => revision,
      saveRevision: async () => { saved = true; },
    } as unknown as StructuredContentRepository);
    await expect(service.review(contentId, revision.id, 'reject', '00000000-0000-4000-8000-000000000083', '   ')).rejects.toThrow('驳回原因不能为空');
    expect(revision.status).toBe('pending_review');
    expect(saved).toBe(false);
  });

  it('keeps a committed publish when Operations audit fails and tells the operator to refresh', async () => {
    const contentId = '00000000-0000-4000-8000-000000000041';
    const revisionId = '00000000-0000-4000-8000-000000000042';
    const now = new Date('2026-01-01T00:00:00.000Z');
    const content = new StructuredContent({ id: contentId, language: 'zh', contentType: 'zh_word', status: 'active', createdAt: now, updatedAt: now });
    const revision = new StructuredContentRevision({
      id: revisionId, contentId, revisionNumber: 1, contentType: 'zh_word',
      snapshot: { fields: { simplified: '你好' }, composition: [{ contentId: '00000000-0000-4000-8000-000000000043', position: 1 }] },
      status: 'approved', createdByOperatorId: null, lockVersion: 0, createdAt: now, updatedAt: now,
    });
    let publishCount = 0;
    let idempotencyRecord: { requestHash: string; response: Record<string, unknown> } | null = null;
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository: {} as ContentRepository,
      structuredContentRepository: {
        findContent: async () => content,
        findRevision: async () => revision,
        findPublishedRevision: async () => null,
        resolveComposition: async () => [{ contentId: '00000000-0000-4000-8000-000000000043', contentType: 'zh_hanzi', position: 1, publishedRevisionId: '00000000-0000-4000-8000-000000000044' }],
        publishAtomic: async () => { publishCount += 1; },
        findIdempotencyRecord: async () => idempotencyRecord,
        saveIdempotencyRecord: async (_operatorId: string, _key: string, requestHash: string, response: Record<string, unknown>) => { idempotencyRecord = { requestHash, response }; },
      } as unknown as StructuredContentRepository,
      authentication: { authenticate: async () => ({ subjectId: contentId as never }) },
      authorizer: { requirePermission: async () => ({ operatorId: '00000000-0000-4000-8000-000000000045', authSubjectId: 'subject-1' }) },
      audit: { recordSuccessfulAction: async () => { throw new Error('audit unavailable'); } },
    });
    const response = await app.inject({ method: 'POST', url: '/api/v1/admin/content/zh/words/' + contentId + '/revisions/' + revisionId + '/publish', headers: { 'idempotency-key': 'publish-001' } });
    expect(response.json()).toMatchObject({ code: 'INTERNAL_ERROR', error: { message: 'Content publish may already be committed; refresh before retrying.' } });
    expect(publishCount).toBe(1);
    const replay = await app.inject({ method: 'POST', url: '/api/v1/admin/content/zh/words/' + contentId + '/revisions/' + revisionId + '/publish', headers: { 'idempotency-key': 'publish-001' } });
    expect(replay.json()).toMatchObject({ code: 'INTERNAL_ERROR', error: { message: 'Content publish may already be committed; refresh before retrying.' } });
    expect(publishCount).toBe(1);
    await app.close();
  });

  it('replays a successful publish response without a second Content action or audit', async () => {
    const contentId = '00000000-0000-4000-8000-000000000051';
    const revisionId = '00000000-0000-4000-8000-000000000052';
    let audited = false;
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    const url = '/api/v1/admin/content/zh/words/' + contentId + '/revisions/' + revisionId + '/publish';
    const requestHash = createHash('sha256').update(JSON.stringify({ body: null, method: 'POST', operation: 'publish', url })).digest('hex');
    await registerContentRoutes(app, {
      contentRepository: {} as ContentRepository,
      structuredContentRepository: {
        findIdempotencyRecord: async () => ({ requestHash, response: { status: 'published' } }),
      } as unknown as StructuredContentRepository,
      authentication: { authenticate: async () => ({ subjectId: contentId as never }) },
      authorizer: { requirePermission: async () => ({ operatorId: '00000000-0000-4000-8000-000000000053', authSubjectId: 'subject-1' }) },
      audit: { recordSuccessfulAction: async () => { audited = true; } },
    });
    const response = await app.inject({ method: 'POST', url, headers: { 'idempotency-key': 'publish-replay-001' } });
    expect(response.json()).toMatchObject({ code: 'OK', data: { status: 'published' } });
    await app.close();
    expect(audited).toBe(false);
  });
});
