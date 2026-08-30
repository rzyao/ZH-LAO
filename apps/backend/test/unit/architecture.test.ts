import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const exec = promisify(execFile);
const created: string[] = [];
afterEach(async () => { await Promise.all(created.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

async function fixture(relative: string, source: string): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'zh-lao-architecture-')); created.push(root);
  const target = path.join(root, relative); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, source);
  return root;
}

describe('architecture audit', () => {
  it('accepts public cross-domain contracts', async () => {
    const root = await fixture('modules/learning/application/use-case.ts', `import type { Contract } from '../../content/public/contract.js'; export type X = Contract;`);
    await expect(exec(process.execPath, [path.resolve('scripts/check-architecture.mjs'), root])).resolves.toMatchObject({ stdout: expect.stringContaining('PASS') });
  });
  it('rejects internal cross-domain imports and direct Pool usage', async () => {
    const root = await fixture('modules/learning/infrastructure/repository.ts', `import { Pool } from 'pg'; import { x } from '../../content/infrastructure/repository.js'; export const value = new Pool();`);
    await expect(exec(process.execPath, [path.resolve('scripts/check-architecture.mjs'), root])).rejects.toMatchObject({ stderr: expect.stringContaining('cross-domain import'), code: 1 });
  });
});
