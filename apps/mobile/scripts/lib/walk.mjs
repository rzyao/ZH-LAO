/**
 * Shared helpers for the audit scripts.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Walks a directory tree, yielding absolute file paths. */
export function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      yield* walk(full);
    } else {
      yield full;
    }
  }
}
