import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { requireDatabaseUrl, withClient } from './db.mjs';
import { assignSortOrders, mapLegacyLaoLetter } from './legacy-lao-letter-mapping.mjs';

const LOCK_KEY = 894_222_068;
const UUID_NAMESPACE = 'e9192b2a-22c4-5d0a-9b9b-2d5d7a4e1b11';
const expectedCounts = { consonant: 29, vowel: 31, tone_mark: 4, other: 4 };

function sourceConfig() {
  const required = ['LEGACY_MYSQL_HOST', 'LEGACY_MYSQL_USER', 'LEGACY_MYSQL_PASSWORD', 'LEGACY_MYSQL_DATABASE'];
  for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
  return {
    host: process.env.LEGACY_MYSQL_HOST,
    port: Number(process.env.LEGACY_MYSQL_PORT ?? 3306),
    user: process.env.LEGACY_MYSQL_USER,
    password: process.env.LEGACY_MYSQL_PASSWORD,
    database: process.env.LEGACY_MYSQL_DATABASE,
    charset: 'utf8mb4',
  };
}

function stableUuid(value) {
  const namespace = Buffer.from(UUID_NAMESPACE.replaceAll('-', ''), 'hex');
  const digest = createHash('sha1').update(Buffer.concat([namespace, Buffer.from(value, 'utf8')])).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  return `${digest.subarray(0, 4).toString('hex')}-${digest.subarray(4, 6).toString('hex')}-${digest.subarray(6, 8).toString('hex')}-${digest.subarray(8, 10).toString('hex')}-${digest.subarray(10, 16).toString('hex')}`;
}

function summarize(rows) {
  return rows.reduce((summary, row) => {
    summary[row.letterType] = (summary[row.letterType] ?? 0) + 1;
    return summary;
  }, {});
}

function validate(rows) {
  const actualCounts = summarize(rows);
  if (rows.length !== 68 || Object.keys(expectedCounts).some((type) => actualCounts[type] !== expectedCounts[type])) {
    throw new Error(`Expected 68 mapped records (${JSON.stringify(expectedCounts)}), received ${rows.length} (${JSON.stringify(actualCounts)})`);
  }
  const duplicates = rows.filter((row, index) => rows.findIndex((candidate) => candidate.character === row.character) !== index);
  if (duplicates.length) throw new Error(`Duplicate Lao character(s): ${duplicates.map((row) => row.character).join(', ')}`);
  if (rows.some((row) => !/^\p{Script=Lao}+$/u.test(row.character))) throw new Error('Every imported character must use the Lao Unicode script');
}

export async function loadLegacyLetters(config = sourceConfig()) {
  const source = await mysql.createConnection(config);
  try {
    const [rows] = await source.query(`SELECT id, lao, phonetic, description, classification, subtype
      FROM app_letter
      ORDER BY classification, subtype, lao, id`);
    const mapped = assignSortOrders(rows.map(mapLegacyLaoLetter));
    validate(mapped);
    return mapped;
  } finally {
    await source.end();
  }
}

export async function importLegacyLaoLetters({ apply = false, databaseUrl = requireDatabaseUrl() } = {}) {
  const rows = await loadLegacyLetters();
  const sourceSummary = summarize(rows);
  if (!apply) return { mode: 'dry-run', sourceSummary, wouldInsert: rows.length, rows };

  return withClient(databaseUrl, async (client) => {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    try {
      await client.query('BEGIN');
      const existing = await client.query(`SELECT l.character, l.letter_type
        FROM content.lo_letters l
        WHERE l.character = ANY($1::text[])`, [rows.map((row) => row.character)]);
      const existingByCharacter = new Map(existing.rows.map((row) => [row.character, row.letter_type]));
      const conflicting = rows.filter((row) => existingByCharacter.has(row.character) && existingByCharacter.get(row.character) !== row.letterType);
      if (conflicting.length) throw new Error(`Target classification conflict: ${conflicting.map((row) => row.character).join(', ')}`);

      let inserted = 0;
      for (const row of rows) {
        if (existingByCharacter.has(row.character)) continue;
        const content = await client.query(`INSERT INTO content.contents (public_id, language, content_type, status)
          VALUES ($1, 'lo', 'lo_letter', 'active') RETURNING id`, [stableUuid(`study-lao:app_letter:${row.sourceId}`)]);
        await client.query(`INSERT INTO content.lo_letters
          (content_id, character, letter_type, letter_class, name, romanization, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
          content.rows[0].id, row.character, row.letterType, row.letterClass,
          row.name, row.romanization, row.sortOrder,
        ]);
        inserted += 1;
      }
      const target = await client.query(`SELECT letter_type, COUNT(*)::int AS total
        FROM content.lo_letters GROUP BY letter_type ORDER BY letter_type`);
      await client.query('COMMIT');
      return { mode: 'apply', sourceSummary, inserted, skipped: rows.length - inserted, targetSummary: target.rows };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const apply = process.argv.includes('--apply');
  const result = await importLegacyLaoLetters({ apply });
  process.stdout.write(`${JSON.stringify({ ...result, rows: apply ? undefined : result.rows.map(({ sourceId, character, letterType, letterClass, sortOrder }) => ({ sourceId, character, letterType, letterClass, sortOrder })) }, null, 2)}\n`);
}
