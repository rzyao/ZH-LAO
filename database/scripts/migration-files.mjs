import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '..', 'migrations');

export async function loadRequiredMigrations() {
  const filenames = (await readdir(migrationsDir))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  return Promise.all(filenames.map(async (filename) => {
    const sql = await readFile(path.join(migrationsDir, filename), 'utf8');
    // Git may check frozen SQL out with CRLF on Windows while CI uses LF.
    // Hash canonical text so the ledger and backend manifest stay portable.
    const canonicalSql = sql.replace(/\r\n/g, '\n');
    return { filename, sha256: createHash('sha256').update(canonicalSql).digest('hex'), sql };
  }));
}
