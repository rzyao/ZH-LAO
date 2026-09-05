import crypto from 'node:crypto';
import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { PostgresContentAudioSourceReader } from '../../src/modules/content/infrastructure/postgres-content-audio-source-reader.js';
import { ContentPublicQueryService, type AudioEligibleContentEntityType } from '../../src/modules/content/public/content-public-queries.js';
import { TransactionManager } from '../../src/database/transaction-manager.js';
import { StructuredContent, StructuredContentRevision } from '../../src/modules/content/domain/structured-content.js';
import { PostgresStructuredContentRepository } from '../../src/modules/content/infrastructure/postgres-structured-content-repository.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const cases: readonly [AudioEligibleContentEntityType, 'zh' | 'lo', string, string][] = [
  ['lo_letter', 'lo', 'ກ', 'pronunciation'], ['lo_syllable', 'lo', 'ກາ', 'pronunciation'], ['lo_word', 'lo', 'ຄຳ', 'pronunciation'], ['lo_sentence', 'lo', 'ສະບາຍດີ', 'pronunciation'], ['zh_pinyin_element', 'zh', 'mā', 'tone_1'], ['zh_syllable', 'zh', 'mā', 'tone_1'],
];
integration('Content audio public queries on PostgreSQL', () => {
  let database: TestDatabase; let pool: pg.Pool; let queries: ContentPublicQueryService;
  beforeAll(async () => { database = await createTestDatabase(adminUrl!); pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 4, connectionTimeoutMs: 2_000, idleTimeoutMs: 2_000 }, pino({ level: 'silent' })); queries = new ContentPublicQueryService(new PostgresContentAudioSourceReader(asExecutor(pool))); }, 120_000);
  afterAll(async () => { await pool?.end(); await database?.dispose(); });
  it.each(cases)('resolves and validates %s', async (type, language, text, role) => {
    const entityId = crypto.randomUUID(); const revisionId = crypto.randomUUID();
    const inserted = await pool.query<{ id: string }>('INSERT INTO content.contents(public_id,language,content_type) VALUES($1,$2,$3) RETURNING id', [entityId, language, type]); const id = inserted.rows[0]!.id;
    const sql: Record<AudioEligibleContentEntityType, string> = { lo_letter: 'INSERT INTO content.lo_letters(content_id,character,letter_type,name) VALUES($1,$2,$3,$2)', lo_syllable: 'INSERT INTO content.lo_syllables(content_id,text) VALUES($1,$2)', lo_word: 'INSERT INTO content.lo_words(content_id,text) VALUES($1,$2)', lo_sentence: 'INSERT INTO content.lo_sentences(content_id,text) VALUES($1,$2)', zh_pinyin_element: 'INSERT INTO content.zh_pinyin_elements(content_id,value,element_type,display_form) VALUES($1,$2,$3,$2)', zh_syllable: 'INSERT INTO content.zh_syllables(content_id,base_form,tone,display_form) VALUES($1,$2,$3,$2)' };
    const values = type === 'lo_letter' ? [id, text, 'consonant'] : type === 'zh_pinyin_element' ? [id, text, 'final'] : type === 'zh_syllable' ? [id, text, 1] : [id, text]; await pool.query(sql[type], values);
    await pool.query(`INSERT INTO content.content_revisions(revision_public_id,entity_type,entity_id,revision_number,status,snapshot,published_at) VALUES($1,'content',$2,1,'published',$3::jsonb,now())`, [revisionId, entityId, JSON.stringify({ audio: { pronunciation: { source: 'canonical', value: text } } })]);
    expect(await queries.resolveRevision(revisionId)).toMatchObject({ entityType: type, entityId, textSnapshot: text });
    expect(await queries.resolveCurrentPublishedRevision(type, entityId)).toMatchObject({ revisionId });
    await expect(queries.validateAudioSource({ entityType: type, entityId, revisionId, languageCode: language, audioRole: role })).resolves.toMatchObject({ entityType: type, textSnapshot: text });
  });

  it('publishes tonal syllables and Audio requirements atomically, and reads immutable revision fields', async () => {
    const now = new Date(); const entityId = crypto.randomUUID(); const revisionId = crypto.randomUUID();
    const repository = new PostgresStructuredContentRepository(asExecutor(pool), new TransactionManager(pool, pino({ level: 'silent' })));
    const content = new StructuredContent({ id: entityId, language: 'zh', contentType: 'zh_syllable', status: 'active', createdAt: now, updatedAt: now });
    const revision = new StructuredContentRevision({ id: revisionId, contentId: entityId, revisionNumber: 1, contentType: 'zh_syllable', status: 'approved', createdByOperatorId: null, lockVersion: 0, createdAt: now, updatedAt: now, snapshot: { fields: { baseForm: 'ba', tone: 2, displayForm: 'bá' }, composition: [] } });
    await repository.saveNew(content, revision); revision.publish(now);
    await pool.query("ALTER TABLE infrastructure.system_outbox_events ADD CONSTRAINT merge_test_reject_outbox CHECK (false) NOT VALID");
    try {
      await expect(repository.publishAtomic(content, revision, null)).rejects.toThrow();
      expect(await repository.findRevision(revisionId)).toMatchObject({ status: 'approved', lockVersion: 0 });
      expect((await pool.query('SELECT 1 FROM content.zh_syllables s JOIN content.contents c ON c.id=s.content_id WHERE c.public_id=$1', [entityId])).rowCount).toBe(0);
    } finally {
      await pool.query('ALTER TABLE infrastructure.system_outbox_events DROP CONSTRAINT merge_test_reject_outbox');
    }
    await repository.publishAtomic(content, revision, null);
    const events = (await pool.query('SELECT payload FROM infrastructure.system_outbox_events WHERE aggregate_id=$1', [entityId])).rows;
    expect(events.map((row) => row.payload.audioRole).sort()).toEqual(['tone_1', 'tone_2', 'tone_3', 'tone_4']);
    expect(events.every((row) => row.payload.entityType === 'zh_syllable' && row.payload.revisionId === revisionId)).toBe(true);
    await pool.query("UPDATE content.zh_syllables SET display_form='changed' WHERE content_id=(SELECT id FROM content.contents WHERE public_id=$1)", [entityId]);
    await expect(queries.validateAudioSource({ entityType: 'zh_syllable', entityId, revisionId, languageCode: 'zh', audioRole: 'tone_2' })).resolves.toMatchObject({ textSnapshot: 'bá', pronunciationSnapshot: { tone: 2 } });
  });
});
