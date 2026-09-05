import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '..', 'migrations');

export async function loadSupersededMigrations() {
  const supersessions = JSON.parse(await readFile(path.resolve(here, '..', 'checks', 'migration-supersessions.json'), 'utf8'));
  return Promise.all(Object.entries(supersessions).map(async ([filename, metadata]) => {
    const sql = await readFile(path.join(migrationsDir, filename), 'utf8');
    await readFile(path.join(migrationsDir, metadata.replacedBy), 'utf8');
    return { filename, sha256: createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex'), ...metadata };
  }));
}

export async function loadRequiredMigrations() {
  const superseded = new Set((await loadSupersededMigrations()).map(({ filename }) => filename));
  const filenames = (await readdir(migrationsDir))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
    .filter((name) => !superseded.has(name))
    .sort();
  return Promise.all(filenames.map(async (filename) => {
    const sql = await readFile(path.join(migrationsDir, filename), 'utf8');
    // Git may check frozen SQL out with CRLF on Windows while CI uses LF.
    // Hash canonical text so the ledger and backend manifest stay portable.
    const canonicalSql = sql.replace(/\r\n/g, '\n');
    return { filename, sha256: createHash('sha256').update(canonicalSql).digest('hex'), sql };
  }));
}
