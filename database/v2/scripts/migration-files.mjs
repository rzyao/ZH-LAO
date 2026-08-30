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
    return { filename, sha256: createHash('sha256').update(sql).digest('hex'), sql };
  }));
}
