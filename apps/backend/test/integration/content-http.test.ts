import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/bootstrap/build-app.js';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import type { DatabaseExecutor } from '../../src/database/executor.js';
import { parseLogicalUuid } from '../../src/ids/uuid.js';
import { registerContentRoutes } from '../../src/modules/content/http/composition.js';
import { PostgresContentRepository, PostgresStructuredContentRepository } from '../../src/modules/content/infrastructure/index.js';
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

  it('完整发布中老两条专用组成链路，并阻止未发布或跨语言依赖', async () => {
    const operatorId = '22222222-2222-4222-8222-222222222222';
    const app = buildApp({ logger: pino({ level: 'silent' }), database: executor });
    await registerContentRoutes(app, {
      contentRepository: new PostgresContentRepository(executor),
      structuredContentRepository: new PostgresStructuredContentRepository(executor),
      authentication: { authenticate: async () => ({ subjectId: parseLogicalUuid(operatorId) }) },
      authorizer: { requirePermission: async () => ({ operatorId, authSubjectId: operatorId }) },
      audit: { recordSuccessfulAction: async () => undefined },
    });

    const create = async (path: string, snapshot: Record<string, unknown>) => {
      const response = await app.inject({ method: 'POST', url: `/api/v1/admin/content/${path}`, payload: { snapshot } });
      expect(response.json()).toMatchObject({ code: 'OK', data: { status: 'draft' } });
      return (response.json() as { data: { contentId: string; revisionId: string } }).data;
    };
    let idempotencySequence = 0;
    const commandHeaders = () => ({ 'idempotency-key': `content-http-${++idempotencySequence}` });
    const advance = async (path: string, item: { contentId: string; revisionId: string }) => {
      const base = `/api/v1/admin/content/${path}/${item.contentId}/revisions/${item.revisionId}`;
      expect((await app.inject({ method: 'POST', url: `${base}/submit`, headers: commandHeaders() })).json()).toMatchObject({ code: 'OK', data: { status: 'pending_review' } });
      expect((await app.inject({ method: 'POST', url: `${base}/review`, payload: { action: 'approve' }, headers: commandHeaders() })).json()).toMatchObject({ code: 'OK', data: { status: 'approved' } });
      expect((await app.inject({ method: 'POST', url: `${base}/publish`, headers: commandHeaders() })).json()).toMatchObject({ code: 'OK', data: { status: 'published' } });
    };

    const publishedPinyin = await create('zh/pinyin-elements', {
      fields: { elementType: 'initial', value: 'm', displayForm: 'm', sortOrder: 1 },
      composition: [],
    });
    await advance('zh/pinyin-elements', publishedPinyin);

    const syllable = await create('zh/syllables', {
      fields: { baseForm: 'ma', tone: 1, displayForm: 'mā' },
      composition: [{ contentId: publishedPinyin.contentId, position: 1, role: 'initial' }],
    });
    await advance('zh/syllables', syllable);

    const materialized = await executor.query<{ display_form: string; positions: string }>(
      `SELECT s.display_form, string_agg(c.position::text, ',' ORDER BY c.position) AS positions
         FROM content.zh_syllables s
         JOIN content.zh_syllable_pinyin_elements c ON c.syllable_content_id = s.content_id
        JOIN content.contents root ON root.id = s.content_id
        WHERE root.public_id = $1
        GROUP BY s.display_form`,
      [syllable.contentId],
    );
    expect(materialized.rows[0]).toEqual({ display_form: 'mā', positions: '1' });

    const hanzi = await create('zh/hanzi', {
      fields: { character: '妈', traditionalCharacter: '媽', strokeCount: 6, radical: '女' },
      composition: [{ contentId: syllable.contentId, position: 1, surfaceForm: '常用读音' }],
    });
    await advance('zh/hanzi', hanzi);
    const chineseWord = await create('zh/words', {
      fields: { simplified: '妈妈', traditional: '媽媽', pinyinText: 'mā ma', wordClass: '名词', difficultyLevel: 1 },
      composition: [
        { contentId: hanzi.contentId, position: 1 },
        { contentId: hanzi.contentId, position: 2 },
      ],
    });
    await advance('zh/words', chineseWord);
    const chineseSentence = await create('zh/sentences', {
      fields: { text: '妈妈来了。', pinyinText: 'mā ma lái le', difficultyLevel: 1 },
      composition: [{ contentId: chineseWord.contentId, position: 1, surfaceForm: '妈妈' }],
    });
    await advance('zh/sentences', chineseSentence);

    const unpublishedPinyin = await create('zh/pinyin-elements', {
      fields: { elementType: 'final', value: 'a', displayForm: 'a', sortOrder: 2 },
      composition: [],
    });
    const updatedDraft = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/content/zh/pinyin-elements/${unpublishedPinyin.contentId}/revisions/${unpublishedPinyin.revisionId}`,
      payload: { expectedLockVersion: 0, snapshot: { fields: { elementType: 'final', value: 'a', displayForm: 'a', sortOrder: 3 }, composition: [] } },
    });
    expect(updatedDraft.json()).toMatchObject({ code: 'OK', data: { status: 'draft', lockVersion: 1 } });
    const staleDraft = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/content/zh/pinyin-elements/${unpublishedPinyin.contentId}/revisions/${unpublishedPinyin.revisionId}`,
      payload: { expectedLockVersion: 0, snapshot: { fields: { elementType: 'final', value: 'a', displayForm: 'á', sortOrder: 4 }, composition: [] } },
    });
    expect(staleDraft.json()).toMatchObject({ code: 'STALE_VERSION_CONFLICT' });
    const blockedSyllable = await create('zh/syllables', {
      fields: { baseForm: 'ba', tone: 1, displayForm: 'bā' },
      composition: [{ contentId: unpublishedPinyin.contentId, position: 1, role: 'final' }],
    });
    const blocked = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/content/zh/syllables/${blockedSyllable.contentId}/revisions/${blockedSyllable.revisionId}/submit`,
      headers: commandHeaders(),
    });
    expect(blocked.json()).toMatchObject({ code: 'INVALID_DATA' });
    expect(JSON.stringify(blocked.json())).toContain(unpublishedPinyin.contentId);

    const laoLetter = await create('lo/letters', {
      fields: { character: 'ຂ', letterType: 'consonant', letterClass: 'cons_high', name: 'kho', romanization: 'kh', sortOrder: 2 },
      composition: [],
    });
    const crossLanguage = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/content/zh/syllables',
      payload: {
        snapshot: {
          fields: { baseForm: 'ka', tone: 1, displayForm: 'kā' },
          composition: [{ contentId: laoLetter.contentId, position: 1 }],
        },
      },
    });
    expect(crossLanguage.json()).toMatchObject({ code: 'INVALID_DATA' });
    expect(JSON.stringify(crossLanguage.json())).toContain('只能引用中文拼音元素');

    await advance('lo/letters', laoLetter);
    const laoSyllable = await create('lo/syllables', {
      fields: { text: 'ຂາ', romanization: 'khaa', tone: 5, pronunciationKey: 'khaa5', difficultyLevel: 1 },
      composition: [{ contentId: laoLetter.contentId, position: 1, role: 'initial' }],
    });
    await advance('lo/syllables', laoSyllable);
    const laoWord = await create('lo/words', {
      fields: { text: 'ຂາ', romanization: 'khaa', wordClass: '名词', difficultyLevel: 1 },
      composition: [{ contentId: laoSyllable.contentId, position: 1 }],
    });
    await advance('lo/words', laoWord);
    const laoSentence = await create('lo/sentences', {
      fields: { text: 'ຂາດີ', romanization: 'khaa dii', difficultyLevel: 1 },
      composition: [{ contentId: laoWord.contentId, position: 1, surfaceForm: 'ຂາ' }],
    });
    await advance('lo/sentences', laoSentence);

    const chainCounts = await executor.query<{ zh_hanzi: string; zh_words: string; zh_sentences: string; lo_letters: string; lo_syllables: string; lo_words: string; lo_sentences: string }>(
      `SELECT
        (SELECT count(*) FROM content.zh_hanzi_syllables)::text AS zh_hanzi,
        (SELECT count(*) FROM content.zh_word_hanzi)::text AS zh_words,
        (SELECT count(*) FROM content.zh_sentence_words)::text AS zh_sentences,
        (SELECT count(*) FROM content.lo_letters WHERE character = 'ຂ')::text AS lo_letters,
        (SELECT count(*) FROM content.lo_syllable_letters)::text AS lo_syllables,
        (SELECT count(*) FROM content.lo_word_syllables)::text AS lo_words,
        (SELECT count(*) FROM content.lo_sentence_words)::text AS lo_sentences`,
    );
    expect(chainCounts.rows[0]).toEqual({
      zh_hanzi: '1', zh_words: '2', zh_sentences: '1',
      lo_letters: '1', lo_syllables: '1', lo_words: '1', lo_sentences: '1',
    });

    const history = await app.inject({ method: 'GET', url: `/api/v1/admin/content/zh/sentences/${chineseSentence.contentId}/history` });
    expect(history.json()).toMatchObject({ code: 'OK', data: { total: 1, items: [{ revisionNumber: 1, status: 'published' }] } });
    const references = await app.inject({ method: 'GET', url: `/api/v1/admin/content/zh/hanzi/${hanzi.contentId}/references` });
    if ((references.json() as { code: string }).code !== 'OK') throw new Error(JSON.stringify(references.json()));
    expect(references.json()).toMatchObject({
      code: 'OK',
      data: { total: 2, items: [
        { contentId: chineseWord.contentId, contentType: 'zh_word', position: 1 },
        { contentId: chineseWord.contentId, contentType: 'zh_word', position: 2 },
      ] },
    });

    const rejected = await create('zh/pinyin-elements', {
      fields: { elementType: 'other', value: 'ü', displayForm: 'ü', sortOrder: 9 },
      composition: [],
    });
    const rejectedBase = `/api/v1/admin/content/zh/pinyin-elements/${rejected.contentId}/revisions/${rejected.revisionId}`;
    await app.inject({ method: 'POST', url: `${rejectedBase}/submit`, headers: commandHeaders() });
    expect((await app.inject({ method: 'POST', url: `${rejectedBase}/review`, payload: { action: 'reject', remark: '展示形式需要修订' }, headers: commandHeaders() })).json()).toMatchObject({ code: 'OK', data: { status: 'rejected' } });
    expect((await app.inject({ method: 'POST', url: `${rejectedBase}/re-edit` })).json()).toMatchObject({ code: 'OK', data: { status: 'draft' } });

    await app.close();
  });
});
