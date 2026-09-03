---
description: "Task list for 003-admin-login (后台管理员登录)"
---

# Tasks: 后台管理员登录 (Admin Login)

**Input**: Design documents from `/specs/003-admin-login/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: 本规格经 `quickstart.md` 显式要求自动化测试套件（后端 Identity/Operations 模块、前端 auth 模块），因此按 TDD 顺序为每个用户故事生成测试任务（先写测试并使其 FAIL）。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## 现状核对 (Working Tree State — 2026-09-03)

本任务清单基于对当前工作区的**实证核对**（非假设）：

| 状态 | 文件/能力 |
| --- | --- |
| ✅ 已存在（WIP） | `apps/backend/src/modules/identity/application/services/login-rate-limiter.ts`、`security-log.ts` |
| ✅ 已存在（WIP） | `apps/backend/src/modules/identity/application/use-cases/admin-credential-ops.ts`、`ports/admin-audit-port.ts` |
| ✅ 已存在（WIP） | `admin-authentication.ts` 频控/审计/安全日志接入；`routes.ts` 登录/改密/刷新审计/退出审计；`session-device-lifecycle.ts` logoutCurrent 返回 subjectId |
| ⚠️ 存在但**未装配** | `composition.ts` 已接 `adminAudit`/`securityLog`/`rateLimiter`，但 **`main.ts` 调用 `createIdentityHttpDependencies` 时未传 `adminAudit`/`securityLog`** → 审计与频控在生产路径是**死代码** |
| ❌ 缺失 | **审计适配器**（`AdminAuditRecorder` → `OperationsService.recordSuccessfulAction` 的桥接，跨域边界必需） |
| ❌ 缺失 | 后端所有新服务的**测试**（`apps/backend/src/modules/identity/__tests__/`） |
| ❌ 缺失 | 前端全部能力：`refresh-session.ts`、`change-password.tsx`、`api.ts` 改密、`AuthContext` 刷新/403 恢复、路由、测试 |

> **关键事实**: 本功能**零新迁移**（`data-model.md` 结论），全部复用冻结结构 `1260_admin_credentials.sql` / `1220_identity_auth_runtime.sql` / `0200_operations.sql` 及 `identity.sessions.revocation_reason = 'password_changed'` 语义。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `apps/backend/src/`（Fastify + TypeScript）、`apps/admin/src/`（React 19 + Vite）
- **Backend tests**: `apps/backend/src/modules/identity/__tests__/`（镜像 `apps/backend/src/modules/operations/__tests__/permissions.test.ts` 结构）
- **Frontend tests**: 与源码同目录 `*.test.ts(x)`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 确认基线并搭建测试目录（本功能复用现有 monorepo，无新增依赖/迁移）

- [x] T001 验证基线提交 `e604277fa90d871cb2a2a199df103ee7a7b904f3` 与分支 `003-admin-login` 的关联（`git merge-base` / `git log`），确认无 `REPOSITORY_DRIFT`
- [x] T002 [P] 创建后端 Identity 测试目录 `apps/backend/src/modules/identity/__tests__/`（参照 `apps/backend/src/modules/operations/__tests__/permissions.test.ts` 结构）并确认被 vitest 收集
- [x] T003 [P] 核对冻结迁移现状未变：`database/migrations/1260_admin_credentials.sql` / `1220_identity_auth_runtime.sql` / `0200_operations.sql`；确认本功能无新迁移、无新依赖

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全部用户故事的前置基础设施 — 审计适配器桥接 + `main.ts` 装配 + 安全日志接线

**⚠️ CRITICAL**: 审计/频控在生产路径当前是**死代码**（`main.ts` 未传 `adminAudit`/`securityLog`）。此阶段必须完成后用户故事才有意义。

- [x] T004 新增 **审计适配器** `apps/backend/src/modules/identity/infrastructure/operator-audit-adapter.ts`：实现 `AdminAuditRecorder`，按 subject UUID 解析 operator（复用 Operations 公共查询/端口 `apps/backend/src/modules/operations/public/contracts.ts` 的 `OperationsAuditRecorder.recordSuccessfulAction`），仅成功动作写 `operations.operator_audit_logs`，details 经 `safe()` 拒绝 password/token 敏感字段；无 operator 映射时**静默跳过**（不伪造审计）— BLOCKS US1 登录审计 / US2 刷新审计 / US4 改密审计 / US5 退出审计
- [x] T005 [P] 在 **`apps/backend/src/main.ts` 装配** `createIdentityHttpDependencies` 时传入 `adminAudit`（T004 适配器实例）与 `securityLog`（`createSecurityLog(logger)`，`apps/backend/src/logging/logger.ts`）：使审计、频控、安全日志在生产路径**生效**（依赖 T004）— BLOCKS US1 / US2 / US4 / US5
- [x] T006 [P] 新增认证失败安全日志助手 `apps/backend/src/modules/identity/application/services/security-log.ts`：复用 `apps/backend/src/logging/logger.ts`（pino redact 已覆盖 password/token），记录 request_id / IP / 失败原因码，不写 Audit（现状文件存在，核对并补齐导出/类型，若有缺口）

**Checkpoint**: Foundation ready - 审计、频控、安全日志在生产路径生效，user story implementation can now begin

---

## Phase 3: User Story 1 - 管理员账号密码登录 (Priority: P1) 🎯 MVP

**Goal**: 管理员使用账号密码登录 Admin 后台：防枚举、账户状态校验、签发会话令牌、登录成功审计、失败频控（后端核心已实现，补齐装配、测试与前端安全增强）

**Independent Test**: 登录页输入正确凭据 → 系统校验、签发 access/refresh token、写 `identity.admin.login` 审计、跳转后台首页；错误密码与不存在用户名返回一致 401 `INVALID_CREDENTIAL`；连续失败 ≥5 次返回 429 `LOGIN_RATE_LIMITED`

### Tests for User Story 1 (quickstart 场景 A / F / G) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] 登录契约/集成测试 `apps/backend/src/modules/identity/__tests__/admin-login.test.ts`：成功登录建 `active` 会话并签发令牌；错误密码与不存在用户名一致 401；`disabled` / `closed` 拒绝 403；频控 429 `LOGIN_RATE_LIMITED`；成功写 `identity.admin.login` 审计；失败不写 Audit；以 ' Admin ' / 'ADMIN' 提交可命中已存小写凭据，空白用户名/密码被拒绝

### Implementation for User Story 1

- [x] T008 [P] [US1] 核对并复用单进程内存登录频控 `apps/backend/src/modules/identity/application/services/login-rate-limiter.ts`（同 username ≥5 / 同 IP ≥20 / 冷却 5 分钟 / 成功登录清零；满足 FR-017）；补充 `login-rate-limiter.test.ts`（同目录）验证阈值与冷却边界
- [x] T009 [P] [US1] 核对 `apps/backend/src/modules/identity/application/use-cases/admin-authentication.ts` 登录成功审计写入（`action_key = 'identity.admin.login'`，目标 operator，含 request 上下文；依赖 T004 审计端口 + T005 装配）与频控/失败安全日志集成（登录入口，超阈值抛 `LOGIN_RATE_LIMITED` 429）；确认用户名 `trim().toLowerCase()` 归一化（FR-002）
- [x] T010 [US1] 核对 `POST /api/v1/admin/auth/login` 路由 `apps/backend/src/modules/identity/http/routes.ts`：透传 `request.id` / `request.ip` 至审计与频控，429 错误码与统一错误结构正确（依赖 T005）
- [x] T011 [P] [US1] 登录页安全增强 `apps/admin/src/pages/login.tsx`：输入 trim / 长度校验（FR-002）、统一防枚举错误提示（FR-004）、默认超管提示 `admin / 123456` 仅首次引导场景显示（research 决策 7，生产隐藏）
- [x] T012 [US1] 登录页测试 `apps/admin/src/pages/login.test.tsx`：输入校验 / 防枚举 / 引导提示逻辑

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 会话无感刷新与令牌轮换 (Priority: P2)

**Goal**: 访问令牌过期后前端自动 refresh → 重放原请求；旧刷新令牌被轮换即失效（后端 `SessionLifecycle.refreshSession` 已实现强制轮换；补齐刷新审计 + 前端刷新单例）

**Independent Test**: 携带有效 refresh token 请求续签 → 返回新 access + refresh token 且旧 token 立即失效；前端 401 后自动刷新并重放，无需重新登录

### Tests for User Story 2 (quickstart 场景 B) ⚠️

- [x] T013 [P] [US2] 后端刷新契约测试 `apps/backend/src/modules/identity/__tests__/session-refresh.test.ts`：验证 `SessionLifecycle.refreshSession` 强制轮换（旧 token 重放 401）、`SESSION_REVOKED` / `SESSION_EXPIRED`、账户状态拒绝；管理员会话刷新成功写入 `identity.admin.refresh` 审计（仅当 operator 存在），details 无敏感字段
- [x] T014 [P] [US2] 前端刷新单测 `apps/admin/src/auth/refresh-session.test.ts`：401 并发合并为单次 refresh、成功重放、失败清会话登出

### Implementation for User Story 2

- [x] T015 [P] [US2] 新建前端刷新单例 `apps/admin/src/auth/refresh-session.ts`：`onUnauthorized`（401）→ 已有 refresh Promise 复用（去重）→ 调 `POST /api/v1/identity/sessions/refresh`（`skipAuth: true`）→ 更新 session-store / token-store → 原请求单次重放；刷新请求自身不重放（防死循环）
- [x] T016 [US2] 在 `apps/admin/src/api/client/index.ts` 将 `refresh-session` 接入 `onUnauthorized` 缝，保留 `setUnauthorizedHandler` 作为最终兜底（刷新失败清会话登出；依赖 T015）
- [x] T017 [US2] `apps/admin/src/auth/context/AuthContext.tsx` 启动会话恢复：读取持久化会话，访问令牌将过期时自动 refresh 续期（依赖 T015）
- [x] T018 [P] [US2] 为管理员/操作员会话的刷新成功写入审计 `identity.admin.refresh`（经 T004 审计端口，按刷新后的 subject 解析 operator，仅当存在 operator 映射时写；details 不含令牌），于 `apps/backend/src/modules/identity/http/routes.ts` 刷新路由（现状已存在，核对装配经 T005 生效）
- [x] T019 [US2] `apps/admin/src/auth/context/AuthContext.tsx` 403 实时恢复：收到 `403 FORBIDDEN` 时静默刷新 `/api/v1/admin/operations/me` 更新权限池（SC-007）

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 首次默认管理员引导 (Priority: P2)

**Goal**: 空库首次启动自动创建默认 `admin / 123456` 超级管理员，幂等可安全重复执行（后端 `ensureDefaultAdmin` 已存在，补齐测试）

**Independent Test**: 无 `operations.operators` 记录时启动 → 创建默认 `admin_credentials` 并完成 `super_admin` 引导；重复启动 / 已有 operator 时不重复创建

### Tests for User Story 3 (quickstart 场景 C) ⚠️

- [x] T020 [P] [US3] 引导幂等集成测试 `apps/backend/src/modules/identity/__tests__/ensure-default-admin.test.ts`：空库创建默认凭据并完成 super_admin 引导（FR-009）；已有 operator 时引导空转（FR-010）；重复启动无副作用

### Implementation for User Story 3

- [x] T021 [US3] 核对 `apps/backend/src/main.ts` 启动时 `ensureDefaultAdmin` 调用（`config.identity.adminUsername/adminPassword` + `operations.service.bootstrap`）：确认幂等与空转语义、无重复副作用；若 T005 装配调整了 main.ts 顺序，确认引导仍在 identity/operations 注册后执行

**Checkpoint**: At this point, User Stories 1..3 should all work independently

---

## Phase 6: User Story 4 - 修改管理员密码 (Priority: P3)

**Goal**: 已认证管理员修改自身密码：校验当前密码、新密码强度、更新 `password_hash`、撤销全部会话强制重登、写审计（后端 WIP 已存在，补齐装配、测试与完整前端）

**Independent Test**: 携带当前密码与新密码提交 → 更新哈希、全部会话 `revocation_reason='password_changed'` 置为 revoked、写 `identity.admin_password.change` 审计、前端清会话重定向登录

### Tests for User Story 4 (quickstart 场景 D) ⚠️

- [x] T022 [P] [US4] 后端改密契约测试 `apps/backend/src/modules/identity/__tests__/admin-change-password.test.ts`：成功改密 + 哈希更新 + 会话全部撤销（`password_changed`）+ 审计；当前密码错误 401 `INVALID_CREDENTIAL`；新密码过弱 / 与当前相同 400 `VALIDATION_ERROR`

### Implementation for User Story 4

- [x] T023 [P] [US4] 核对并复用改密用例 `apps/backend/src/modules/identity/application/use-cases/admin-credential-ops.ts`：校验当前密码（`timingSafeEqual`）、新密码强度（8..128、含字母数字、≠当前）、更新 `identity.admin_credentials.password_hash`（scrypt 新 salt）、`sessions.revokeAllByUserId(..., 'password_changed')`、审计 `identity.admin_password.change`（依赖 T004）
- [x] T024 [P] [US4] 核对受保护路由 `POST /api/v1/admin/auth/change-password`（`requireAuthentication` + Zod 校验 `{ current_password, new_password }`）于 `apps/backend/src/modules/identity/http/routes.ts`（现状已存在，确认经 T005 装配后生效）
- [x] T025 [US4] 核对改密用例装配 `apps/backend/src/modules/identity/http/composition.ts` 的 `adminCredentials`（现状已存在，依赖 T005 使 `adminAudit` 生效）
- [x] T026 [P] [US4] 前端 API `apps/admin/src/auth/api.ts` 新增 `changeAdminPassword(currentPassword, newPassword)`：调 `POST /api/v1/admin/auth/change-password`（Bearer, `skipAuth: false`）
- [x] T027 [P] [US4] `apps/admin/src/auth/context/AuthContext.tsx` 新增 `changePassword`：成功 → 清会话 + 重定向登录并提示"密码已修改，请重新登录"；`401 INVALID_CREDENTIAL` → "当前密码错误"；`400 VALIDATION_ERROR` → 强度 / 重复提示（依赖 T026）
- [x] T028 [P] [US4] 新建改密页 `apps/admin/src/pages/change-password.tsx`（当前密码 / 新密码 / 确认新密码表单，复用 `apps/admin/src/components/form/form.tsx` 与 `apps/admin/src/components/ui/*`）（依赖 T027）
- [x] T029 [US4] 挂载改密路由于 `apps/admin/src/app/router/router.tsx`（shell 内受保护路由，如 `/account/change-password`；依赖 T028）
- [x] T030 [US4] 前端改密流程测试 `apps/admin/src/pages/change-password.test.tsx`（成功清会话重定向、错误提示映射）

**Checkpoint**: At this point, User Stories 1..4 should all work independently

---

## Phase 7: User Story 5 - 管理员退出登录 (Priority: P3)

**Goal**: 主动退出后台会话：撤销当前会话刷新令牌（`revocation_reason='logout'`）并写审计，旧令牌失效（后端 WIP 已存在，补齐测试与前端确认）

**Independent Test**: 已认证管理员退出 → 会话置为 revoked、写 `identity.admin.logout` 审计、后续使用旧 refresh token 被拒

### Tests for User Story 5 (quickstart 场景 E) ⚠️

- [x] T031 [P] [US5] 后端退出测试 `apps/backend/src/modules/identity/__tests__/admin-logout.test.ts`：退出后会话 revoked（reason=`logout`）、`identity.admin.logout` 审计写入、旧 token 重放 401

### Implementation for User Story 5

- [x] T032 [P] [US5] 核对 `apps/backend/src/modules/identity/http/routes.ts` logout 流程的管理员 `identity.admin.logout` 审计（按 subject 解析 operator，仅当存在 operator 映射时写；依赖 T004/T005 生效）
- [x] T033 [P] [US5] 核对 `apps/admin/src/auth/context/AuthContext.tsx` 的 `signOut`：调用 `logoutAdmin(refreshToken)`（fire-and-forget）后清会话并重定向 `/login`（现状已具备，补齐缺口并确认）

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的安全加固、文档与全量验证

- [x] T034 [P] 敏感信息零泄漏安全测试 `apps/backend/src/modules/identity/__tests__/security-no-leak.test.ts`：断言审计 details 与日志不出现 Raw password / token（SC-005 / FR-008）
- [x] T035 [P] 文档同步：更新 `specs/003-admin-login/checklists/requirements.md`（如需）与任务状态，确认与 `specs/003-admin-login/contracts/http-api.md` / `contracts/frontend-session.md` 一致
- [x] T036 执行 `specs/003-admin-login/quickstart.md` 场景 A–G 端到端验证（curl 流程 + 前端手动流程），并测量登录全流程 p95 延迟 < 3s（SC-001）
- [x] T037 [P] 运行全量验证：`pnpm --filter @zh-lao/backend verify`（typecheck + lint + test）与 `pnpm --filter @zh-lao/admin verify`（typecheck + lint + test + build）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories（审计/频控/安全日志装配）
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Reuses existing `SessionLifecycle`；前端 refresh 依赖 US1 既有 session-store，可独立测试
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - `ensureDefaultAdmin` 已存在，仅验证与测试（注意与 T005 main.ts 装配的顺序）
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - 依赖 US1 登录 + 受保护路由 + 审计端口，可独立测试
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - 依赖 US1 审计端口，可独立测试

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Services / use-cases before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel (T002 / T003)
- Foundational tasks marked [P] can run in parallel (T004 审计适配器 / T005 main.ts 装配 / T006 安全日志核对)
- Once Foundational completes, all user stories can start in parallel
- All tests for a user story marked [P] can run in parallel
- Backend vs frontend tasks within a story marked [P] can run in parallel
- US4 后端（T023–T025 核对）与前端（T026–T030）在契约固定后基本可并行

---

## Parallel Example: User Story 1

```bash
# Launch tests + independent service tasks together:
Task: "T007 [US1] 登录契约/集成测试 apps/backend/src/modules/identity/__tests__/admin-login.test.ts"
Task: "T008 [US1] 核对频控 login-rate-limiter.ts + 测试"
Task: "T009 [US1] 核对 admin-authentication.ts 审计/频控接入"
Task: "T011 [US1] 登录页安全增强 apps/admin/src/pages/login.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories; 审计/频控装配生效)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4/5 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 4 (backend) / User Story 5 (frontend)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per quickstart.md)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- 严格遵循 Constitution：不修改 LOCKED 契约（登录 / 刷新 / 退出端点、`admin_credentials` 表、会话 TTL 与轮换语义、RBAC 算法、审计成功语义）；新端点仅 `admin/auth/change-password`；`password_changed` 复用现有列语义，无新迁移
- **关键装配事实**: `main.ts` 必须传入 `adminAudit`（T004 适配器）与 `securityLog`（`createSecurityLog(logger)`），否则审计/频控/安全日志在生产路径保持死代码
