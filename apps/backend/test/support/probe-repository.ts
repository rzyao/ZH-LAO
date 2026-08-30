import type { DatabaseExecutor } from '../../src/database/executor.js';

export class ProbeRepository {
  constructor(private readonly executor: DatabaseExecutor) {}
  async insert(value: string): Promise<number> {
    const result = await this.executor.query<{ id: number }>('INSERT INTO foundation_test.probes(value) VALUES ($1) RETURNING id', [value]);
    return result.rows[0]!.id;
  }
  async count(): Promise<number> {
    const result = await this.executor.query<{ count: string }>('SELECT count(*)::text AS count FROM foundation_test.probes');
    return Number(result.rows[0]!.count);
  }
}
