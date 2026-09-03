# Implementation Plan: 后台菜单与路由配置管理 (Menu & Routing Management)

**Branch**: `004-menu-routing-management` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-menu-routing-management/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

在 Admin 后台将**硬编码的侧边栏导航与路由**升级为**运营人员可在后台 UI 在线配置的菜单结构**,路由目标受安全白名单约束。核心:新增 `platform.menus` 数据模型(并入 Platform 域,已由 ADR-022 批准)、菜单管理 REST API、前端配置驱动渲染 + 权限过滤、首次上线 seed 预置当前导航等价配置。

三个已确认的产品决策:① 创建/编辑即生效(无 draft);② 可见性权限多权限 OR;③ 首次上线 seed 预置当前 `NAV_GROUPS`/`SECONDARY_NAV` 等价配置。

> ✅ 本功能打破的三项冻结基线(Platform 6 表、Admin 信息架构、Operations 权限 Catalog)
> 已由 **ADR-022**(`docs/docs/developer/reference/adr/ADR-022-platform-menu-routing-config.md`,`frozen`)
> + **D-155**(`docs/docs/developer/reference/governance/design-register.md`,`frozen`)于 2026-09-03 正式批准,可进入实施。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript(后端 Fastify + Node.js;前端 React 19 + TanStack Router)/ Node LTS

**Primary Dependencies**: `fastify`(后端路由)、`zod`(校验)、`@tanstack/react-router`(前端路由)、`lucide-react`(图标)、`postgres`(数据库 executor)

**Storage**: PostgreSQL(`platform` schema,新增菜单表;沿用冻结迁移 + manifest 机制)

**Testing**: Vitest(单测/契约测试)、Playwright(smoke E2E);后端沿用现有 use-case/route 测试模式

**Target Platform**: Linux server(后端)+ 现代浏览器 Web(Admin 后台)

**Project Type**: web-service + web-app(monorepo: `apps/backend` + `apps/admin`)

**Performance Goals**: 菜单配置查询为低频小数据量(几十条),渲染延迟可忽略;目标 <100ms 服务端菜单列表响应

**Constraints**: 不可修改冻结迁移 `0300_platform.sql`(新表走新迁移);遵守 Platform 数据设计约定(BIGINT identity PK、`varchar + CHECK`、`TIMESTAMPTZ`、域内 FK、无 JSONB/metadata/created_by);权限 key 由代码 Registry 定义

**Scale/Scope**: 菜单项规模预期 <500 条;影响 Admin 全部运营人员导航;仅 Admin 后台,不涉及 C 端

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Check | Status |
|---|-----------|-------|--------|
| I | Source of Truth Priority | 本功能曾为架构变更请求,spec 引用真实冻结工件(迁移/权限 catalog/导航常量),未捏造契约 | ✅ PASS |
| II | Existing Code Is Engineering Reality, Not Product Authority | 现有硬编码导航作为「被迁移的现状」参考,不反向推导产品需求 | ✅ PASS |
| IV | Verifiability | 每条 FR 对应 Given/When/Then 验收场景 | ✅ PASS |
| V | State Machines | 菜单项状态机(active/disabled/removed)已在 spec 声明 | ✅ PASS |
| VI | Contract Reference Reality | 现状契约全部指向真实文件;目标契约由 ADR-022 批准 | ✅ PASS |
| VII | Decision Budget | 不修改冻结迁移;菜单表走新迁移;权限 catalog 新增 key(受控变更) | ✅ PASS(ADR-022 已批准) |
| VIII | Conflict Must STOP | **SPEC_CONFLICT** 已解决:打破 Platform 6 表 / 信息架构 / 权限 catalog 冻结,已由 ADR-022 + D-155 正式批准(2026-09-03) | ✅ PASS(已批准) |
| X | Grounding Gate | Authority Snapshot 记录基准 commit 与引用工件 | ✅ PASS |

**Gate 裁决**(ADR-022 批准后复验):
- **SPEC_CONFLICT(Principle VIII)**: 已由设计裁决 **ADR-022**(`frozen`)+ **D-155**(`frozen`)于 2026-09-03 正式批准。GATE **通过**,plan 可正常进入 `/speckit-tasks`。
- **Phase 1 设计复验**: 数据模型与契约未引入新违反——新表遵循 Platform 数据设计约定(VI)、权限由 Registry 定义且三段式(VI)、乐观并发复用 `expected_updated_at` 先例而非新 version 列、状态机遵循 V。✅
- 其余 Gate 全部 PASS。

## Locked Decisions *(per Constitution Principle VII)*

> LOCKED 决策来自权威文档/ADR/冻结迁移,实施 MUST NOT 修改。本功能**触碰但不修改**以下 LOCKED 决策;新增契约已由 ADR-022 批准。

| Decision | Source | Why LOCKED | 本功能处置 |
| --- | --- | --- | --- |
| Platform schema 冻结 6 张业务表 | `database/migrations/0300_platform.sql`、`domains/platform/database.md` | 冻结边界,不增改 | **不修改** 0300;新增 `platform.menus` 走新迁移 `1270_platform_menus.sql`(ADR-022 批准) |
| 权限由代码 Registry 定义,无 permissions 表 | `domains/operations/rbac.md` | 权限能力与实现不脱节 | **遵循**;菜单权限 key 加入 `OPERATOR_PERMISSION_CATALOG`(ADR-022 批准) |
| 权限 key 三段式 `<domain>.<resource>.<action>` | `domains/operations/rbac.md` | 授权模型契约 | **遵循**;新增 `platform.menus.read` / `platform.menus.write` |
| Platform 数据设计约定(BIGINT identity PK、varchar+CHECK、TIMESTAMPTZ、域内 FK、无 JSONB/metadata/created_by) | `domains/platform/database.md` | 全局 DB 设计原则 | **遵循**;菜单表遵守全部约定 |
| Admin 信息架构(按业务工作流组织) | `config.tsx`(ADMIN_FOUNDATION_PLAN §8) | 导航信息架构基线 | **保留原则**;菜单可配置化但信息架构语义不变 |
| 后台成功管理动作写 `operator_audit_logs`(append-only) | `domains/operations/rbac.md`、`database/migrations/0200_operations.sql` | 审计不可变性 | **遵循**;菜单变更写审计,不修改审计表 |
| 后端认证/授权链路(requireAuthentication + authorizer.requirePermission) | `modules/operations/public/` | 安全 RBAC 不变量 | **遵循**;菜单接口复用 |

## Authority Snapshot

- **Base Commit**: `e604277fa90d871cb2a2a199df103ee7a7b904f3`(main, 2026-09-03)
- **Scope Type / ID**: `feature:004-menu-routing-management`(跨 domain:platform + admin 前端 + operations 权限)
- **Referenced Authority Docs**:
  - `docs/docs/developer/reference/domains/platform/index.md` / `database.md`(Platform 6 表冻结边界,由 ADR-022 批准新增菜单能力)
  - `docs/docs/developer/reference/domains/operations/rbac.md`(RBAC 授权模型、权限语法、audit)
  - `docs/docs/developer/reference/admin/navigation.md` / `pages.md`(Admin 信息架构权威文档)
  - `database/migrations/0300_platform.sql`(冻结 Platform schema)
  - `database/migrations/0200_operations.sql`(operations schema: operators/roles/operator_roles/role_permissions/operator_audit_logs)
  - `specs/004-menu-routing-management/spec.md`(本 feature spec)
- **Existing Code / Schema / API / Contracts checked**(pre-plan scan;deltas only):
  - 后端 Platform 模块分层:`application/services/platform-management-service.ts` → `application/use-cases/*` → `application/ports/platform-repositories.ts` → `infrastructure/repositories.ts` → `http/management-routes.ts` + `http/composition.ts`
  - 权限 catalog:`apps/backend/src/modules/operations/public/permissions.ts`(`OPERATOR_PERMISSION_CATALOG`,当前无菜单权限 → 需新增)
  - 前端导航:`apps/admin/src/navigation/config.tsx`(`NAV_GROUPS`/`SECONDARY_NAV`/`findNavItemByHref`/`allNavItems`)
  - 前端路由:`apps/admin/src/app/router/router.tsx`(全部路由清单已枚举,白名单来源)
  - 前端权限:`apps/admin/src/auth/context/AuthContext.tsx`(`can()` / `permissions[]`)、`apps/admin/src/auth/permissions.ts`(`DomainName` 含 platform)
  - 前端 shell:`apps/admin/src/components/navigation/app-shell.tsx` / `sidebar.tsx`(消费 NAV_GROUPS)
  - 现有测试:`apps/admin/src/**/*.test.ts*`(Vitest)、`apps/admin/e2e/smoke.spec.ts`(Playwright)、后端无 platform 独立测试目录(测试在模块内)

## Project Structure

### Documentation (this feature)

```text
specs/004-menu-routing-management/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   ├── http-api.md      # 后端菜单管理 API 契约
│   └── frontend-nav.md  # 前端配置驱动导航契约
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Monorepo: apps/backend (Fastify) + apps/admin (React), + database/migrations (冻结 SQL)

database/migrations/
└── 1270_platform_menus.sql        # 新增: menus + menu_permissions + seed

apps/backend/src/modules/
├── platform/
│   ├── domain/
│   │   ├── menu.ts                # 新增: MenuItem 领域类型 + MenuPermission
│   │   └── ids.ts                 # 扩展: MenuInternalId (bigint brand)
│   ├── application/
│   │   ├── ports/
│   │   │   └── platform-repositories.ts   # 扩展: MenuRepository
│   │   ├── use-cases/
│   │   │   └── menu-use-cases.ts          # 新增: 创建/编辑/删除/重排 + 白名单校验
│   │   └── services/
│   │       └── platform-management-service.ts  # 扩展: 菜单方法
│   ├── infrastructure/
│   │   └── repositories.ts        # 扩展: PostgresMenuRepository
│   └── http/
│       ├── management-routes.ts   # 扩展: /platform/menus* + route-targets
│       └── composition.ts         # 扩展: 装配菜单 use-cases
├── operations/
│   └── public/
│       └── permissions.ts         # 扩展: platform.menus.read / .write

apps/backend/scripts/
└── generate-migration-manifest.mjs  # 运行: 重新生成 required-migrations.generated.ts

apps/backend/src/database/
└── required-migrations.generated.ts  # 重新生成(含 1270)

apps/admin/src/
├── navigation/
│   ├── config.tsx                 # 改造: NAV_GROUPS/SECONDARY_NAV 保留为 FALLBACK_NAV
│   ├── route-registry.ts          # 新增: ADMIN_ROUTE_TARGETS (白名单单一事实源)
│   ├── use-nav-config.ts          # 新增: useNavConfig() hook
│   └── types.ts                   # 新增: NavNode / RouteTarget
├── features/platform/
│   ├── api/menus-api.ts           # 新增: React Query hooks
│   └── pages/menus.tsx            # 新增: 菜单管理页
└── app/router/router.tsx          # 改造: 消费 route-registry + 新增 /platform/menus

apps/admin/src/components/navigation/
├── sidebar.tsx                    # 改造: 消费 useNavConfig()
└── breadcrumb.tsx                 # 改造: 复用 useNavConfig() 数据源

apps/admin/src/auth/permissions.ts # 扩展: 无变更 (DomainName 含 platform, PermissionAction 含 read/write)

docs/docs/developer/reference/
├── admin/navigation.md            # 改造: 记录配置驱动导航
├── admin/pages.md                 # 改造: 登记 /platform/menus 页面
└── domains/platform/database.md   # 改造: 6 表 → 新增 menus (ADR 修订落点)
```

**Structure Decision**: 采用现有 monorepo 分层(backend 领域分层 + admin 前端 feature
结构 + 冻结迁移目录)。菜单功能作为 Platform 域新能力,完全复用既有平台模块模式
(Service → UseCase → Repository port → Infrastructure → routes)。前端新增导航配置
消费层,保留现有激活态算法与 UI。新增迁移文件 `1270_platform_menus.sql`(0300 冻结
文件不改)。

## Complexity Tracking

> Constitution Check 的 SPEC_CONFLICT GATE 已由 ADR-022 + D-155 批准。
> 以下 justify 为什么需要打破冻结边界(记录于 ADR-022,供回溯)。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 打破 Platform 冻结 6 表边界(新增 menus/menu_permissions) | 菜单配置是 Platform「产品运行控制面」的自然能力,且用户已确认归属 Platform 域 | 新增独立 menu 域 → 需扩展 DomainName 联合类型 + 新 schema,更重的架构变更;配置驱动重构(无新表)→ 无法满足「完全动态(后台可编辑)」 |
| 打破 Admin 信息架构冻结(硬编码 → 配置驱动) | FR-014「配置变更无需重新发布前端」只有配置驱动渲染能满足 | 保留硬编码 + 仅前端重构 → 无法在线编辑,不满足核心价值 |
| 打破 Operations 权限 Catalog 冻结(新增 2 个菜单 key) | 菜单管理需要独立读写权限(FR-016) | 复用现有 platform 权限(如 feature_flags.write)→ 权限语义错位,无独立管控 |
| `menu_permissions` 子表(多权限 OR) | FR-007 明确多权限、任一匹配 | 单列权限(违反 OR);逗号分隔/JSONB(反模式,见 research 1.4);「菜单↔role」(跨域 FK 禁止) |
