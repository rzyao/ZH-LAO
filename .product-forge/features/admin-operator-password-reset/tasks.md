# 开发任务：后台操作员密码重置

> 来源：[技术计划](./plan.md)｜[桥接规格](./spec.md)｜[迁移计划](./migrations/migration-plan.md)
>
> 规则：标注 `Test-first: true` 的任务必须先写成失败测试并确认 Red，再开始其后的实现任务。

## Phase 1 — Schema 与 Identity 强制改密基础

- [x] T001 — 创建并验证前向凭据状态 migration：在实施时重新确认下一编号（当前候选 1360），增加 `password_change_required`，并保留迁移验证/回滚说明
      Paths: database:migrations/1360_admin_credentials_password_change_required.sql, database:checks/expected-schema.json, database:README.md
      Size: S
      Covers: FR-003, FR-007

- [x] T002 — Red：为临时密码登录受限状态与 own-password change 清标记编写 Identity/认证路由测试
      Paths: backend:src/modules/identity/__tests__/admin-login.test.ts, backend:src/modules/identity/__tests__/admin-change-password.test.ts, backend:src/modules/identity/http/routes.test.ts
      Test-first: true
      Size: M
      Covers: US-003, FR-007, TC-006

- [x] T003 — 实现 Identity 窄凭据写端口和强制改密状态：生成/哈希临时密码、设置标记、撤销目标会话；登录传播受限状态，own-password change 原子清除标记
      Paths: backend:src/modules/identity/application/use-cases/admin-credential-ops.ts, backend:src/modules/identity/application/use-cases/admin-authentication.ts, backend:src/modules/identity/http/routes.ts, backend:src/modules/identity/http/composition.ts, backend:src/modules/identity/application/index.ts
      Size: L
      Covers: US-001, US-003, FR-003, FR-007

## Phase 2 — Operations 原子重置命令

- [x] T004 — Red：编写重置命令服务/集成测试，覆盖成功原子性、权限与资格拒绝、super-admin 层级，以及 Identity/Session/audit 失败时全量回滚
      Paths: backend:src/modules/operations/__tests__/operator-password-reset.test.ts, backend:src/modules/operations/__tests__/operations-routes.test.ts
      Test-first: true
      Size: L
      Covers: US-001, US-002, FR-002, FR-004, TC-001, TC-002, TC-003, TC-004

- [x] T005 — 在 Operations permission catalog、角色授予与服务层实现重置编排：解析 actor/target、执行所有 guard、以同一 transaction 调用 Identity port 并写无秘密成功审计
      Paths: backend:src/modules/operations/public/permissions.ts, backend:src/modules/operations/application/services/operations-service.ts, backend:src/modules/operations/application/services/operator-password-reset-service.ts, backend:src/modules/operations/application/index.ts, backend:src/modules/admin-operator-provisioning/application/admin-operator-provisioning-service.ts
      Size: L
      Covers: US-001, US-002, FR-001, FR-002, FR-004, FR-005

- [x] T006 — Red：为 password-reset HTTP 合约写路由测试，断言统一 envelope、`Cache-Control: no-store`、无秘密错误路径及错误码映射
      Paths: backend:src/modules/operations/__tests__/operations-routes.test.ts, backend:src/modules/operations/http/routes.test.ts
      Test-first: true
      Size: M
      Covers: US-001, US-002, FR-001, FR-005, TC-005

- [x] T007 — 接入 Operations HTTP route 与 composition root，并将受限认证状态的后端 allowlist 固化为安全边界
      Paths: backend:src/modules/operations/http/routes.ts, backend:src/modules/operations/http/composition.ts, backend:src/main.ts, backend:src/modules/identity/http/routes.ts
      Size: M
      Covers: US-001, US-002, US-003, FR-001, FR-002, FR-005, FR-007

## Phase 3 — 管理端安全交互

- [x] T008 — Red：为 feature API 与操作员页面编写重置密码测试，覆盖已解包响应解析、无自动重试、秘密关闭后销毁和不可操作目标隐藏/禁用
      Paths: admin:src/features/operations/api.test.ts, admin:src/features/operations/pages/operators.test.tsx, admin:src/features/operations/queries.test.ts
      Test-first: true
      Size: M
      Covers: US-001, US-002, FR-005, FR-006, TC-005, TC-007

- [x] T009 — 实现管理端 reset mutation、权限化操作、不可逆确认和一次性临时密码 result dialog；只用局部状态保存秘密，更新受限登录的导航与改密体验
      Paths: admin:src/features/operations/contracts.ts, admin:src/features/operations/api.ts, admin:src/features/operations/queries.ts, admin:src/features/operations/pages/operators.tsx, admin:src/auth/context/AuthContext.tsx, admin:src/app/router/router.tsx, admin:src/pages/change-password.tsx
      Size: L
      Covers: US-001, US-002, US-003, FR-001, FR-005, FR-006, FR-007
      Design: CMP-ConfirmDialog, CMP-Button, CMP-Dialog, CMP-Toast

- [x] T010 — 为确认与结果 Dialog 添加浏览器级无障碍/秘密生命周期回归，验证焦点、可访问名称、状态消息及关闭后的不可读性
      Paths: admin:e2e/operator-password-reset.spec.ts, admin:playwright.config.ts
      Size: M
      Covers: US-001, US-002, FR-006, TC-005, TC-007
      Design: CMP-ConfirmDialog, CMP-Dialog, CMP-Toast

## Phase 4 — 契约、权限文档与验证闭环

- [x] T011 — 完善 OpenAPI、Operations/Identity 权威契约与权限目录，记录无读取秘密端点、业务错误和强制改密语义
      Paths: unknown
      Artifacts: docs/docs/developer/reference/contracts/operations/OPERATIONS_API.md, docs/docs/developer/reference/contracts/operations/OPERATIONS_RBAC_CONTRACTS.md, docs/docs/developer/reference/contracts/identity/IDENTITY_API.md, docs/docs/developer/reference/domains/operations/contracts.md, docs/docs/developer/reference/domains/identity/flows.md, .product-forge/features/admin-operator-password-reset/contracts/openapi.yaml
      Size: M
      Covers: FR-001, FR-002, FR-005, FR-007

- [x] T012 — 执行迁移、后端、管理端、API 合约和文档审计验证；记录结果并修复本功能范围内的失败
      Paths: database:reports/admin-operator-password-reset-migration-verification.md, backend:src/modules/identity/__tests__/admin-login.test.ts, backend:src/modules/operations/__tests__/operator-password-reset.test.ts, admin:src/features/operations/pages/operators.test.tsx
      Artifacts: .product-forge/features/admin-operator-password-reset/traceability.yml
      Size: L
      Covers: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007

## Dependency order

1. 完成 schema 和 Identity Red/实现任务后，才能开始重置编排。
2. Operations 服务测试与实现完成后，才能接入 HTTP route。
3. 管理端 Red 测试在页面实现前完成；浏览器无障碍回归在页面实现后执行。
4. 契约和全量验证在所有实现任务后执行。
