import { describe, expect, it, vi } from 'vitest';
import type { QueryResult } from '../../../database/executor.js';
import type { Logger } from 'pino';
import { TransactionManager } from '../../../database/transaction-manager.js';
import { ensureDefaultAdmin } from '../application/use-cases/admin-authentication.js';
import { AppError } from '../../../errors/app-error.js';

const silentLogger = { silent: true } as unknown as Logger;

function fakeTransactionManager(handler: (text: string, values?: readonly unknown[]) => QueryResult): TransactionManager {
  const client = {
    query: async (text: string, values?: unknown[]) => handler(text, values),
    release: () => undefined,
  } as never;
  const pool = { connect: async () => client } as never;
  return new TransactionManager(pool as never, silentLogger);
}

describe('ensureDefaultAdmin (US-003 / FR-009 / FR-010)', () => {
  it('creates default admin and calls bootstrap on empty database (FR-009)', async () => {
    const executedQueries: Array<{ text: string; values?: readonly unknown[] }> = [];
    const bootstrap = vi.fn().mockResolvedValue(undefined);

    const tx = fakeTransactionManager((text, values) => {
      executedQueries.push(values ? { text, values } : { text });
      if (text.includes('pg_advisory_xact_lock')) {
        return { rows: [], rowCount: 1 } as unknown as QueryResult;
      }
      if (text.includes('identity.admin_credentials') && text.includes('WHERE c.username = $1')) {
        return { rows: [], rowCount: 0 } as unknown as QueryResult;
      }
      if (text.includes('SELECT count(*)::text AS count FROM operations.operators')) {
        return { rows: [{ count: '0' }], rowCount: 1 } as unknown as QueryResult;
      }
      if (text.includes('INSERT INTO identity.users')) {
        return { rows: [{ id: '1', public_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }], rowCount: 1 } as unknown as QueryResult;
      }
      if (text.includes('INSERT INTO identity.admin_credentials')) {
        return { rows: [], rowCount: 1 } as unknown as QueryResult;
      }
      return { rows: [], rowCount: 0 } as unknown as QueryResult;
    });

    await ensureDefaultAdmin({
      transactions: tx,
      repositories: () => ({} as never),
      bootstrap,
      username: 'admin',
      password: 'test-password',
    });

    expect(bootstrap).toHaveBeenCalledTimes(1);
    expect(bootstrap).toHaveBeenCalledWith('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'admin');

    const credInsert = executedQueries.find(q => q.text.includes('INSERT INTO identity.admin_credentials'));
    expect(credInsert).toBeDefined();
    expect(credInsert?.values?.[1]).toBe('admin');
    // Password must be hashed (starts with scrypt$)
    expect(String(credInsert?.values?.[2])).toMatch(/^scrypt\$/);
  });

  it('no-ops (idle loop) when operations.operators has existing records (FR-010)', async () => {
    const executedQueries: Array<{ text: string; values?: readonly unknown[] }> = [];
    const bootstrap = vi.fn();

    const tx = fakeTransactionManager((text, values) => {
      executedQueries.push(values ? { text, values } : { text });
      if (text.includes('identity.admin_credentials') && text.includes('WHERE c.username = $1')) {
        return { rows: [], rowCount: 0 } as unknown as QueryResult;
      }
      if (text.includes('SELECT count(*)::text AS count FROM operations.operators')) {
        return { rows: [{ count: '2' }], rowCount: 1 } as unknown as QueryResult;
      }
      return { rows: [], rowCount: 0 } as unknown as QueryResult;
    });

    await ensureDefaultAdmin({
      transactions: tx,
      repositories: () => ({} as never),
      bootstrap,
      username: 'admin',
      password: 'test-password',
    });

    // Zero user creation, zero admin_credential inserts, zero bootstrap calls
    expect(bootstrap).not.toHaveBeenCalled();
    const userInsert = executedQueries.find(q => q.text.includes('INSERT INTO identity.users'));
    expect(userInsert).toBeUndefined();
    const credInsert = executedQueries.find(q => q.text.includes('INSERT INTO identity.admin_credentials'));
    expect(credInsert).toBeUndefined();
  });

  it('handles existing default credentials and suppresses BOOTSTRAP_ALREADY_COMPLETED idempotently', async () => {
    const bootstrap = vi.fn().mockRejectedValue(
      new AppError({ code: 'BOOTSTRAP_ALREADY_COMPLETED', message: 'Already bootstrapped', httpStatus: 409 }),
    );

    const tx = fakeTransactionManager((text) => {
      if (text.includes('WHERE c.username = $1')) {
        return { rows: [{ public_id: 'existing-uuid-1111' }], rowCount: 1 } as unknown as QueryResult;
      }
      return { rows: [], rowCount: 0 } as unknown as QueryResult;
    });

    await expect(
      ensureDefaultAdmin({
        transactions: tx,
        repositories: () => ({} as never),
        bootstrap,
        username: 'Admin  ',
        password: 'test-password',
      }),
    ).resolves.not.toThrow();

    expect(bootstrap).toHaveBeenCalledWith('existing-uuid-1111', 'admin');
  });
});
