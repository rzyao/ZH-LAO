import crypto from 'node:crypto';
import pg from 'pg';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asExecutor, createPgPool } from '../../src/database/pool.js';
import { PostgresContentAudioSourceReader } from '../../src/modules/content/infrastructure/postgres-content-audio-source-reader.js';
import { ContentPublicQueryService, type AudioEligibleContentEntityType } from '../../src/modules/content/public/content-public-queries.js';
import { createTestDatabase, type TestDatabase } from '../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const integration = adminUrl ? describe : describe.skip;
const cases: readonly [AudioEligibleContentEntityType, 'zh' | 'lo', string, string][] = [
  ['lo_letter', 'lo', 'ກ', 'pronunciation'], ['lo_syllable', 'lo', 'ກາ', 'pronunciation'], ['lo_word', 'lo', 'ຄຳ', 'pronunciation'], ['lo_sentence', 'lo', 'ສະບາຍດີ', 'pronunciation'], ['zh_pinyin', 'zh', 'mā', 'tone_1'], ['zh_syllable', 'zh', 'ma', 'tone_1'],
];
integration('Content audio public queries on PostgreSQL', () => {
  let database: TestDatabase; let pool: pg.Pool; let queries: ContentPublicQueryService;
  beforeAll(async () => { database = await createTestDatabase(adminUrl!); pool = createPgPool({ url: database.url, poolMin: 0, poolMax: 4, connectionTimeoutMs: 2_000, idleTimeoutMs: 2_000 }, pino({ level: 'silent' })); queries = new ContentPublicQueryService(new PostgresContentAudioSourceReader(asExecutor(pool))); }, 120_000);
  afterAll(async () => { await pool?.end(); await database?.dispose(); });
  it.each(cases)('resolves and validates %s', async (type, language, text, role) => {
    const entityId = crypto.randomUUID(); const revisionId = crypto.randomUUID();
    const inserted = await pool.query<{ id: string }>('INSERT INTO content.contents(public_id,language,content_type) VALUES($1,$2,$3) RETURNING id', [entityId, language, type]); const id = inserted.rows[0]!.id;
    const sql: Record<AudioEligibleContentEntityType, string> = { lo_letter: 'INSERT INTO content.lo_letters(content_id,character,letter_type,name) VALUES($1,$2,$3,$2)', lo_syllable: 'INSERT INTO content.lo_syllables(content_id,text) VALUES($1,$2)', lo_word: 'INSERT INTO content.lo_words(content_id,text) VALUES($1,$2)', lo_sentence: 'INSERT INTO content.lo_sentences(content_id,text) VALUES($1,$2)', zh_pinyin: 'INSERT INTO content.zh_pinyin(content_id,syllable,final,tone,display_form) VALUES($1,$2,$3,$4,$2)', zh_syllable: 'INSERT INTO content.zh_syllables(content_id,syllable,final,display_form) VALUES($1,$2,$3,$2)' };
    const values = type === 'lo_letter' ? [id, text, 'consonant'] : type === 'zh_pinyin' ? [id, text, 'a', 1] : [id, text, 'a']; await pool.query(sql[type], values);
    await pool.query(`INSERT INTO content.content_revisions(revision_public_id,entity_type,entity_id,revision_number,status,snapshot,published_at) VALUES($1,'content',$2,1,'published',$3::jsonb,now())`, [revisionId, entityId, JSON.stringify({ audio: { pronunciation: { source: 'canonical', value: text } } })]);
    expect(await queries.resolveRevision(revisionId)).toMatchObject({ entityType: type, entityId, textSnapshot: text });
    expect(await queries.resolveCurrentPublishedRevision(type, entityId)).toMatchObject({ revisionId });
    await expect(queries.validateAudioSource({ entityType: type, entityId, revisionId, languageCode: language, audioRole: role })).resolves.toMatchObject({ entityType: type, textSnapshot: text });
  });
});
