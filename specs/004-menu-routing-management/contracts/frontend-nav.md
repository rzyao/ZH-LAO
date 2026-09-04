# Frontend Contract: 配置驱动导航 (004-menu-routing-management)

**Feature Branch**: `004-menu-routing-management` | **Date**: 2026-09-03

> ⚠️ **目标契约(Proposed)**: 本契约描述前端从硬编码导航迁移到配置驱动渲染的
> 结构。批准后落入 `apps/admin/src/navigation/` 与 `apps/admin/src/app/router/`。

## 目标结构

```text
apps/admin/src/
├── navigation/
│   ├── config.tsx            # 统一递归 NAV_ITEMS，作为内置安全回退树
│   ├── route-registry.ts     # 新增: ADMIN_ROUTE_TARGETS(白名单单一事实源)
│   ├── use-nav-config.ts     # 新增: useNavConfig() hook (fetch + fallback + 权限过滤)
│   └── types.ts              # 新增(或并入 config): NavNode / RouteTarget 类型
├── features/platform/
│   ├── pages/menus.tsx       # 新增: 菜单管理页 (/platform/menus)
│   └── api/menus-api.ts      # 新增: 菜单管理 API 调用层 (React Query hooks)
└── app/router/router.tsx     # 改造: 消费 route-registry 生成路由; 新增 /platform/menus
```

## 1. 路由注册表 `route-registry.ts`

`ADMIN_ROUTE_TARGETS` 是白名单**单一事实源**,同时被路由生成与菜单管理消费:

```ts
export interface RouteTarget {
  key: string          // 稳定标识 (FR-015), 如 'platform.feature_flags'
  href: string         // 实际路径, 如 '/platform/feature-flags'
  label: string        // 显示名, 供菜单管理下拉框
  domain?: string      // 所属 Domain (可选)
}

export const ADMIN_ROUTE_TARGETS: readonly RouteTarget[] = [ /* 11 domain + operations/platform 子页 + overview + change-password 等 */ ]
export const ROUTE_TARGET_KEYS: ReadonlySet<string> = new Set(ADMIN_ROUTE_TARGETS.map(t => t.key))
```

- `router.tsx` 从 `ADMIN_ROUTE_TARGETS` 生成已注册路由(或至少由它派生路径常量)。
- 菜单管理页「目标路由」下拉框只枚举 `ADMIN_ROUTE_TARGETS` —— 天然无法输入
  白名单外路径(第一道校验)。

## 2. 导航数据源 `use-nav-config.ts`

```ts
export function useNavConfig() {
  const menusQuery = useMenusQuery()           // fetch GET /platform/menus
  if (menusQuery.isError || !menusQuery.data?.groups?.length) {
    return { nav: FALLBACK_NAV, source: 'fallback' }   // FR-009/FR-012
  }
  return { nav: normalizeToNav(menusQuery.data), source: 'remote' }
}
```

- **fetch 失败/空树 → `NAV_ITEMS` 安全回退树**，绝不白屏。
- **成功 → `normalizeToNav()`**：后端嵌套树递归映射为内部 `NavItem[]`。所有节点使用同一
  类型，`href` 可选，`children` 可递归；每个节点用 `can()` 过滤（多权限 OR）。<!-- CR-004 -->
- **最小导航(FR-012)**: 空树时 fallback 渲染 总览 `/` + 退出登录 + 「菜单管理」
  入口(若有 `platform.menus.read`)—— 硬编码 `/platform/menus`,防止「配置清空 →
  进不去管理页 → 无法重建」死锁。

## 3. Sidebar 改造

- `Sidebar` 消费 `useNavConfig()` 的递归 `nav`，不再包含分组适配层。
- `isActive(pathname, href)` 前缀匹配逻辑**保留不动**(与数据来源无关)。
- `findNavItemByHref` / `allNavItems` 改造为基于当前 `nav`(成功时)/`FALLBACK_NAV`(失败时)
  的统一读取;`breadcrumb.tsx` 复用同一来源。
- `NavItem` 接口包含可选 `href`、递归 `children`、`routeKey`、`permissions` 和图标。
- 图标渲染: `ICON_REGISTRY[iconKey] ?? FallbackIcon` 容错(未知 icon 不崩溃)。
- 每层目录默认收起并使用与页面相同的正常导航字号；带路由且含子项的节点点击链接行时同时
  跳转和伸缩，并暴露 `aria-expanded`；箭头只伸缩、不跳转。链接与箭头共用整行选中容器，
  激活背景和左侧高亮边不得断开。面包屑递归查找完整祖先路径。<!-- CR-005 -->

## 4. 菜单管理页 `/platform/menus`

- 页面文件 `apps/admin/src/features/platform/pages/menus.tsx`。
- 路由注册: `/platform/menus`(加入 `router.tsx` 与 `route-registry.ts`)。
- 功能:
  - 树形展示全部菜单项（任一节点可带路由和子项）+ 状态 + 顺序。
  - 创建/编辑/删除（移除）/拖拽重排与跨层移动；任意层级都可继续新建子项，不设业务深度上限。<!-- CR-004 -->
  - 「目标路由」下拉框 = `ADMIN_ROUTE_TARGETS`。
  - 可见性权限多选(从可用的权限集合选择,OR 语义)。
  - 写操作带 `expected_updated_at`;`409` 冲突复用现有 `isConflictError`/`mutationErrorMessage`。
  - 写成功 → `invalidateQueries(['platform-admin','menus'])`,Sidebar 下次渲染即时生效。

## 5. 菜单管理 API 调用层 `menus-api.ts`

React Query hooks(对齐现有 Platform 页面模式):

```ts
export const useMenusQuery = () => useQuery({ queryKey: ['platform-admin','menus'], queryFn: fetchMenus })
export const useRouteTargetsQuery = () => useQuery({ queryKey: ['platform-admin','route-targets'], queryFn: fetchRouteTargets })
export const useCreateMenu = () => useMutation({ mutationFn: createMenu, onSuccess: invalidateMenus })
export const useUpdateMenu = () => useMutation({ mutationFn: updateMenu, onSuccess: invalidateMenus })
export const useRemoveMenu = () => useMutation({ mutationFn: removeMenu, onSuccess: invalidateMenus })
export const useReorderMenus = () => useMutation({ mutationFn: reorderMenus, onSuccess: invalidateMenus })
export const useMoveMenu = () => useMutation({ mutationFn: moveMenu, onSuccess: invalidateMenus })
```

## 权限与安全

- 菜单**可见性**过滤在前端 `can()`(OR),服务端 `platform.menus.*` 控制「能否管理」。
- 菜单管理页入口: 需 `platform.menus.read`(写操作需 `platform.menus.write`,用
  `useExactPermission` 精确匹配,对齐现有 Platform 页面)。
- 可见性隐藏仅为界面层;服务端始终独立授权(US-002-AS4: 手动输入无权限 URL →
  HTTP 403)。
