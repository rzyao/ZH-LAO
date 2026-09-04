import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { loadRequiredMigrations } from '../../../database/scripts/migration-files.mjs';

const target = path.resolve(import.meta.dirname, '../src/database/required-migrations.generated.ts');
const migrations = await loadRequiredMigrations();
const entries = migrations.map(({ filename, sha256 }) => `  { filename: '${filename}', sha256: '${sha256}' },`).join('\n');
const generated = `// Generated from database/migrations by scripts/generate-migration-manifest.mjs.\n// Do not edit manually. Frozen migration files remain the sole schema authority.\nexport const requiredMigrations = [\n${entries}\n] as const;\n`;

if (process.argv.includes('--check')) {
  // The generated file may be checked out with CRLF on Windows; validate
  // canonical content rather than Git's platform-specific working-tree EOL.
  const current = (await readFile(target, 'utf8').catch(() => '')).replace(/\r\n/g, '\n');
  if (current !== generated) {
    process.stderr.write('Required migration manifest is missing or stale. Run pnpm manifest:generate.\n');
    process.exitCode = 1;
  }
} else {
  await writeFile(target, generated, 'utf8');
}
