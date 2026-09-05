import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { quoteIdentifier, withClient } from '../scripts/db.mjs';
import { loadRequiredMigrations, loadSupersededMigrations } from '../scripts/migration-files.mjs';
import { migrate } from '../scripts/migrate.mjs';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const oldFilename = '1360_content_audio_eligible_types.sql';

async function withAudioBaseline(run) {
  const name = `zh_lao_merge_${randomUUID().replaceAll('-', '')}`;
  const url = new URL(adminUrl); url.pathname = `/${name}`;
  await withClient(adminUrl, (client) => client.query(`CREATE DATABASE ${quoteIdentifier(name)} TEMPLATE template0`));
  try {
    const old = (await loadSupersededMigrations()).find(({ filename }) => filename === oldFilename);
    const baseline = (await loadRequiredMigrations()).filter(({ filename }) => filename < '1280');
    const sql = await readFile(new URL(`../migrations/${oldFilename}`, import.meta.url), 'utf8');
    await withClient(url.toString(), async (client) => {
      await client.query('CREATE TABLE public.v2_schema_migrations (filename text PRIMARY KEY, sha256 char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
      for (const entry of [...baseline, { ...old, sql }]) {
        await client.query(entry.sql);
        await client.query('INSERT INTO public.v2_schema_migrations(filename,sha256) VALUES($1,$2)', [entry.filename, entry.sha256]);
      }
    });
    await run(url.toString(), old);
  } finally {
    await withClient(adminUrl, (client) => client.query(`DROP DATABASE ${quoteIdentifier(name)} WITH (FORCE)`));
  }
}

test('empty audio baseline upgrades without replaying superseded SQL or rewriting its ledger', { skip: !adminUrl }, async () => {
  await withAudioBaseline(async (url, old) => {
    const result = await migrate(url);
    assert.ok(result.executed.includes('1310_content_language_structures.sql'));
    assert.ok(!result.executed.includes(oldFilename));
    await withClient(url, async (client) => {
      assert.equal((await client.query('SELECT trim(sha256) AS hash FROM public.v2_schema_migrations WHERE filename=$1', [oldFilename])).rows[0].hash, old.sha256);
      const columns = (await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='content' AND table_name='zh_syllables'")).rows.map(({ column_name }) => column_name);
      assert.ok(columns.includes('base_form') && columns.includes('tone'));
      assert.ok(!columns.includes('syllable'));
    });
    assert.deepEqual((await migrate(url)).executed, []);
  });
});

test('legacy syllable data blocks migration without losing its identity or text', { skip: !adminUrl }, async () => {
  await withAudioBaseline(async (url) => {
    const publicId = randomUUID();
    await withClient(url, async (client) => {
      const id = (await client.query("INSERT INTO content.contents(public_id,language,content_type) VALUES($1,'zh','zh_syllable') RETURNING id", [publicId])).rows[0].id;
      await client.query("INSERT INTO content.zh_syllables(content_id,syllable,final,display_form) VALUES($1,'ma','a','ma')", [id]);
    });
    await assert.rejects(migrate(url), /explicit content mapping/);
    await withClient(url, async (client) => {
      assert.equal((await client.query('SELECT s.syllable FROM content.zh_syllables s JOIN content.contents c ON c.id=s.content_id WHERE c.public_id=$1', [publicId])).rows[0].syllable, 'ma');
      assert.equal((await client.query("SELECT 1 FROM public.v2_schema_migrations WHERE filename='1309_content_audio_legacy_preflight.sql'")).rowCount, 0);
    });
  });
});

test('a superseded migration still rejects an altered applied checksum', { skip: !adminUrl }, async () => {
  await withAudioBaseline(async (url) => {
    await withClient(url, (client) => client.query('UPDATE public.v2_schema_migrations SET sha256=$1 WHERE filename=$2', ['0'.repeat(64), oldFilename]));
    await assert.rejects(migrate(url), /Applied migration checksum mismatch: 1360_content_audio_eligible_types.sql/);
  });
});
