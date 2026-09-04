import { invalidArgument } from './errors.js';
import type { MenuInternalId } from './ids.js';

/** 菜单项状态机(ADR-022):初始即 active,removed 为终态(审计保留,永不物理删除)。 */
export type MenuStatus = 'active' | 'disabled' | 'removed';

/** 菜单项：自引用目录树，parent_id NULL 表示根节点，不限定业务层级。 */
export type MenuItem = Readonly<{
  id: MenuInternalId;
  parentId: MenuInternalId | null;
  label: string;
  routeKey: string | null;
  icon: string | null;
  sortOrder: number;
  status: MenuStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

/** 可见性权限:多权限 OR(任一命中即可见);空集合 = 对所有已认证操作员可见。 */
export type MenuPermission = Readonly<{
  menuId: MenuInternalId;
  permissionKey: string;
  createdAt: Date;
}>;

/** 由 repository 组装、供管理 API / Sidebar 消费的树节点。 */
export type MenuTreeNode = Readonly<{
  id: MenuInternalId;
  label: string;
  routeKey: string | null;
  icon: string | null;
  sortOrder: number;
  status: MenuStatus;
  updatedAt: Date;
  permissions: readonly string[];
  children: readonly MenuTreeNode[];
}>;

const LABEL_MAX = 120;
const ROUTE_KEY_MAX = 100;
const ICON_MAX = 64;
/** 稳定路由目标 key:允许 三段式(如 platform.feature_flags)与分组级 key(如 operations)。 */
const ROUTE_KEY_REGEX = /^[a-z][a-z0-9_.]*$/;
const PERMISSION_KEY_REGEX = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/;

/**
 * 后端镜像白名单(ADR-022 §6):仅 key 字符串,不复制 href。
 * 与前端 apps/admin/src/navigation/route-registry.ts 的 ADMIN_ROUTE_TARGETS 保持一致。
 * 前端下拉框(第一道)+ 此处服务端校验(第二道,防绕过 UI 直连 API)。
 */
export const MENU_ROUTE_TARGET_KEYS: readonly string[] = Object.freeze([
  'overview',
  'content',
  'learning',
  'audio',
  'identity',
  'social',
  'chat',
  'commerce',
  'rewards',
  'trust',
  'operations',
  'platform',
  'content.letters',
  'content.syllables',
  'content.vocabulary',
  'content.sentences',
  'content.zh.pinyin',
  'content.zh.syllables',
  'content.zh.hanzi',
  'content.zh.words',
  'content.zh.sentences',
  'content.zh.review',
  'content.lo.letters',
  'content.lo.syllables',
  'content.lo.words',
  'content.lo.sentences',
  'content.lo.review',
  'operations.operators',
  'operations.roles',
  'operations.audit_logs',
  'platform.feature_flags',
  'platform.runtime_configs',
  'platform.app_versions',
  'platform.announcements',
  'platform.regions',
  'platform.menus',
  'change_password',
  'account.change_password',
] as const);

const MENU_ROUTE_TARGET_KEY_SET: ReadonlySet<string> = new Set(MENU_ROUTE_TARGET_KEYS);

export function validateMenuLabel(label: string): string {
  const trimmed = label?.trim();
  if (typeof label !== 'string' || !trimmed || trimmed.length > LABEL_MAX) {
    throw invalidArgument(`Menu label cannot be blank and must be <= ${LABEL_MAX} characters`);
  }
  return trimmed;
}

export function validateMenuRouteKey(routeKey: string | null): string | null {
  if (routeKey === null || routeKey === undefined) return null;
  if (typeof routeKey !== 'string' || routeKey.length > ROUTE_KEY_MAX || !ROUTE_KEY_REGEX.test(routeKey)) {
    throw invalidArgument(`Invalid route_key '${routeKey}'. Must match ^[a-z][a-z0-9_.]*$ and be <= ${ROUTE_KEY_MAX} characters`);
  }
  return routeKey;
}

export function validateMenuIcon(icon: string | null): string | null {
  if (icon === null || icon === undefined) return null;
  if (typeof icon !== 'string' || icon.trim().length === 0 || icon.length > ICON_MAX) {
    throw invalidArgument(`Invalid icon '${icon}'. Must be a non-blank string <= ${ICON_MAX} characters`);
  }
  return icon.trim();
}

export function validateMenuSortOrder(sortOrder: number): number {
  if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder) || sortOrder < 0) {
    throw invalidArgument('Menu sort_order must be a non-negative integer');
  }
  return sortOrder;
}

/** 校验菜单权限 key 三段式格式(与 operations.role_permissions 同款 CHECK)。 */
export function validateMenuPermissionKey(key: string): string {
  if (typeof key !== 'string' || !PERMISSION_KEY_REGEX.test(key)) {
    throw invalidArgument(`Invalid permission key '${key}'. Must match <domain>.<resource>.<action>`);
  }
  return key;
}

/** 校验 route_key ∈ 白名单(服务端第二道校验)。 */
export function assertMenuRouteKeyWhitelisted(routeKey: string): void {
  if (!MENU_ROUTE_TARGET_KEY_SET.has(routeKey)) {
    throw invalidArgument(`Route target '${routeKey}' is not in the whitelist; only registered admin pages are allowed`);
  }
}
