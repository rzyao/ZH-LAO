# Research & Technical Decisions: 后台管理员登录 (Admin Login)

**Feature Branch**: `003-admin-login` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

本文档记录 Phase 0 技术决策、架构约束与设计依据。严格遵守项目宪法（Constitution Principles I–XI），所有决策均锚定自现有的冻结数据库迁移（`1260_admin_credentials.sql`, `1220_identity_auth_runtime.sql`, `0200_operations.sql`）、已审计领域事实（`domains/operations/rbac.md`, `domains/operations/audit.md`, `domains/identity/flows.md`）以及现有代码工程事实。

---

## 决策 1: 后台登录认证协议与凭据存储

- **Decision**: 采用 RESTful JSON API，复用现有 `POST /api/v1/admin/auth/login` 端点与 `identity.admin_credentials` 表。密码使用 Node `crypto.scryptSync`（每密码独立随机 salt）生成 `scrypt$salt$derived` 格式哈希；登录时以 `timingSafeEqual` 恒时比较。
- **Rationale**:
  1. `apps/backend/src/modules/identity/application/use-cases/admin-authentication.ts` 已实现 `hashAdminPassword` / `verifyAdminPassword` / `AdminAuthenticationService.login`，工程事实已存在，直接复用。
  2. `database/migrations/1260_admin_credentials.sql` 已冻结 `username` UNIQUE、`user_id` UNIQUE、`password_hash` 非空等物理约束。
  3. 与移动端手机 OTP 登录完全隔离（独立凭据通道），满足 FR-001。
- **Alternatives Considered**:
  - bcrypt/argon2: 既有代码已用 scrypt 且哈希格式已冻结，替换将违反 LOCKED 决策（Principle VII）。
  - 明文/可逆存储: 违反 FR-003/FR-008，被否决。

---

## 决策 2: 登录失败防爆破频控

- **Decision**: 在 `AdminAuthenticationService.login` 入口对同一账号/来源实施滑动窗口失败计数限流：
  - 连续失败 `>= 5` 次（同一 `username`）或 `>= 20` 次（同一 IP）时返回 HTTP 429 `LOGIN_RATE_LIMITED`，并设置合理的冷却窗口（默认 5 分钟）。
  - 成功登录清零失败计数；频控状态保存在单进程内存令牌桶（与既有 Identity 无 Redis 约束一致），并记录到安全日志。
- **Rationale**:
  1. FR-017 要求后台登录失败场景提供合理重试限流防暴力破解。
  2. 项目不引入 Redis/Kafka（`IDENTITY_USE_CASES.md` §2 原则 16），单进程内存令牌桶满足当前单容器部署；水平扩展时由共享频控策略（DB 计数）兜底（见风险）。
  3. 频控只影响失败路径，不破坏正常管理员使用（SC-002）。
- **Alternatives Considered**:
  - Redis 分布式限流: 违反"不引入 Redis"约束。
  - 仅 DB 计数: 可满足但高频失败会产生额外 DB 写放大，内存令牌桶更轻量。

---

## 决策 3: 会话刷新与令牌轮换（复用 Identity 会话生命周期）

- **Decision**: 后台会话完全复用 `identity.sessions` 与 `SessionLifecycle.refreshSession` / `logoutCurrent`，通过现有 `POST /api/v1/identity/sessions/refresh` 与 `POST /api/v1/identity/sessions/logout` 端点实现刷新与退出。
- **Rationale**:
  1. `1220_identity_auth_runtime.sql` 已冻结会话表（`refresh_token_hash` UNIQUE、30 天滑动、撤销状态），`SessionLifecycle` 已实现强制轮换（更新 token hash + 延长 30 天 + 旧 token 失效）与重放拒绝（FR-007/SC-003）。
  2. 管理员登录时 `AdminAuthenticationService` 已创建 `identity.sessions` 记录，与移动端会话同表共存，无需新增会话表（满足 Principle VII LOCKED）。
  3. 前端收到 401 时通过 refresh 重放自动续期，减少重复登录（US-002）。
- **Alternatives Considered**:
  - 后台独立会话表/独立 TTL: 违反"复用现有会话语义"的冻结决策，被否决。

---

## 决策 4: 管理员修改密码

- **Decision**: 新增 `POST /api/v1/admin/auth/change-password`（受保护端点，需 Bearer Access Token）：
  - 请求体：`{ current_password, new_password }`。
  - 校验当前密码正确性；新密码强度（最小 8 位、含字母与数字）；新密码与当前密码不同。
  - 更新 `identity.admin_credentials.password_hash`（scrypt 新 salt）；同事务将当前用户所有活跃会话置为 `revoked`（`revocation_reason = 'password_changed'`），强制重新登录。
  - 成功后由 Operations 审计写入 `operations.operator_audit_logs`（`action_key = 'identity.admin_password.change'`，不记录密码明文）。
- **Rationale**:
  1. 满足 FR-011 与 US-004（改密场景），按用户决策补齐实现。
  2. 密码变更后强制撤销全部会话是安全最佳实践，防止旧会话继续使用。
  3. `admin_credentials` 表已含 `updated_at` 列，无需新增列；`sessions` 表已含 `revocation_reason`，支持 `password_changed` 原因。
- **Alternatives Considered**:
  - 仅更新哈希不撤销会话: 安全性不足，被否决。
  - 独立 `admin_password_history` 表: v1 不引入密码历史约束（范围边界），被否决。

---

## 决策 5: 登录成功审计与失败日志

- **Decision**:
  - 登录成功：由 Identity 域通过 Operations 审计端口（`recordSuccessfulAction`）写入 `operations.operator_audit_logs`，`action_key = 'identity.admin.login'`，目标为 operator，记录请求上下文（`request_id` / `ip_address`），details 不含任何敏感字段。
  - 登录失败：**不写入** `operator_audit_logs`（遵循 `audit.md` 成功语义：失败不伪造成功 Audit），而是进入安全/应用日志（含 `request_id`、IP、失败原因码）。
  - 频控触发、刷新轮换、退出、密码变更同样按"成功写 Audit / 失败进日志"原则处理。
- **Rationale**:
  1. FR-015 / SC-006 要求安全敏感操作可追溯审计。
  2. `domains/operations/audit.md` 明确：`operator_audit_logs` 是 append-only 成功动作事实源，Authentication Failure 等必须进入安全日志而非伪造 Audit（Principle IX 证据现实）。
  3. `OperationsService.recordSuccessfulAction` 已实现（含敏感字段检测 `safe()`，禁 password/token 关键词），直接复用。
- **Alternatives Considered**:
  - 在 `operator_audit_logs` 中伪造失败 Audit: 违反 audit.md 成功语义，被否决。

---

## 决策 6: 前端会话自动刷新与 401 恢复

- **Decision**: 在 Admin 前端实现 `refresh-session.ts` 单例：
  - 当 `apiClient` 触发 `onUnauthorized`（401）时，若存在 refresh token，调用 `POST /api/v1/identity/sessions/refresh` 获取新 access + refresh token，写入 `session-store` 与 `token-store`，并重放原请求；刷新失败则清除会话并重定向登录页。
  - 并发 401 请求合并为单次 refresh（Promise 去重），避免重复刷新。
  - `setUnauthorizedHandler` 保留为最终兜底（refresh 失败时清会话登出）。
- **Rationale**:
  1. FR-016 / US-002 要求前端平滑会话维持；当前 `setUnauthorizedHandler` 仅清会话登出，缺少 refresh 重放。
  2. `apiClient.onUnauthorized` 与 `setUnauthorizedHandler` 已存在，作为注入缝直接复用（工程事实）。
  3. 与后端 `SessionLifecycle.refreshSession` 强制轮换配合，实现 SC-003 前端侧闭环。
- **Alternatives Considered**:
  - 仅依赖后端 401 清会话: 体验差（频繁重新登录），被否决。
  - 每个组件自行 refresh: 违反单一 apiClient 约定（`api/client/index.ts` 注释明确禁止自行 fetch），被否决。

---

## 决策 7: 登录页安全增强与默认凭据治理

- **Decision**:
  - 登录页保留账号/密码表单；提交时对输入做 trim 与长度校验。
  - 默认超管提示 `admin / 123456` 仅显示于首次引导场景（后端暴露"是否已完成引导"或前端构建标志）；生产环境隐藏该提示。
  - 登录失败显示统一错误（防枚举），不区分"用户名不存在"与"密码错误"。
- **Rationale**:
  1. FR-004（防枚举）、FR-002（输入标准化）与 Edge Case（默认凭据泄露）要求。
  2. 默认凭据是引导期事实（`login.tsx` 现状），安全加固应限制其暴露面。
- **Alternatives Considered**:
  - 完全移除默认提示: 引导期新部署者将不知如何首次登录，被否决（保留但降级）。

---

## 决策 8: 冲突与风险分析 (Conflict & Drift Verification)

- **Conflict Status**: **已处置（原 NO CONFLICT 基础上，FR-011/FR-015 缺失实现已上报并经用户确认按规格补齐）**。
- **审查事实确认**:
  - `spec.md` 需求（FR-001 ~ FR-017、US-001 ~ US-005、SC-001 ~ SC-007）与 `domains/operations/`、`domains/identity/` 领域事实、`1260_admin_credentials.sql`/`1220_identity_auth_runtime.sql`/`0200_operations.sql` 物理事实、以及既有代码工程现实一致。
  - 新增端点（`change-password`）与新增审计 action key 均明确标注为新增，不触碰既有 LOCKED 契约（Principle VII）。
  - 不引入任何超出 spec 范围的技术臆造；所有新增实现有 FR / US / SC 映射。
- **主要风险**:
  - **水平扩展下的内存频控**: 单进程内存令牌桶在多副本部署时无法全局生效。缓解：当前部署为单容器（既有 Identity 无 Redis 约束）；若扩展，需升级为 DB 计数或网关限流（标记为 deferred，不阻塞 v1）。
  - **改密撤销全部会话**: 若管理员在多个设备登录，改密会登出全部，属预期安全行为（US-004 语义），非缺陷。
  - **refresh 并发重放**: 前端 Promise 去重 + 后端 `lockByRefreshTokenHash` 行锁保证恰好一次成功（SC-003）。
