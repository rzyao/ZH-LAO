import type { DatabaseExecutor } from './executor.js';
import { requiredMigrations } from './required-migrations.generated.js';

type RegistryRow = { filename: string; sha256: string };

export async function hasCompatibleBaseline(executor: DatabaseExecutor): Promise<boolean> {
  const objects = await executor.query<{ registry: string | null; assets: string | null; outbox: string | null }>(`
    SELECT
      to_regclass('public.v2_schema_migrations')::text AS registry,
      to_regclass('infrastructure.assets')::text AS assets,
      to_regclass('infrastructure.system_outbox_events')::text AS outbox
  `);
  const present = objects.rows[0];
  if (!present?.registry || !present.assets || !present.outbox) return false;

  const filenames = requiredMigrations.map(({ filename }) => filename);
  const appliedResult = await executor.query<RegistryRow>(`
    SELECT filename, trim(sha256) AS sha256
    FROM public.v2_schema_migrations
    WHERE filename = ANY($1::text[])
  `, [filenames]);
  const applied = new Map(appliedResult.rows.map((row) => [row.filename, row.sha256]));
  return requiredMigrations.every(({ filename, sha256 }) => applied.get(filename) === sha256);
}
