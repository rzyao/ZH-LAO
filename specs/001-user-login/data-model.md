# Data Model: 用户登录与会话 (User Login & Session)

**Feature Branch**: `001-user-login` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

本数据模型规范直接映射自物理数据库迁移 `0100_identity.sql` 与 `1220_identity_auth_runtime.sql`，严格遵守项目宪法（Constitution Principle I & VI），不增删物理表与字段。

---

## 实体关系图 (Entity Relationship Diagram)

```text
       ┌────────────────────────┐
       │     identity.users     │
       │────────────────────────│
       │ id (PK, bigint)        │
       │ public_id (UUID, UK)   │
       │ status ('active', ...) │
       └───────────┬────────────┘
                   │
         1:N       │        1:1                 1:1                 1:N                 1:N
   ┌───────────────┼───────────────────┬───────────────────┬───────────────────┬───────────────────┐
   ▼               ▼                   ▼                   ▼                   ▼                   ▼
┌──────────────┐ ┌──────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│auth_identities│ │  basic_profiles  │ │learning_profiles│ │     devices     │ │    sessions     │ │ otp_challenges  │
│──────────────│ │──────────────────│ │─────────────────│ │─────────────────│ │─────────────────│ │─────────────────│
│user_id (FK)  │ │user_id (PK, FK)  │ │user_id (PK, FK) │ │user_id (FK)     │ │user_id (FK)     │ │user_id (FK, opt)│
│provider      │ │display_name      │ │native_language  │ │installation_id  │ │device_id (FK)   │ │phone_number     │
│prov_subject  │ │avatar_media_id   │ │learning_language│ │platform         │ │refresh_token_h  │ │code_hash        │
│verified_at   │ │gender, birth_date│ │(lo/zh pair ONLY)│ │push_token       │ │status ('active')│ │status ('pending')│
│last_login_at │ │country/region    │ │                 │ │app_version      │ │expires_at       │ │expires_at       │
└──────────────┘ └──────────────────┘ └─────────────────┘ └────────┬────────┘ └─────────────────┘ └─────────────────┘
                                                                   │
                                                                   └───────────────────┘
                                                                        (optional FK)
```

---

## 实体详情与字段级契约

### 1. User (`identity.users`)
- **Authority**: `database/migrations/0100_identity.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 内部自增主键，禁止向跨域或外部 API 暴露。
  - `public_id`: `uuid` NOT NULL UNIQUE — 全局唯一公开用户标识符，所有外部通信和跨域关联实体唯一主体。
  - `status`: `varchar(32)` NOT NULL DEFAULT `'active'` — 账户状态，严格受限为 `('active', 'disabled', 'closed')`。
  - `registered_at`: `timestamptz` NOT NULL DEFAULT `now()` — 注册时间。
  - `last_active_at`: `timestamptz` NULL — 最近活跃时间。
  - `created_at` / `updated_at`: `timestamptz` NOT NULL DEFAULT `now()`。
- **Lifecycle & Constraints**:
  - 仅支持三种账户状态；`disabled` 与 `closed` 状态在所有认证/续签入口处坚决拒绝。

### 2. AuthIdentity (`identity.auth_identities`)
- **Authority**: `database/migrations/0100_identity.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 内部主键。
  - `user_id`: `bigint` NOT NULL REFERENCES `identity.users(id)` ON DELETE RESTRICT — 所属用户。
  - `provider`: `varchar(32)` NOT NULL — 认证提供商，受限为 `CHECK (provider IN ('phone', 'facebook'))`。
  - `provider_subject`: `varchar(255)` NOT NULL — 提供商唯一标识：
    - 当 `provider = 'phone'` 时为标准化 E.164 手机号（如 `+8562012345678`）。
    - 当 `provider = 'facebook'` 时为由服务端 Verifier 解析派生出的 Facebook User ID。
  - `verified_at`: `timestamptz` NULL — 凭证验证成功时间。
  - `last_login_at`: `timestamptz` NULL — 最近使用该身份登录的时间。
  - `created_at` / `updated_at`: `timestamptz` NOT NULL DEFAULT `now()`。
- **Constraints**:
  - `UNIQUE (provider, provider_subject)`: 强保证同一外部凭证在平台全局仅对应一个账户。

### 3. OtpChallenge (`identity.otp_challenges`)
- **Authority**: `database/migrations/1220_identity_auth_runtime.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 挑战主键。
  - `user_id`: `bigint` NULL REFERENCES `identity.users(id)` ON DELETE RESTRICT — 关联用户（登录挑战在新用户注册前为空；绑定/换号时不为空）。
  - `phone_number`: `varchar(32)` NOT NULL — 严格符合 E.164 规范的接收手机号。
  - `purpose`: `varchar(32)` NOT NULL — 业务用途，受限为 `CHECK (purpose IN ('login', 'bind_phone', 'change_phone'))`。
  - `code_hash`: `varchar(255)` NOT NULL — 验证码哈希值，严禁保存明文验证码。
  - `status`: `varchar(16)` NOT NULL DEFAULT `'pending'` — 状态机状态，受限为 `CHECK (status IN ('pending', 'verified', 'expired', 'cancelled', 'locked'))`。
  - `attempt_count`: `integer` NOT NULL DEFAULT 0 — 已尝试错误验证次数。
  - `max_attempts`: `smallint` NOT NULL DEFAULT 5 — 允许最大尝试次数。
  - `expires_at`: `timestamptz` NOT NULL — 到期时间（创建时间 + 5 分钟）。
  - `verified_at`: `timestamptz` NULL — 验证成功并消费的时间戳。
- **Database Constraints**:
  - `CONSTRAINT otp_challenges_status_time_check CHECK ((status = 'verified' AND verified_at IS NOT NULL) OR (status <> 'verified' AND verified_at IS NULL))`
  - `CONSTRAINT otp_challenges_attempt_limit_check CHECK (attempt_count <= max_attempts)`

### 4. Device (`identity.devices`)
- **Authority**: `database/migrations/1220_identity_auth_runtime.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 内部设备主键。
  - `user_id`: `bigint` NOT NULL REFERENCES `identity.users(id)` ON DELETE RESTRICT — 所属用户。
  - `installation_id`: `uuid` NOT NULL UNIQUE — 客户端首次安装生成的设备 UUID。
  - `platform`: `varchar(16)` NOT NULL — 平台类型，受限为 `CHECK (platform IN ('android', 'ios'))`。
  - `device_name`: `varchar(128)` NULL — 设备展示名称。
  - `app_version`: `varchar(32)` NULL — 客户端构建版本号。
  - `push_token`: `text` NULL — 推送通知凭证。
  - `first_seen_at`: `timestamptz` NOT NULL DEFAULT `now()`。
  - `last_seen_at`: `timestamptz` NULL。
  - `revoked_at`: `timestamptz` NULL — 设备吊销时间。

### 5. Session (`identity.sessions`)
- **Authority**: `database/migrations/1220_identity_auth_runtime.sql`
- **Fields**:
  - `id`: `bigint generated always as identity` — 内部会话主键。
  - `user_id`: `bigint` NOT NULL REFERENCES `identity.users(id)` ON DELETE RESTRICT — 会话归属用户。
  - `device_id`: `bigint` NULL REFERENCES `identity.devices(id)` ON DELETE RESTRICT — 关联设备。
  - `refresh_token_hash`: `varchar(255)` NOT NULL UNIQUE — 单次有效的可撤销 Refresh Token SHA-256 哈希值。
  - `status`: `varchar(16)` NOT NULL DEFAULT `'active'` — 会话状态，受限为 `CHECK (status IN ('active', 'revoked', 'expired'))`。
  - `expires_at`: `timestamptz` NOT NULL — 会话到期时间戳（默认 30 天滑动窗口）。
  - `last_active_at`: `timestamptz` NULL — 最近活跃时间。
  - `revoked_at`: `timestamptz` NULL — 撤销时间。
  - `revocation_reason`: `varchar(64)` NULL — 撤销原因（如 `'user_logout'`, `'logout_all'`, `'device_revoked'`, `'account_disabled'`）。
- **Database Constraints**:
  - `CONSTRAINT sessions_status_revocation_check CHECK ((status = 'revoked' AND revoked_at IS NOT NULL AND revocation_reason IS NOT NULL) OR (status <> 'revoked' AND revoked_at IS NULL AND revocation_reason IS NULL))`

### 6. LearningProfile (`identity.learning_profiles`)
- **Authority**: `database/migrations/0100_identity.sql`
- **Fields**:
  - `user_id`: `bigint` PRIMARY KEY REFERENCES `identity.users(id)` ON DELETE RESTRICT — 与 User 一对一。
  - `native_language`: `varchar(8)` NOT NULL — 母语标识。
  - `learning_language`: `varchar(8)` NOT NULL — 学习目标语言标识。
  - `created_at`: `timestamptz` NOT NULL DEFAULT `now()`。
- **Database Constraints**:
  - `CONSTRAINT learning_profiles_language_pair_check CHECK ((native_language = 'lo' AND learning_language = 'zh') OR (native_language = 'zh' AND learning_language = 'lo'))`
  - 终身不可修改：本表只支持注册时 INSERT，不提供任何 UPDATE 操作。

### 7. BasicProfile (`identity.basic_profiles`)
- **Authority**: `database/migrations/0100_identity.sql`
- **Fields**:
  - `user_id`: `bigint` PRIMARY KEY REFERENCES `identity.users(id)` ON DELETE RESTRICT — 与 User 一对一。
  - `display_name`: `varchar(64)` NULL。
  - `gender`: `varchar(16)` NULL CHECK `(gender IS NULL OR gender IN ('male', 'female', 'other', 'unspecified'))`。
  - `birth_date`: `date` NULL。
  - `country_code`: `char(2)` NULL。
  - `region_code`: `varchar(32)` NULL。
  - `avatar_media_id`: `uuid` NULL — 逻辑 UUID 引用。
  - `created_at` / `updated_at`: `timestamptz` NOT NULL DEFAULT `now()`。
