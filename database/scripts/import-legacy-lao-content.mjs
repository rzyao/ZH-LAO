import { fileURLToPath } from 'node:url';
import { withClient } from './db.mjs';
import { selectCanonicalRecords, stableMigrationUuid, stableLegacyLetterUuid } from './legacy-lao-content-mapping.mjs';
import { legacyMysqlConfig, loadLegacyLaoContent } from './legacy-lao-content-source.mjs';
import { copyR2Object, inspectWavObject, validateR2Config } from './legacy-lao-content-r2.mjs';
import { writeMigrationReport } from './legacy-lao-content-report.mjs';

export function requireLegacyLaoContentConfig(env = process.env) {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  if (!env.MIGRATION_OPERATOR_ID) throw new Error('MIGRATION_OPERATOR_ID is required');
  return { databaseUrl, operatorId: env.MIGRATION_OPERATOR_ID, source: legacyMysqlConfig(env), r2: validateR2Config(env) };
}

export function buildImportPlan({ syllables = [], words = [], sentences = [] }) {
  const all = [...syllables.map((x) => ({ ...x, type: 'syllable' })), ...words.map((x) => ({ ...x, type: 'word' })), ...sentences.map((x) => ({ ...x, type: 'sentence' }))];
  const { canonical, isolated } = selectCanonicalRecords(all);
  const selected = new Set(canonical.map((x) => `${x.type}:${x.id}`));
  const contents = canonical.map((entry) => ({ ...entry, publicId: stableMigrationUuid(entry.type, entry.id), status: 'draft' }));
  const relations = { syllableLetters: [], wordSyllables: [], sentenceWords: [] };
  const isolation = [...isolated];
  for (const syllable of canonical.filter((x) => x.type === 'syllable')) for (const [index, letterId] of (syllable.syllableIds ?? []).entries()) relations.syllableLetters.push({ syllableSourceId: syllable.id, letterSourceId: letterId, position: index });
  for (const word of canonical.filter((x) => x.type === 'word')) for (const [index, syllableId] of (word.syllableIds ?? []).entries()) {
    if (selected.has(`syllable:${syllableId}`)) relations.wordSyllables.push({ wordSourceId: word.id, syllableSourceId: syllableId, position: index });
    else isolation.push({ type: 'word_syllable', sourceParentId: word.id, sourceChildId: syllableId, reason: 'missing_word_syllable' });
  }
  for (const sentence of canonical.filter((x) => x.type === 'sentence')) for (const [index, wordId] of (sentence.wordIds ?? []).entries()) {
    if (selected.has(`word:${wordId}`)) relations.sentenceWords.push({ sentenceSourceId: sentence.id, wordSourceId: wordId, position: index });
    else isolation.push({ type: 'sentence_word', sourceParentId: sentence.id, sourceChildId: wordId, reason: 'missing_sentence_word' });
  }
  return { contents, relations, isolation };
}

async function preflightMedia(contents, r2) {
  const output = [];
  for (let index = 0; index < contents.length; index += 32) output.push(...await Promise.all(contents.slice(index, index + 32).map(async (content) => ({ sourceId: content.id, type: content.type, ...(await inspectWavObject(content.audioUrl, r2)) }))));
  return output;
}

function sentenceSurfaceForms(text, words, sentenceId, isolation) {
  let cursor = 0;
  const forms = words.map((word) => {
    const index = text.indexOf(word, cursor);
    if (index < 0) {
      isolation.push({ type: 'sentence_word', sourceParentId: sentenceId, sourceChildText: word, reason: 'sentence_surface_mismatch' });
      return '';
    }
    const form = text.slice(cursor, index) + word;
    cursor = index + word.length;
    return form;
  });
  if (forms.length) forms[forms.length - 1] += text.slice(cursor);
  return forms;
}

async function repairSentenceSurfaceForms(client, plan) {
  const entries = new Map(plan.contents.map((entry) => [`${entry.type}:${entry.id}`, entry]));
  const bySentence = new Map();
  for (const relation of plan.relations.sentenceWords) bySentence.set(relation.sentenceSourceId, [...(bySentence.get(relation.sentenceSourceId) ?? []), relation]);
  for (const [sentenceId, relations] of bySentence) {
    const sentence = entries.get(`sentence:${sentenceId}`); const children = relations.map((relation) => entries.get(`word:${relation.wordSourceId}`));
    const forms = sentenceSurfaceForms(sentence.text, children.map((child) => child.text), sentenceId, plan.isolation);
    for (let index = 0; index < relations.length; index += 1) await client.query(`UPDATE content.lo_sentence_words SET surface_form=$1
      WHERE sentence_content_id=(SELECT id FROM content.contents WHERE public_id=$2) AND position=$3`, [forms[index], stableMigrationUuid('sentence', sentenceId), index + 1]);
  }
}

async function resolveSharedAudioObjects(contents, r2) {
  const seen = new Set(); const copied = [];
  for (const content of contents) {
    if (!seen.has(content.audioUrl)) { seen.add(content.audioUrl); continue; }
    const destinationKey = `migration/legacy-lao-content/2026-09-05/${content.type}-${content.id}.wav`;
    const sourceUrl = content.audioUrl;
    content.audioUrl = await copyR2Object(sourceUrl, destinationKey, r2);
    copied.push({ sourceId: content.id, type: content.type, sourceUrl, destinationKey });
  }
  return copied;
}

async function applyPlan(plan, config, media) {
  const mediaByKey = new Map(media.map((item) => [`${item.type}:${item.sourceId}`, item]));
  return withClient(config.databaseUrl, async (client) => {
    await client.query('SELECT pg_advisory_lock($1)', [740_007_001]);
    try {
      await client.query('BEGIN');
      const existing = await client.query("SELECT count(*)::int AS total FROM content.contents WHERE language='lo' AND content_type IN ('lo_syllable','lo_word','lo_sentence')");
      if (existing.rows[0].total !== 0) {
        const expectedIds = plan.contents.map((entry) => entry.publicId);
        const matched = await client.query("SELECT count(*)::int AS total FROM content.contents WHERE public_id=ANY($1::uuid[])", [expectedIds]);
        if (existing.rows[0].total === plan.contents.length && matched.rows[0].total === plan.contents.length) { await repairSentenceSurfaceForms(client, plan); await client.query('COMMIT'); return { inserted: 0, skipped: plan.contents.length, audioAssets: 0, isolation: plan.isolation.length }; }
        throw new Error('Target contains incompatible Lao content; migration refuses to merge or overwrite it.');
      }
      const ids = new Map(); const revisions = new Map();
      for (const entry of plan.contents) {
        const publicId = entry.publicId; const revisionId = stableMigrationUuid(`${entry.type}-revision`, entry.id);
        const kind = `lo_${entry.type}`; const inserted = await client.query('INSERT INTO content.contents (public_id,language,content_type,status) VALUES ($1,\'lo\',$2,\'active\') RETURNING id', [publicId, kind]);
        const contentId = inserted.rows[0].id; ids.set(`${entry.type}:${entry.id}`, { publicId, contentId }); revisions.set(`${entry.type}:${entry.id}`, revisionId);
        if (entry.type === 'syllable') await client.query('INSERT INTO content.lo_syllables(content_id,text,romanization) VALUES ($1,$2,$3)', [contentId, entry.text, entry.romanization]);
        if (entry.type === 'word') { await client.query('INSERT INTO content.lo_words(content_id,text,romanization) VALUES ($1,$2,$3)', [contentId, entry.text, entry.romanization]); if (entry.chinese) await client.query("INSERT INTO content.meanings(content_id,language,definition) VALUES ($1,'zh',$2)", [contentId, entry.chinese]); }
        if (entry.type === 'sentence') { await client.query('INSERT INTO content.lo_sentences(content_id,text,romanization) VALUES ($1,$2,$3)', [contentId, entry.text, entry.romanization]); if (entry.chinese) await client.query("INSERT INTO content.translations(content_id,language,text,is_primary) VALUES ($1,'zh',$2,true)", [contentId, entry.chinese]); }
        const snapshot = { fields: { text: entry.text, romanization: entry.romanization ?? null }, migration: { sourceType: entry.type, sourceId: entry.id } };
        await client.query("INSERT INTO content.content_revisions(revision_public_id,entity_type,entity_id,revision_number,status,snapshot,created_by_operator_id) VALUES ($1,'content',$2,1,'draft',$3::jsonb,$4)", [revisionId, publicId, JSON.stringify(snapshot), config.operatorId]);
      }
      for (const relation of plan.relations.syllableLetters) { const parent=ids.get(`syllable:${relation.syllableSourceId}`); const letter=await client.query('SELECT id FROM content.contents WHERE public_id=$1', [stableLegacyLetterUuid(relation.letterSourceId)]); if (!letter.rows[0]) throw new Error(`Missing target Lao letter for source ID ${relation.letterSourceId}`); await client.query('INSERT INTO content.lo_syllable_letters(syllable_content_id,letter_content_id,position) VALUES ($1,$2,$3)', [parent.contentId,letter.rows[0].id,relation.position+1]); }
      for (const relation of plan.relations.wordSyllables) { const parent=ids.get(`word:${relation.wordSourceId}`); const child=ids.get(`syllable:${relation.syllableSourceId}`); await client.query('INSERT INTO content.lo_word_syllables(word_content_id,syllable_content_id,position) VALUES ($1,$2,$3)', [parent.contentId,child.contentId,relation.position+1]); }
      for (const relation of plan.relations.sentenceWords) { const parent=ids.get(`sentence:${relation.sentenceSourceId}`); const child=ids.get(`word:${relation.wordSourceId}`); await client.query('INSERT INTO content.lo_sentence_words(sentence_content_id,word_content_id,position) VALUES ($1,$2,$3)', [parent.contentId,child.contentId,relation.position+1]); }
      await repairSentenceSurfaceForms(client, plan);
      for (const entry of plan.contents) { const key=`${entry.type}:${entry.id}`; const content=ids.get(key); const revisionId=revisions.get(key); const item=mediaByKey.get(key); const assetId=stableMigrationUuid(`${entry.type}-asset`,entry.id); const slotId=stableMigrationUuid(`${entry.type}-slot`,entry.id); const taskId=stableMigrationUuid(`${entry.type}-task`,entry.id); const versionId=stableMigrationUuid(`${entry.type}-audio-version`,entry.id); const hash=stableMigrationUuid(`${entry.type}-audio-input`,entry.id).replaceAll('-','');
        await client.query("INSERT INTO infrastructure.assets(id,storage_provider,storage_bucket,storage_key,mime_type,size_bytes,status,duration_ms) VALUES ($1,$2,$3,$4,$5,$6,'ready',$7)",[assetId,item.storageProvider,item.storageBucket,item.storageKey,item.mimeType,item.sizeBytes,item.durationMs]);
        await client.query("INSERT INTO audio.audio_slots(id,source_domain,content_entity_type,content_entity_id,language_code,audio_role,required_content_revision_id,required_audio_input_hash) VALUES ($1,'content',$2,$3,'lo','pronunciation',$4,$5)",[slotId,`lo_${entry.type}`,content.publicId,revisionId,hash]);
        await client.query("INSERT INTO audio.audio_tasks(id,slot_id,production_method,status,content_revision_id,text_snapshot,audio_input_hash,created_by_operator_id,client_idempotency_key) VALUES ($1,$2,'human_recording','pending_review',$3,$4,$5,$6,$7)",[taskId,slotId,revisionId,entry.text,hash,config.operatorId,`legacy-lao:${entry.type}:${entry.id}`]);
        await client.query("INSERT INTO audio.audio_asset_versions(id,slot_id,task_id,version,producer_operator_id,content_revision_id,audio_input_hash,asset_id,duration_ms,sample_rate_hz,channels,review_status) VALUES ($1,$2,$3,1,$4,$5,$6,$7,$8,$9,$10,'pending_review')",[versionId,slotId,taskId,config.operatorId,revisionId,hash,assetId,item.durationMs,item.sampleRateHz,item.channels]);
      }
      await client.query('COMMIT'); return { inserted: plan.contents.length, audioAssets: media.length, isolation: plan.isolation.length };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { await client.query('SELECT pg_advisory_unlock($1)', [740_007_001]); }
  });
}

export async function importLegacyLaoContent({ apply = false, env = process.env } = {}) {
  const config = requireLegacyLaoContentConfig(env);
  const source = await loadLegacyLaoContent(config.source);
  const plan = buildImportPlan({
    syllables: source.filter((row) => row.type === 'syllable').map((row) => ({ ...row, syllableIds: row.childIds })),
    words: source.filter((row) => row.type === 'word').map((row) => ({ ...row, syllableIds: row.childIds })),
    sentences: source.filter((row) => row.type === 'sentence').map((row) => ({ ...row, wordIds: row.childIds })),
  });
  if (apply) {
    const copiedAudio = await resolveSharedAudioObjects(plan.contents, config.r2);
    const result = { mode: 'apply', ...(await applyPlan(plan, config, await preflightMedia(plan.contents, config.r2))), copiedAudio };
    const reportPath = fileURLToPath(new URL('../reports/legacy-lao-content-migration/latest.json', import.meta.url));
    await writeMigrationReport(reportPath, { sourceCount: source.length, byType: Object.fromEntries(['syllable', 'word', 'sentence'].map((type) => [type, plan.contents.filter((row) => row.type === type).length])), relationCounts: Object.fromEntries(Object.entries(plan.relations).map(([key, rows]) => [key, rows.length])), ...result, isolation: plan.isolation });
    return { ...result, reportPath };
  }
  return {
    mode: 'dry-run', sourceCount: source.length, canonicalCount: plan.contents.length,
    byType: Object.fromEntries(['syllable', 'word', 'sentence'].map((type) => [type, plan.contents.filter((row) => row.type === type).length])),
    isolationCount: plan.isolation.length, relationCounts: Object.fromEntries(Object.entries(plan.relations).map(([key, rows]) => [key, rows.length])),
    plan,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await importLegacyLaoContent({ apply: process.argv.includes('--apply') });
  process.stdout.write(`${JSON.stringify({ ...result, plan: undefined }, null, 2)}\n`);
}
