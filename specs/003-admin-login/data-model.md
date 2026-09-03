# Data Model: 后台管理员登录 (Admin Login)

**Feature Branch**: `003-admin-login` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

本数据模型规范直接映射自物理数据库迁移 `1260_admin_credentials.sql`、`1220_identity_auth_runtime.sql` 与 `0200_operations.sql`，严格遵守项目宪法（Constitution Principle I & VI），不增删物理表与字段（除本页显式标注的"复用已有列/语义"外）。

---

## 实体关系图 (Entity Relationship Diagram)

```text
                  ┌──────────────────────────────┐
                  │       identity.users         │
                  │──────────────────────────────│
                  │ id (PK, bigint)              │
                  │ public_id (UUID, UK)         │
                  │ status ('active'/'disabled'/'closed') │
                  └──────────────┬───────────────┘
                                 │
           1:1                   │ 1:N                    1:N
   ┌───────────────────┬─────────┴──────────┬──────────────────┐
   ▼                   ▼                    ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│admin_credentials │ │     sessions     │ │    operators     │ │ operator_audit_logs  │
│──────────────────│ │──────────────────│ │──────────────────│ │──────────────────────│
│user_id (PK, FK)  │ │user_id (FK)      │ │auth_subject_id   │ │operator_id (FK)      │
│username (UK)     │ │refresh_token_hash│ │(Identity pub UUID)│ │action_key            │
│password_hash     │ │status            │ │status            │ │target_domain/type/id │
│(scrypt$salt$der) │ │expires_at        │ │display_name      │ │request_id/ip_address │
└──────────────────┘ └──────────────────┘ └──────────────────┘ │details (safe)        │
                                                                 └──────────────────────┘
```

---

## 实体详情与字段级契约

### 1. User (`identity.users`)
- **Authority**: `database/migrations/0100_identity.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 内部自增主键，禁止向外部 API 暴露。
  - `public_id`: `uuid` NOT NULL UNIQUE — 全局唯一公开用户标识符，所有外部通信唯一主体。
  - `status`: `varchar(32)` NOT NULL DEFAULT `'active'` — 账户状态，严格受限为 `('active', 'disabled', 'closed')`。
  - `registered_at` / `last_active_at` / `created_at` / `updated_at`: 时间戳字段。
- **Lifecycle & Constraints**:
  - 仅 `active` 账户可登录/续签；`disabled` / `closed` 在所有认证路径坚决拒绝（FR-005）。

### 2. AdminCredential (`identity.admin_credentials`)
- **Authority**: `database/migrations/1260_admin_credentials.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 内部主键。
  - `user_id`: `bigint` NOT NULL UNIQUE REFERENCES `identity.users(id)` ON DELETE RESTRICT — 与 User 一对一。
  - `username`: `varchar(100)` NOT NULL UNIQUE — 后台登录账号，不可空白（`ck_admin_credentials_username_not_blank`）。
  - `password_hash`: `varchar(255)` NOT NULL — scrypt 哈希，格式 `scrypt$<salt>$<derived>`（`ck_admin_credentials_password_hash_not_blank`）；严禁明文。
  - `created_at` / `updated_at`: `timestamptz` NOT NULL DEFAULT `now()`。
- **Constraints**:
  - 每个用户至多一条 `admin_credentials`（`user_id` UNIQUE）。
  - `username` 全局唯一。
  - 密码仅存单向哈希；改密仅更新 `password_hash` 与 `updated_at`，不产生历史表。

### 3. Session (`identity.sessions`)
- **Authority**: `database/migrations/1220_identity_auth_runtime.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 内部会话主键。
  - `user_id`: `bigint` NOT NULL REFERENCES `identity.users(id)` ON DELETE RESTRICT — 会话归属用户（后台管理员会话与移动端会话同表共存）。
  - `device_id`: `bigint` NULL — 后台会话通常为空（后台登录不登记设备）。
  - `refresh_token_hash`: `varchar(255)` NOT NULL UNIQUE — 单次有效的可撤销 Refresh Token SHA-256 哈希值。
  - `status`: `varchar(16)` NOT NULL DEFAULT `'active'` — 会话状态，受限为 `('active', 'revoked', 'expired')`。
  - `expires_at`: `timestamptz` NOT NULL — 会话到期时间戳（默认 30 天滑动窗口）。
  - `last_active_at`: `timestamptz` NULL — 最近活跃时间。
  - `revoked_at`: `timestamptz` NULL — 撤销时间。
  - `revocation_reason`: `varchar(64)` NULL — 撤销原因（如 `'logout'`, `'logout_all'`, `'password_changed'`, `'account_disabled'`）。
- **Database Constraints**:
  - `CONSTRAINT sessions_status_revocation_check CHECK ((status = 'revoked' AND revoked_at IS NOT NULL AND revocation_reason IS NOT NULL) OR (status <> 'revoked' AND revoked_at IS NULL AND revocation_reason IS NULL))`
  - 新增 `password_changed` 撤销原因复用已有列，无需迁移。

### 4. Operator (`operations.operators`)
- **Authority**: `database/migrations/0200_operations.sql`, `domains/operations/rbac.md`
- **Fields**:
  - `id`: `uuid` PRIMARY KEY — 内部操作员主键。
  - `auth_subject_id`: `uuid` NOT NULL UNIQUE — Identity stable public UUID（映射 `identity.users.public_id`），跨域逻辑引用，无 FK。
  - `display_name`: `varchar` — 操作员展示名。
  - `status`: `varchar` NOT NULL — 操作员状态，受限为 `('active', 'disabled')`（`self registration = NO`）。
  - `created_at` / `updated_at`: 时间戳。
- **Lifecycle & Constraints**:
  - `auth_subject_id` immutable after create。
  - Disabled Operator 对新的 Authorization Decision 一律拒绝。
  - `super_admin` 是保留 Role Code，不能 Disable，必须拥有完整 Permission Catalog。

### 5. AuditLog (`operations.operator_audit_logs`)
- **Authority**: `database/migrations/0200_operations.sql`, `domains/operations/audit.md`
- **Fields**:
  - `id`: `uuid` PRIMARY KEY。
  - `operator_id`: `uuid` NOT NULL REFERENCES `operations.operators(id)` — 操作员。
  - `action_key`: `varchar` NOT NULL — 动作键（如 `identity.admin.login`, `identity.admin_password.change`, `identity.admin.logout`）。
  - `target_domain` / `target_type` / `target_id`: 目标对象。
  - `request_id` / `ip_address`: 请求上下文。
  - `details`: `jsonb` — 安全详情（`safe()` 拒绝 password/token/secret 等敏感字段）。
  - `created_at`: `timestamptz` NOT NULL DEFAULT `now()`。
- **Lifecycle & Constraints**:
  - Append-only：INSERT only，NO business UPDATE/DELETE。
  - 成功语义：只有成功动作写入；失败（认证失败、授权拒绝、校验失败等）进入安全日志，不伪造 Audit。

---

## 状态机

### State Machine: AdminSession

- **States**: `active`, `revoked`, `expired`
- **Initial**: `active`
- **Terminal**: `revoked`, `expired`
- **Owning FR**: FR-006, FR-007, FR-012
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| `active` | `active` | 提交正确的旧刷新令牌且会话未过期未撤销且账户状态正常 | 成功执行刷新与轮换（更新 token hash 并延长 30 天） |
| `active` | `revoked` | 管理员主动退出 OR 修改密码 OR 账户被停用/关闭 | Logout / ChangePassword / 账户状态变更 |
| `active` | `expired` | 当前时间超过会话 `expires_at` 且未在有效期内续签 | 会话自然过期 |

### State Machine: UserAccountStatus

- **States**: `active`, `disabled`, `closed`
- **Initial**: `active`
- **Terminal**: `closed`
- **Owning FR**: FR-005
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| `active` | `disabled` | 合规或风控操作（Operations 管理动作） | 运营禁用账号 |
| `active` | `closed` | 合规或终态操作 | 运营关闭账号 |
| `disabled` | `active` | 合规重新启用且重新确认身份主体可用 | 运营启用账号 |

---

## 变更清单（相对现状）

| 变更 | 类型 | 迁移/列 |
| --- | --- | --- |
| `identity.admin_credentials` 复用（登录/改密） | 复用现有表 | 无新迁移 |
| `identity.sessions.revocation_reason = 'password_changed'` | 复用现有列/语义 | 无新迁移 |
| 登录成功审计 action key `identity.admin.login` | 新增审计值（代码定义） | 无新迁移 |
| 改密审计 action key `identity.admin_password.change` | 新增审计值（代码定义） | 无新迁移 |
| 退出审计 action key `identity.admin.logout` | 新增审计值（代码定义） | 无新迁移 |
| 刷新轮换审计 action key `identity.admin.refresh` | 新增审计值（代码定义） | 无新迁移 |
| 登录频控（内存令牌桶） | 应用层 | 无数据库变更 |

> **结论**: 本功能**不需要任何新的数据库迁移**。全部变更复用现有冻结表结构与语义。
