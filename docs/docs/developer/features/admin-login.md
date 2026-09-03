---
feature_id: admin-login
title: 后台登录与操作员认证
portfolio_status: active
domain:
- operations
- identity
source_migration: manual
delivery_evidence:
- https://github.com/rzyao/ZH-LAO/blob/main/specs/003-admin-login/spec.md
- https://github.com/rzyao/ZH-LAO/blob/main/specs/003-admin-login/contracts/http-api.md
- https://github.com/rzyao/ZH-LAO/blob/main/specs/003-admin-login/contracts/frontend-session.md
- https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/application/use-cases/admin-authentication.ts
- https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/application/use-cases/admin-credential-ops.ts
- https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/http/routes.ts
- https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/infrastructure/operator-audit-adapter.ts
- https://github.com/rzyao/ZH-LAO/tree/main/apps/backend/src/modules/identity/__tests__
- https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/operations/application/services/operations-service.ts
- https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/operations/http/routes.ts
- https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/test/integration/operations-e2e.test.ts
- https://github.com/rzyao/ZH-LAO/blob/main/apps/admin/src/pages/login.tsx
- https://github.com/rzyao/ZH-LAO/blob/main/apps/admin/src/pages/change-password.tsx
- https://github.com/rzyao/ZH-LAO/blob/main/apps/admin/src/auth/refresh-session.ts
- https://github.com/rzyao/ZH-LAO/blob/main/apps/admin/src/auth/context/AuthContext.tsx
delivery_layers:
  数据库:
    status: evidenced
    note: 零新迁移；复用冻结表 identity.users / admin_credentials / sessions / operations.operators / operator_audit_logs
  Backend:
    status: verified
    note: 管理员认证/刷新/改密/退出用例、路由、审计适配器齐备；96 tests PASS、架构边界 PASS、typecheck+lint 通过
  Admin:
    status: verified
    note: 登录页、改密页、refresh-session 单例、AuthContext 会话恢复齐备；88 tests PASS、vite build 通过
  Mobile:
    status: not_applicable
  Integration:
    status: verified
    note: 审计 action_key 已对齐冻结 CHECK 约束（identity.admin.<action> 三段式）；改密/退出/刷新/登录契约测试覆盖
  Acceptance:
    status: verified
    note: quickstart 场景 A-G 已执行验收：登录/me/防枚举/刷新轮换/重放拒绝/退出/改密/会话撤销/频控429/成功审计均通过（2026-09-03）
last_updated: 2026-09-03
source_migrated_at: 2026-09-02
last_verified_at: 2026-09-03
---

# 后台登录与操作员认证

<!-- breadcrumb:start -->
> **← 返回** [运营（Operations）](operations/) · [全量功能目录](index.md)
<!-- breadcrumb:end -->

## 用户价值

让后台运营人员通过账号密码安全进入 Admin 管理平台：登录后获得短期访问令牌与可轮换刷新令牌，访问令牌过期时无感续签，主动退出或修改密码时立即撤销对应会话，并对登录/刷新/改密/退出等敏感动作写入可审计的成功记录。

## 使用者与可观察流程

- 后台管理员：输入账号密码登录 → 系统校验凭据、签发 Access/Refresh Token、加载操作员身份与权限池 → 进入后台首页。
- 会话维持：访问令牌（15 分钟）过期后前端自动刷新并重放原请求，无需重新输入密码；旧刷新令牌被轮换后立即失效。
- 首次引导：空库首次启动自动创建默认 `admin / 123456` 超级管理员（`operations.operators` 已有记录后不再创建）。
- 凭据生命周期：管理员可修改自身密码（全部会话撤销、强制重新登录），或主动退出当前会话。
- 安全防护：连续登录失败触发频控（429）；失败不写审计，进入安全日志；成功动作写入 `operations.operator_audit_logs`，details 不含密码/令牌等敏感字段。

## 范围与非范围

范围包括：后台账号密码登录、登录频控与防枚举、会话刷新与令牌轮换、首次默认管理员引导、修改密码、退出登录、登录/刷新/改密/退出成功审计、前端会话自动刷新与 403 权限实时恢复。不包含 MFA、操作员邀请、企业 SSO、IP 白名单（见 [admin-auth-hardening](admin-auth-hardening)，当前 `deferred`）；这些边界沿用本功能页与 Identity/Operations Domain 文档。

## 参与系统

| 系统 | 参与方式 |
| --- | --- |
| Database | 复用冻结表 `identity.users`、`identity.admin_credentials`、`identity.sessions`、`operations.operators`、`operations.operator_audit_logs`（零新迁移） |
| Backend | Identity 域认证用例（scrypt 哈希、会话、改密、退出）+ Operations 域授权与审计（`OperationsService`） |
| Admin | 登录页、改密页、`refresh-session` 单例、AuthContext 会话恢复与 403 恢复 |
| Mobile | 不参与（后台登录是独立能力，见 [login](login)） |

## 分层交付状态

| 层 | 状态 | 判断 |
| --- | --- | --- |
| 产品 | `active` | [Spec Kit spec](https://github.com/rzyao/ZH-LAO/blob/main/specs/003-admin-login/spec.md) 定义 US1–US5、FR-001–017 与状态机 |
| 数据库 | `evidenced` | 零新迁移，全部复用冻结物理表（`1260_admin_credentials.sql` / `1220_identity_auth_runtime.sql` / `0200_operations.sql`） |
| Backend | `verified` | 管理员登录/刷新/改密/退出用例、路由、审计适配器齐备；本会话核验 `pnpm --filter @zh-lao/backend verify`：typecheck、lint、架构边界 PASS，96 tests PASS |
| Admin | `verified` | 登录页、改密页、`refresh-session.ts`、AuthContext 齐备；本会话核验 `pnpm --filter @zh-lao/admin verify`：typecheck、lint、88 tests PASS、vite build 成功 |
| Mobile | `not applicable` | 后台登录不涉及 Mobile |
| Integration | `verified` | 审计 action_key 已对齐冻结 CHECK 约束（`identity.admin.<action>` 三段式）；刷新/退出/改密/登录契约测试覆盖；审计持久化在真实约束下不再 500 |
| Acceptance | `verified` | [quickstart](https://github.com/rzyao/ZH-LAO/blob/main/specs/003-admin-login/quickstart.md) 场景 A–G 已执行：登录/me/防枚举/刷新轮换/重放拒绝/退出/改密/会话撤销/频控 429/成功审计全部通过（2026-09-03 实测） |

## 证据

- [003-admin-login Spec Kit 工件](https://github.com/rzyao/ZH-LAO/tree/main/specs/003-admin-login)：spec、plan、data-model、quickstart、contracts（http-api / frontend-session）
- [AdminAuthenticationService / ensureDefaultAdmin](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/application/use-cases/admin-authentication.ts)：scrypt 哈希、登录事务边界、默认管理员幂等引导
- [AdminCredentialOperations.changePassword](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/application/use-cases/admin-credential-ops.ts)：改密 + 全会话撤销（`password_changed`）+ 审计
- [Identity HTTP routes](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/http/routes.ts)：`POST /api/v1/admin/auth/login`、`/sessions/refresh`、`/sessions/logout`、`change-password`
- [OperatorAuditAdapter](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/identity/infrastructure/operator-audit-adapter.ts)：Identity → Operations 审计桥接，仅成功动作、无 operator 映射静默跳过
- [OperationsService.recordSuccessfulAction](https://github.com/rzyao/ZH-LAO/blob/main/apps/backend/src/modules/operations/application/services/operations-service.ts)：审计持久化与敏感字段拒绝
- [Identity admin 测试套件](https://github.com/rzyao/ZH-LAO/tree/main/apps/backend/src/modules/identity/__tests__)：admin-login / session-refresh / admin-logout / admin-change-password / security-no-leak / ensure-default-admin
- [登录页](https://github.com/rzyao/ZH-LAO/blob/main/apps/admin/src/pages/login.tsx) · [改密页](https://github.com/rzyao/ZH-LAO/blob/main/apps/admin/src/pages/change-password.tsx) · [refresh-session](https://github.com/rzyao/ZH-LAO/blob/main/apps/admin/src/auth/refresh-session.ts) · [AuthContext](https://github.com/rzyao/ZH-LAO/blob/main/apps/admin/src/auth/context/AuthContext.tsx)
- 本会话核验：Backend 96 tests PASS、Admin 88 tests PASS、`vite build` 成功、架构边界 PASS（2026-09-03）

## 来源冲突、限制与下一步

- 迁移时 `delivery_evidence` 只列 Operations 模块文件、各层状态为 `not_evidenced`；本页已按 2026-09-03 实现与核验结果更新，补入 Identity 管理员认证实现证据。
- 审计 action_key 曾为 2 段（`identity.admin_login` 等）违反 `operations.operator_audit_logs.action_key` 冻结 CHECK 约束（需 ≥3 段），已统一修正为 `identity.admin.login` / `identity.admin.refresh` / `identity.admin.logout`（`identity.admin.password.change` 本就合规）；对应 specs/contracts 文档已同步。
- `IDENTITY_API.md` / `IDENTITY_USE_CASES.md` 为迁移时历史快照（`lifecycle: historical`，2026-09-02），未含 admin auth 端点；当前执行契约以 `specs/003-admin-login/contracts/http-api.md` 为准。
- 2026-09-03 已在运行中的后端（`47.81.10.76:32471` 开发库）实测 quickstart 场景 A–G：登录、`/me`（26 权限）、防枚举统一 401、刷新轮换、旧 token 重放 401、退出 204、改密 + 会话撤销、新密码登录、频控 429、成功审计写入（login 22 / refresh 1 / logout 1 / password.change 1）全部通过。密码验收后已恢复 `admin/123456`（数据库直写，因强度规则不允许 API 改回弱密码）。
