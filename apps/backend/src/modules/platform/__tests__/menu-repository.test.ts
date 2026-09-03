import { describe, expect, it } from 'vitest';
import type { QueryResult, QueryResultRow } from '../../../database/executor.js';
import type { DatabaseExecutor } from '../../../database/executor.js';
import { PostgresMenuRepository } from '../infrastructure/repositories.js';
import { parseMenuInternalId } from '../domain/ids.js';

/** Fake executor:捕获 SQL,返回预设行。 */
function fakeExecutor(rows: QueryResultRow[]): DatabaseExecutor & { queries: string[] } {
  const queries: string[] = [];
  return {
    queries,
    async query<Row extends QueryResultRow>(text: string): Promise<QueryResult<Row>> {
      queries.push(text);
      return { rows: rows as Row[], rowCount: rows.length, command: 'SELECT', fields: [], oid: 0 } as QueryResult<Row>;
    },
  };
}

describe('PostgresMenuRepository (T016 契约: 表结构 → 领域类型映射)', () => {
  it('maps a menu row to MenuItem with branded id + parentId', async () => {
    const executor = fakeExecutor([
      {
        id: '7',
        parent_id: null,
        label: '系统运维',
        route_key: 'operations',
        icon: 'settings',
        sort_order: 0,
        status: 'active',
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    const repo = new PostgresMenuRepository();
    const item = await repo.findById(executor, parseMenuInternalId(7n));
    expect(item).not.toBeNull();
    expect(item!.id).toBe(parseMenuInternalId(7n));
    expect(item!.parentId).toBeNull();
    expect(item!.label).toBe('系统运维');
    expect(item!.routeKey).toBe('operations');
    expect(item!.status).toBe('active');
  });

  it('listAll maps only rows returned by the DB (WHERE status <> removed 由 SQL 保证)', async () => {
    // fake executor 模拟 DB 已按 WHERE status <> 'removed' 过滤后的行
    const executor = fakeExecutor([
      { id: '1', parent_id: null, label: 'a', route_key: 'overview', icon: null, sort_order: 0, status: 'active', created_at: new Date(), updated_at: new Date() },
    ]);
    const repo = new PostgresMenuRepository();
    const all = await repo.listAll(executor);
    expect(all.map((i) => i.id)).toEqual([parseMenuInternalId(1n)]);
    // SQL 必须含过滤条件
    expect(executor.queries[0]!).toContain(`status <> 'removed'`);
  });

  it('findDirectChildren maps rows in DB ORDER BY order', async () => {
    // fake executor 模拟 DB 已按 sort_order, id 排序后的行
    const executor = fakeExecutor([
      { id: '2', parent_id: '1', label: 'b', route_key: 'platform', icon: null, sort_order: 0, status: 'active', created_at: new Date(), updated_at: new Date() },
      { id: '3', parent_id: '1', label: 'c', route_key: 'operations', icon: null, sort_order: 1, status: 'active', created_at: new Date(), updated_at: new Date() },
    ]);
    const repo = new PostgresMenuRepository();
    const children = await repo.findDirectChildren(executor, parseMenuInternalId(1n));
    expect(children.map((i) => i.label)).toEqual(['b', 'c']);
    // SQL 必须含排序
    expect(executor.queries[0]!).toContain('ORDER BY sort_order ASC, id ASC');
  });
});
