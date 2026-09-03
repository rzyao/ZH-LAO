import {
  assertMenuRouteKeyWhitelisted,
  conflict,
  invalidArgument,
  notFound,
  parseMenuInternalId,
  validateMenuIcon,
  validateMenuLabel,
  validateMenuPermissionKey,
  validateMenuRouteKey,
  validateMenuSortOrder,
  type MenuInternalId,
  type MenuItem,
  type MenuStatus,
  type MenuTreeNode,
} from '../../domain/index.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { MenuRepository } from '../ports/platform-repositories.js';

const MAX_DEPTH = 3; // 分组(1) → 一级项(2) → 子项(3)(ADR-022 §2 / FR-003)

export type MenuCreateInput = Readonly<{
  parentId?: MenuInternalId | null;
  label: string;
  routeKey?: string | null;
  icon?: string | null;
  sortOrder?: number;
  permissions?: readonly string[];
}>;

export type MenuUpdateInput = Readonly<{
  label?: string;
  routeKey?: string | null;
  icon?: string | null;
  sortOrder?: number;
  status?: MenuStatus;
  permissions?: readonly string[];
  expectedUpdatedAt?: Date;
}>;

export type MenuReorderInput = Readonly<{
  order: readonly MenuInternalId[];
  expectedUpdatedAt?: Date;
}>;

/** 校验权限 key ∈ OPERATOR_PERMISSION_CATALOG(FR-007 / D-106: 权限由代码 Registry 定义)。 */
function validatePermissionsAgainstCatalog(permissions: readonly string[], isOperatorPermissionKey: (k: string) => boolean): void {
  for (const key of permissions) {
    validateMenuPermissionKey(key);
    if (!isOperatorPermissionKey(key)) {
      throw invalidArgument(`Permission key '${key}' is not in the operator permission catalog`);
    }
  }
}

export class MenuUseCases {
  constructor(
    private readonly menuRepo: MenuRepository,
    private readonly isOperatorPermissionKey: (k: string) => boolean,
  ) {}

  /** 计算 parent_id 链的深度(1 = 顶层分组,2 = 一级项,3 = 子项)。 */
  private async depthOf(executor: DatabaseExecutor, parentId: MenuInternalId | null): Promise<number> {
    if (parentId === null) return 1;
    let depth = 2;
    let cursor = parentId;
    // 最多向上走 MAX_DEPTH-1 步;超限即超深
    for (let i = 0; i < MAX_DEPTH; i++) {
      const node = await this.menuRepo.findById(executor, cursor);
      if (!node) {
        throw notFound(`Parent menu ${cursor} not found`);
      }
      if (node.status === 'removed') {
        throw invalidArgument(`Parent menu ${cursor} is removed and cannot host children`);
      }
      if (node.parentId === null) break;
      cursor = node.parentId;
      depth += 1;
      if (depth > MAX_DEPTH) break;
    }
    return depth;
  }

  async create(executor: DatabaseExecutor, input: MenuCreateInput): Promise<MenuItem> {
    const parentId = input.parentId === undefined ? null : parseMenuInternalId(input.parentId);
    const label = validateMenuLabel(input.label);
    const routeKey = validateMenuRouteKey(input.routeKey ?? null);
    const icon = validateMenuIcon(input.icon ?? null);
    const sortOrder = validateMenuSortOrder(input.sortOrder ?? 0);
    const permissions = input.permissions ?? [];

    // 非分组必须要有 route_key,且必须在白名单内(FR-008 / ADR-022 §6)
    if (parentId !== null && !routeKey) {
      throw invalidArgument('Non-group menu items must have a route_key');
    }
    if (routeKey) {
      assertMenuRouteKeyWhitelisted(routeKey);
    }
    validatePermissionsAgainstCatalog(permissions, this.isOperatorPermissionKey);

    const depth = await this.depthOf(executor, parentId);
    if (depth > MAX_DEPTH) {
      throw invalidArgument(`Menu hierarchy exceeds max depth of ${MAX_DEPTH}`);
    }

    const item = await this.menuRepo.create(executor, {
      parentId,
      label,
      routeKey,
      icon,
      sortOrder,
      status: 'active', // 创建/编辑即生效,无 draft(2026-09-03 澄清)
    });

    if (permissions.length > 0) {
      await this.menuRepo.replacePermissions(executor, item.id, permissions);
    }
    return item;
  }

  async update(executor: DatabaseExecutor, id: MenuInternalId, input: MenuUpdateInput): Promise<MenuItem> {
    const menuId = parseMenuInternalId(id);
    const existing = await this.menuRepo.findById(executor, menuId);
    if (!existing) {
      throw notFound(`Menu ${menuId} not found`);
    }
    if (existing.status === 'removed') {
      throw invalidArgument(`Menu ${menuId} is removed and cannot be edited`);
    }

    if (input.expectedUpdatedAt && existing.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
      throw conflict('Menu was modified concurrently');
    }

    const patch: {
      label?: string;
      routeKey?: string | null;
      icon?: string | null;
      sortOrder?: number;
      status?: MenuStatus;
    } = {};

    if (input.label !== undefined) patch.label = validateMenuLabel(input.label);
    if (input.routeKey !== undefined) {
      const routeKey = validateMenuRouteKey(input.routeKey);
      // 非分组必须有 route_key;分组允许为空
      if (existing.parentId !== null && !routeKey) {
        throw invalidArgument('Non-group menu items must have a route_key');
      }
      if (routeKey) assertMenuRouteKeyWhitelisted(routeKey);
      patch.routeKey = routeKey;
    }
    if (input.icon !== undefined) patch.icon = validateMenuIcon(input.icon);
    if (input.sortOrder !== undefined) patch.sortOrder = validateMenuSortOrder(input.sortOrder);
    if (input.status !== undefined) {
      // 状态机: active ↔ disabled;removed 走 remove 端点
      if (input.status === 'removed') {
        throw invalidArgument('Use the remove endpoint to delete a menu item');
      }
      if (input.status === 'active' && existing.status === 'disabled') {
        // disabled → active 需 route_key 仍有效(白名单)
        const effectiveRouteKey = existing.routeKey;
        if (!effectiveRouteKey) {
          throw invalidArgument('Cannot re-enable a menu without a route_key');
        }
        assertMenuRouteKeyWhitelisted(effectiveRouteKey);
      }
      patch.status = input.status;
    }
    if (input.permissions !== undefined) {
      validatePermissionsAgainstCatalog(input.permissions, this.isOperatorPermissionKey);
      await this.menuRepo.replacePermissions(executor, menuId, input.permissions);
    }

    const updated = await this.menuRepo.update(executor, menuId, patch);
    return updated;
  }

  /** 删除 = 置 removed(终态),级联子项(FR-005 / ADR-022 §3)。 */
  async remove(executor: DatabaseExecutor, id: MenuInternalId, expectedUpdatedAt?: Date): Promise<MenuItem> {
    const menuId = parseMenuInternalId(id);
    const existing = await this.menuRepo.findById(executor, menuId);
    if (!existing) {
      throw notFound(`Menu ${menuId} not found`);
    }
    if (existing.status === 'removed') {
      return existing; // 幂等:已 removed
    }
    if (expectedUpdatedAt && existing.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw conflict('Menu was modified concurrently');
    }

    // 级联删除直接子项(递归由 SQL 或逐层;此处递归收集)
    const cascade = await this.collectDescendants(executor, menuId);
    await this.menuRepo.update(executor, menuId, { status: 'removed' });
    for (const child of cascade) {
      await this.menuRepo.update(executor, child.id, { status: 'removed' });
    }
    return { ...existing, status: 'removed' };
  }

  private async collectDescendants(executor: DatabaseExecutor, parentId: MenuInternalId): Promise<readonly MenuItem[]> {
    const children = await this.menuRepo.findDirectChildren(executor, parentId);
    const result: MenuItem[] = [];
    for (const child of children) {
      result.push(child);
      result.push(...(await this.collectDescendants(executor, child.id)));
    }
    return result;
  }

  /** 整体重排单层顺序(FR-006 / ADR-022 §7): order 为该层全量有序 id。 */
  async reorder(
    executor: DatabaseExecutor,
    parentId: MenuInternalId | null,
    input: MenuReorderInput,
  ): Promise<readonly MenuInternalId[]> {
    const parent = parentId === null ? null : parseMenuInternalId(parentId);

    // 校验父项存在(若指定)
    if (parent !== null) {
      const existing = await this.menuRepo.findById(executor, parent);
      if (!existing || existing.status === 'removed') {
        throw notFound(`Parent menu ${parent} not found`);
      }
      if (input.expectedUpdatedAt && existing.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
        throw conflict('Menu order was modified concurrently');
      }
    }

    // 顶层重排(parent_id=null):无父节点承载版本,以根层分组最近 updated_at 作为乐观锁。
    // 若请求期望时间早于当前根层最新更新,说明有人在读取后被修改 → 409(SC-005)。
    if (parent === null && input.expectedUpdatedAt) {
      const rootGroups = await this.menuRepo.findDirectChildren(executor, null);
      const maxRootUpdatedAt = rootGroups.reduce<Date | null>(
        (acc, g) => (acc === null || g.updatedAt > acc ? g.updatedAt : acc),
        null,
      );
      if (maxRootUpdatedAt && maxRootUpdatedAt.getTime() > input.expectedUpdatedAt.getTime()) {
        throw conflict('Menu order was modified concurrently');
      }
    }

    const ids = input.order.map((id) => parseMenuInternalId(id));
    // 该层现有项集合
    const existingChildren = await this.menuRepo.findDirectChildren(executor, parent);
    const existingIdSet = new Set(existingChildren.map((c) => c.id.toString()));
    for (const id of ids) {
      if (!existingIdSet.has(id.toString())) {
        throw invalidArgument(`Menu ${id} is not a direct child of parent ${parent ?? 'root'}`);
      }
    }

    let idx = 0;
    for (const id of ids) {
      await this.menuRepo.update(executor, id, { sortOrder: idx });
      idx += 1;
    }
    return ids;
  }

  /** 组装嵌套树(供管理页 + Sidebar 消费);removed 不出现。 */
  async listTree(executor: DatabaseExecutor): Promise<readonly MenuTreeNode[]> {
    const items = await this.menuRepo.listAll(executor);
    const permissions = await this.menuRepo.listPermissionsForMenus(
      executor,
      items.map((i) => i.id),
    );
    const permMap = new Map<string, readonly string[]>();
    for (const p of permissions) {
      const key = p.menuId.toString();
      permMap.set(key, [...(permMap.get(key) ?? []), p.permissionKey]);
    }

    const byParent = new Map<string | 'root', MenuItem[]>();
    for (const item of items) {
      const bucketKey = item.parentId === null ? 'root' : item.parentId.toString();
      const bucket = byParent.get(bucketKey) ?? [];
      bucket.push(item);
      byParent.set(bucketKey, bucket);
    }

    const build = (parentKey: string | 'root'): MenuTreeNode[] => {
      const children = byParent.get(parentKey) ?? [];
      return children
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id))
        .map((item) => ({
          id: item.id,
          label: item.label,
          routeKey: item.routeKey,
          icon: item.icon,
          sortOrder: item.sortOrder,
          status: item.status,
          updatedAt: item.updatedAt,
          permissions: permMap.get(item.id.toString()) ?? [],
          children: build(item.id.toString()),
        }));
    };

    return build('root');
  }
}
