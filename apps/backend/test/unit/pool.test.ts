import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { createPgPool } from '../../src/database/pool.js';

describe('PostgreSQL pool lifecycle', () => {
  it('surfaces unavailable database errors and closes cleanly', async () => {
    const pool = createPgPool({ url: 'postgresql://invalid:invalid@127.0.0.1:1/invalid', poolMin: 0, poolMax: 1, connectionTimeoutMs: 100, idleTimeoutMs: 100 }, pino({ level: 'silent' }));
    await expect(pool.query('SELECT 1')).rejects.toBeInstanceOf(Error);
    await expect(pool.end()).resolves.toBeUndefined();
    await expect(pool.query('SELECT 1')).rejects.toBeInstanceOf(Error);
  });
});
