---
status: completed
document: OPERATIONS_ADMIN_IMPLEMENTATION_REPORT
last_updated: 2026-09-02
phase: Operations Admin Control Plane
---

# Operations Admin RBAC 实施交付报告

本报告记录 `apps/admin` Operations 运营权限控制面（操作员管理、角色与权限矩阵、操作审计日志）的实施与验证结果。

## 1. 架构与领域对齐

严格遵循 [ADR-019](/adr/ADR-019-operations-backoffice-control-plane) 与 [Operations RBAC](/domains/operations/rbac)：

- **精确匹配与扁平授权**：前端直接对接 `/api/v1/admin/operations/**`，权限判定使用 Exact Permission Key，无通配符或角色继承。
- **全量替换授权（SetRolePermissions）**：角色权限修改使用整量提交，避免客户端中间状态。
- **安全不变量与 UI 防呆**：
  - 当前登录操作员禁止在 UI 上禁用自身账号。
  - 唯一激活的 `super_admin` 操作员操作行置灰保护，禁止被禁用或解绑 super_admin 角色。
  - 敏感操作（重置权限、禁用操作员/角色）包含二次确认弹窗。

## 2. 实施交付组件清单

代码位于 `apps/admin/src/features/operations/`：

| 模块 | 文件 | 职责 |
| :--- | :--- | :--- |
| **契约与类型** | `contracts.ts` | 16 个 operations 权限常量定义、Zod 输入校验与实体 Schema |
| **API 客户端** | `api.ts` | 对接 `/api/v1/admin/operations/**` 全部端点 |
| **Query Hooks** | `queries.ts` | 封装 React Query Hooks 与 Mutation 缓存失效策略 |
| **通用组件** | `components.tsx` | 权限合约展示、表单封装、错误提示解析（支持 `LAST_SUPER_ADMIN` 等） |
| **控制面首页** | `pages/landing.tsx` | `/operations` 模块卡片入口 |
| **操作员管理** | `pages/operators.tsx` | `/operations/operators` 列表、新建、编辑、角色分配弹窗、启禁用 |
| **角色与权限矩阵**| `pages/roles.tsx` | `/operations/roles` 列表、新建角色、全域树状权限矩阵配置器 |
| **操作审计日志** | `pages/audit-logs.tsx` | `/operations/audit-logs` 多条件筛选、日志表格、JSONB 详情弹窗 |

## 3. 路由与菜单集成

- **导航配置**：`apps/admin/src/navigation/config.tsx` 中启用“系统运维 -> 运营权限”导航项。
- **路由注册**：`apps/admin/src/app/router/router.tsx` 注册 `/operations`、`/operations/operators`、`/operations/roles`、`/operations/audit-logs`，支持 React.lazy 按需加载。

## 4. 自动化测试与质量验证

1. **单元与集成测试** (`vitest`):
   - `contracts.test.ts`: 验证 16 个权限常量冻结、输入校验规则与 Code 命名语法。
   - `components.test.tsx`: 验证 `useExactPermission` 精确权限判定逻辑。
   - 运行结果：`70 passed (70)` 全部通过。
2. **构建与类型检查**:
   - `pnpm --filter admin build` 执行 `tsc --noEmit` 与 Vite 打包，编译 **0 Error** 顺利通过。
3. **后端回归验证**:
   - `pnpm --filter backend test` **49 个测试全部通过**。
