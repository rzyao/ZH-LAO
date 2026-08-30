import { fileURLToPath } from 'node:url';
import { requireDatabaseUrl, withClient } from './db.mjs';
import { loadRequiredMigrations } from './migration-files.mjs';

const lockKey = 894_222_002;

export async function migrate(connectionString = requireDatabaseUrl()) {
  return withClient(connectionString, async (client) => {
    await client.query('SELECT pg_advisory_lock($1)', [lockKey]);
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.v2_schema_migrations (
          filename text PRIMARY KEY,
          sha256 char(64) NOT NULL,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      const migrations = await loadRequiredMigrations();
      const appliedResult = await client.query(
        'SELECT filename, sha256 FROM public.v2_schema_migrations ORDER BY filename',
      );
      const applied = new Map(appliedResult.rows.map((row) => [row.filename, row.sha256.trim()]));
      const executed = [];
      const skipped = [];

      for (const { filename, sha256, sql } of migrations) {
        if (applied.has(filename)) {
          if (applied.get(filename) !== sha256) {
            throw new Error(`Applied migration checksum mismatch: ${filename}`);
          }
          skipped.push(filename);
          continue;
        }

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO public.v2_schema_migrations(filename, sha256) VALUES ($1, $2)',
            [filename, sha256],
          );
          await client.query('COMMIT');
          executed.push(filename);
        } catch (error) {
          await client.query('ROLLBACK');
          error.message = `${filename}: ${error.message}`;
          throw error;
        }
      }

      return { executed, skipped };
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [lockKey]);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await migrate();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
