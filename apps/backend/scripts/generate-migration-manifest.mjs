import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { loadRequiredMigrations } from '../../../database/v2/scripts/migration-files.mjs';

const target = path.resolve(import.meta.dirname, '../src/database/required-migrations.generated.ts');
const migrations = await loadRequiredMigrations();
const entries = migrations.map(({ filename, sha256 }) => `  { filename: '${filename}', sha256: '${sha256}' },`).join('\n');
const generated = `// Generated from database/v2/migrations by scripts/generate-migration-manifest.mjs.\n// Do not edit manually. Frozen migration files remain the sole schema authority.\nexport const requiredMigrations = [\n${entries}\n] as const;\n`;

if (process.argv.includes('--check')) {
  const current = await readFile(target, 'utf8').catch(() => '');
  if (current !== generated) {
    process.stderr.write('Required migration manifest is missing or stale. Run pnpm manifest:generate.\n');
    process.exitCode = 1;
  }
} else {
  await writeFile(target, generated, 'utf8');
}
