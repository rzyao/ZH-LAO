import { describe, expect, it } from 'vitest';
import { AppError } from '../../../errors/app-error.js';
import type { DatabaseExecutor } from '../../../database/executor.js';
import { MenuUseCases } from '../application/use-cases/menu-use-cases.js';
import type { MenuRepository } from '../application/ports/platform-repositories.js';
import { parseMenuInternalId, type MenuInternalId } from '../domain/ids.js';
import type { MenuItem, MenuStatus } from '../domain/index.js';

const executor = {} as DatabaseExecutor;
const isOpKey = (k: string) => ['platform.menus.read', 'platform.menus.write', 'operations.operators.read'].includes(k);

let seq = 100n;
/** 构造完整 MenuItem;未提供的字段用默认值。 */
function makeItem(partial: Partial<Omit<MenuItem, 'parentId'>> & { id: MenuInternalId; parentId: MenuInternalId | null }): MenuItem {
  const base: MenuItem = {
    id: partial.id,
    parentId: partial.parentId,
    label: partial.label ?? 'item',
    routeKey: Object.hasOwn(partial, 'routeKey') ? partial.routeKey! : 'overview',
    icon: partial.icon ?? null,
    sortOrder: partial.sortOrder ?? 0,
    status: partial.status ?? 'active',
    createdAt: partial.createdAt ?? new Date('2026-01-01T00:00:00Z'),
    updatedAt: partial.updatedAt ?? new Date('2026-01-01T00:00:00Z'),
  };
  return base;
}

/** In-memory MenuRepository 实现(按 parent_id 维护树 + 权限集合)。 */
function fakeMenuRepo(initial: MenuItem[] = []): MenuRepository & { items: MenuItem[]; permissions: Map<string, string[]> } {
  const items = [...initial];
  const permissions = new Map<string, string[]>();
  return {
    items,
    permissions,
    async findById(_e, id, forUpdate = false) {
      void forUpdate;
      return items.find((i) => i.id === id) ?? null;
    },
    async findDirectChildren(_e, parentId) {
      return items.filter((i) => i.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
    },
    async create(_e, input) {
      const item = makeItem({
        id: parseMenuInternalId(seq++),
        parentId: input.parentId ?? null,
        label: input.label,
        routeKey: input.routeKey ?? null,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder ?? 0,
        status: input.status ?? 'active',
      });
      items.push(item);
      return item;
    },
    async update(_e, id, input) {
      const idx = items.findIndex((i) => i.id === id);
      if (idx < 0) throw new Error('not found');
      const existing = items[idx]!;
      const updated: MenuItem = {
        ...existing,
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        ...(input.routeKey !== undefined ? { routeKey: input.routeKey } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedAt: new Date(),
      };
      items[idx] = updated;
      return updated;
    },
    async listAll() {
      return items.filter((i) => i.status !== 'removed');
    },
    async listPermissionsForMenus(_e, menuIds) {
      return menuIds.flatMap((id) =>
        (permissions.get(id.toString()) ?? []).map((permissionKey) => ({ menuId: id, permissionKey, createdAt: new Date() })),
      );
    },
    async replacePermissions(_e, menuId, keys) {
      permissions.set(menuId.toString(), [...keys]);
    },
  };
}

function expectAppError(promise: Promise<unknown>, code: string, status: number) {
  return promise.then(
    () => { throw new Error(`expected ${code} error`); },
    (err: AppError) => {
      expect(err instanceof AppError).toBe(true);
      expect(err.code).toBe(code);
      expect(err.httpStatus).toBe(status);
    },
  );
}

describe('MenuUseCases', () => {
  describe('create (FR-002/FR-003)', () => {
    it('creates a top-level group (parent_id null)', async () => {
      const repo = fakeMenuRepo();
      const uc = new MenuUseCases(repo, isOpKey);
      const item = await uc.create(executor, { label: '系统运维', routeKey: 'operations' });
      expect(item.status).toBe('active'); // 创建即生效,无 draft
      expect(item.parentId).toBeNull();
      expect(item.routeKey).toBe('operations');
    });

    it('允许目录自由嵌套，不再限制为三层', async () => {
      const parent = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: 'operations' });
      const group = makeItem({ id: parseMenuInternalId(2n), parentId: parent.id, routeKey: 'operations' });
      const repo = fakeMenuRepo([parent, group]);
      const uc = new MenuUseCases(repo, isOpKey);

      const level3 = await uc.create(executor, { parentId: group.id, label: '三级目录' });
      const level4 = await uc.create(executor, { parentId: level3.id, label: '四级目录' });
      const level5 = await uc.create(executor, { parentId: level4.id, label: '操作员', routeKey: 'operations.operators' });
      expect(level5.parentId).toBe(level4.id);
    });

    it('allows a route-less child container (ADR-024 / CR-001)', async () => {
      const parent = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: 'operations' });
      const repo = fakeMenuRepo([parent]);
      const uc = new MenuUseCases(repo, isOpKey);
      const child = await uc.create(executor, { parentId: parent.id, label: 'x' });
      expect(child.routeKey).toBeNull();
    });
  });

  describe('state machine (FR-004/FR-005)', () => {
    it('active -> disabled -> active -> removed', async () => {
      const item = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: 'overview' });
      const repo = fakeMenuRepo([item]);
      const uc = new MenuUseCases(repo, isOpKey);

      const disabled = await uc.update(executor, item.id, { status: 'disabled' });
      expect(disabled.status).toBe('disabled');

      const reEnabled = await uc.update(executor, item.id, { status: 'active' });
      expect(reEnabled.status).toBe('active');

      const removed = await uc.remove(executor, item.id);
      expect(removed.status).toBe('removed');
    });

    it('rejects direct status write to removed via update', async () => {
      const item = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: 'overview' });
      const repo = fakeMenuRepo([item]);
      const uc = new MenuUseCases(repo, isOpKey);
      await expectAppError(uc.update(executor, item.id, { status: 'removed' }), 'PLATFORM_INVALID_ARGUMENT', 400);
    });

    it('remove cascades to descendants (FR-005)', async () => {
      const group = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: null });
      const child = makeItem({ id: parseMenuInternalId(2n), parentId: group.id, routeKey: 'operations' });
      const grandchild = makeItem({ id: parseMenuInternalId(3n), parentId: child.id, routeKey: 'operations.operators' });
      const repo = fakeMenuRepo([group, child, grandchild]);
      const uc = new MenuUseCases(repo, isOpKey);

      await uc.remove(executor, group.id);
      const remaining = await repo.listAll(executor);
      expect(remaining.filter((i) => i.status !== 'removed')).toHaveLength(0);
    });
  });

  describe('reorder + concurrency (FR-006/FR-011)', () => {
    it('reorders a layer by writing sequential sort_order', async () => {
      const group = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: null });
      const a = makeItem({ id: parseMenuInternalId(2n), parentId: group.id, routeKey: 'operations', sortOrder: 0 });
      const b = makeItem({ id: parseMenuInternalId(3n), parentId: group.id, routeKey: 'platform', sortOrder: 1 });
      const repo = fakeMenuRepo([group, a, b]);
      const uc = new MenuUseCases(repo, isOpKey);

      await uc.reorder(executor, group.id, { order: [b.id, a.id] });
      const children = await repo.findDirectChildren(executor, group.id);
      expect(children.map((c) => c.id)).toEqual([b.id, a.id]);
    });

    it('rejects reorder with stale expected_updated_at (409)', async () => {
      const group = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: null });
      const a = makeItem({ id: parseMenuInternalId(2n), parentId: group.id, routeKey: 'operations' });
      const repo = fakeMenuRepo([group, a]);
      const uc = new MenuUseCases(repo, isOpKey);

      const stale = new Date('2020-01-01T00:00:00Z');
      await expectAppError(
        uc.reorder(executor, group.id, { order: [a.id], expectedUpdatedAt: stale }),
        'PLATFORM_CONFLICT',
        409,
      );
    });

    it('rejects top-level reorder (parentId null) when root changed since read (409, SC-005)', async () => {
      const g1 = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: 'overview', updatedAt: new Date('2026-02-01T00:00:00Z') });
      const g2 = makeItem({ id: parseMenuInternalId(2n), parentId: null, routeKey: 'platform', updatedAt: new Date('2026-02-01T00:00:00Z') });
      const repo = fakeMenuRepo([g1, g2]);
      const uc = new MenuUseCases(repo, isOpKey);

      // 读取后根层被修改(updated_at 晚于期望)
      const stale = new Date('2026-01-01T00:00:00Z');
      await expectAppError(
        uc.reorder(executor, null, { order: [g2.id, g1.id], expectedUpdatedAt: stale }),
        'PLATFORM_CONFLICT',
        409,
      );
    });

    it('accepts top-level reorder when expected_updated_at matches current root state', async () => {
      const g1 = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: 'overview', updatedAt: new Date('2026-02-01T00:00:00Z') });
      const g2 = makeItem({ id: parseMenuInternalId(2n), parentId: null, routeKey: 'platform', updatedAt: new Date('2026-02-01T00:00:00Z') });
      const repo = fakeMenuRepo([g1, g2]);
      const uc = new MenuUseCases(repo, isOpKey);

      const now = new Date('2026-02-01T00:00:00Z');
      const ids = await uc.reorder(executor, null, { order: [g2.id, g1.id], expectedUpdatedAt: now });
      expect(ids.map((i) => Number(i))).toEqual([2, 1]);
    });
  });

  describe('move (CR-001 / ADR-024)', () => {
    it('moves a top-level node beneath a route-bearing node and normalizes order', async () => {
      const target = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: 'operations', updatedAt: new Date('2026-02-01T00:00:00Z') });
      const moving = makeItem({ id: parseMenuInternalId(2n), parentId: null, routeKey: null, updatedAt: new Date('2026-02-01T00:00:00Z') });
      const repo = fakeMenuRepo([target, moving]);
      const uc = new MenuUseCases(repo, isOpKey);
      const moved = await uc.move(executor, moving.id, {
        parentId: target.id, position: 0,
        expectedUpdatedAt: moving.updatedAt,
        sourceLayerUpdatedAt: moving.updatedAt,
        targetLayerUpdatedAt: target.updatedAt,
      });
      expect(moved.parentId).toBe(target.id);
      expect((await repo.findDirectChildren(executor, target.id)).map((item) => item.id)).toEqual([moving.id]);
    });

    it('moves a route-bearing child back to the top level', async () => {
      const parent = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: null, updatedAt: new Date('2026-02-01T00:00:00Z') });
      const moving = makeItem({ id: parseMenuInternalId(2n), parentId: parent.id, routeKey: 'operations', updatedAt: new Date('2026-02-01T00:00:00Z') });
      const repo = fakeMenuRepo([parent, moving]);
      const uc = new MenuUseCases(repo, isOpKey);
      const moved = await uc.move(executor, moving.id, {
        parentId: null, position: 1,
        expectedUpdatedAt: moving.updatedAt,
        sourceLayerUpdatedAt: moving.updatedAt,
        targetLayerUpdatedAt: parent.updatedAt,
      });
      expect(moved.parentId).toBeNull();
    });

    it('rejects a move below its own descendant', async () => {
      const parent = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: null });
      const child = makeItem({ id: parseMenuInternalId(2n), parentId: parent.id, routeKey: 'operations' });
      const repo = fakeMenuRepo([parent, child]);
      const uc = new MenuUseCases(repo, isOpKey);
      await expectAppError(uc.move(executor, parent.id, {
        parentId: child.id, position: 0,
        expectedUpdatedAt: parent.updatedAt,
        sourceLayerUpdatedAt: parent.updatedAt,
        targetLayerUpdatedAt: child.updatedAt,
      }), 'PLATFORM_INVALID_ARGUMENT', 400);
    });

    it('允许移动到深层目录，但仍拒绝陈旧快照', async () => {
      const root = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: null, updatedAt: new Date('2026-02-01T00:00:00Z') });
      const level2 = makeItem({ id: parseMenuInternalId(2n), parentId: root.id, routeKey: null, updatedAt: new Date('2026-02-01T00:00:00Z') });
      const level3 = makeItem({ id: parseMenuInternalId(3n), parentId: level2.id, routeKey: 'operations', updatedAt: new Date('2026-02-01T00:00:00Z') });
      const moving = makeItem({ id: parseMenuInternalId(4n), parentId: null, routeKey: 'platform', updatedAt: new Date('2026-02-01T00:00:00Z') });
      const repo = fakeMenuRepo([root, level2, level3, moving]);
      const uc = new MenuUseCases(repo, isOpKey);
      const moved = await uc.move(executor, moving.id, {
        parentId: level3.id, position: 0,
        expectedUpdatedAt: moving.updatedAt,
        sourceLayerUpdatedAt: moving.updatedAt,
        targetLayerUpdatedAt: level3.updatedAt,
      });
      expect(moved.parentId).toBe(level3.id);
      await expectAppError(uc.move(executor, moving.id, {
        parentId: root.id, position: 1,
        expectedUpdatedAt: new Date('2020-01-01T00:00:00Z'),
        sourceLayerUpdatedAt: moved.updatedAt,
        targetLayerUpdatedAt: level2.updatedAt,
      }), 'PLATFORM_CONFLICT', 409);
      expect((await repo.findById(executor, moving.id))?.parentId).toBe(level3.id);
    });
  });

  describe('permission catalog validation (FR-007/T026)', () => {
    it('rejects permission key not in operator catalog', async () => {
      const repo = fakeMenuRepo();
      const uc = new MenuUseCases(repo, isOpKey);
      await expectAppError(
        uc.create(executor, { label: 'x', routeKey: 'overview', permissions: ['content.nonexistent.read'] }),
        'PLATFORM_INVALID_ARGUMENT',
        400,
      );
    });

    it('accepts permission keys in the catalog and stores them', async () => {
      const repo = fakeMenuRepo();
      const uc = new MenuUseCases(repo, isOpKey);
      const item = await uc.create(executor, {
        label: '操作员管理',
        routeKey: 'operations.operators',
        permissions: ['operations.operators.read'],
      });
      expect(repo.permissions.get(item.id.toString())).toEqual(['operations.operators.read']);
    });
  });

  describe('route whitelist (FR-008/T031)', () => {
    it('接受已登记的中文和老挝语内容类别路由', async () => {
      const repo = fakeMenuRepo();
      const uc = new MenuUseCases(repo, isOpKey);

      const chinese = await uc.create(executor, { label: '拼音管理', routeKey: 'content.zh.pinyin' });
      const lao = await uc.create(executor, { label: '老挝语字母管理', routeKey: 'content.lo.letters' });

      expect(chinese.routeKey).toBe('content.zh.pinyin');
      expect(lao.routeKey).toBe('content.lo.letters');
    });

    it('rejects route_key outside whitelist', async () => {
      const repo = fakeMenuRepo();
      const uc = new MenuUseCases(repo, isOpKey);
      await expectAppError(
        uc.create(executor, { label: 'x', routeKey: 'https://evil.example' }),
        'PLATFORM_INVALID_ARGUMENT',
        400,
      );
    });
  });

  describe('listTree (FR-001)', () => {
    it('returns nested tree without removed items', async () => {
      const group = makeItem({ id: parseMenuInternalId(1n), parentId: null, routeKey: null });
      const child = makeItem({ id: parseMenuInternalId(2n), parentId: group.id, routeKey: 'operations' });
      const removed = makeItem({ id: parseMenuInternalId(3n), parentId: group.id, routeKey: 'platform', status: 'removed' as MenuStatus });
      const repo = fakeMenuRepo([group, child, removed]);
      const uc = new MenuUseCases(repo, isOpKey);

      const tree = await uc.listTree(executor);
      expect(tree).toHaveLength(1);
      expect(tree[0]!.children).toHaveLength(1);
      expect(tree[0]!.children[0]!.routeKey).toBe('operations');
    });
  });
});
