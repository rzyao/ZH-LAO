import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { TransactionManager } from '../../src/database/transaction-manager.js';

describe('transaction manager', () => {
  it('commits, rolls back, preserves errors, and always releases', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] }); const release = vi.fn();
    const pool = { connect: async () => ({ query, release }) };
    const manager = new TransactionManager(pool as never, pino({ level: 'silent' }));
    await expect(manager.run(async () => 42)).resolves.toBe(42);
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'COMMIT']); expect(release).toHaveBeenCalledOnce();
    query.mockClear(); release.mockClear(); const original = new Error('original');
    await expect(manager.run(async () => { throw original; })).rejects.toBe(original);
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(['BEGIN', 'ROLLBACK']); expect(release).toHaveBeenCalledOnce();
  });
});
