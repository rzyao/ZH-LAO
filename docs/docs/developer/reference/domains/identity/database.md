---
status: frozen
last_updated: 2026-09-02
schema: identity
---

# Identity 字段级数据库规格

状态说明：核心四表（`users`/`auth_identities`/`basic_profiles`/`learning_profiles`）的 SQL 级定义已冻结于迁移 `0100_identity.sql`；辅助四表（`otp_challenges`/`sessions`/`devices`/`admin_credentials`）的物理契约已冻结于迁移 `1220_identity_auth_runtime.sql` 与 `1260_admin_credentials.sql`。本页所有字段类型、默认值与约束以冻结迁移为准（Constitution 物理事实优先级链；`admin_credentials` 此前缺失，Stage 5 三方漂移修复补齐）。

## users — frozen

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | 内部 User ID |
| `public_id` | `uuid` | 否 | UNIQUE | 对外 User ID（应用层生成、不可变）；类型已冻结于 `0100_identity.sql` |
| `status` | `varchar(32)` | 否 | DEFAULT `active`; CHECK `active/disabled/closed` | 只表达账户状态 |
| `registered_at` | `timestamptz` | 否 | DEFAULT `now()` | 注册时间 |
| `last_active_at` | `timestamptz` | 是 | — | 最近活跃时间 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |
| `updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 更新时间；列已冻结，维护机制（trigger/应用层）由实现阶段决定 |

唯一索引由 `public_id UNIQUE` 产生。早期的 `suspended` 状态已被后续 restriction 设计取代。

## auth_identities — frozen

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | 内部身份 ID |
| `user_id` | `bigint` | 否 | FK → `identity.users(id)` | 身份所属用户 |
| `provider` | `varchar(32)` | 否 | CHECK `phone/facebook` | 登录 Provider |
| `provider_subject` | `varchar(255)` | 否 | 与 provider 组成 UNIQUE | E.164 手机号或 Facebook User ID |
| `verified_at` | `timestamptz` | 是 | — | Provider 身份验证时间 |
| `last_login_at` | `timestamptz` | 是 | — | 最近使用该身份登录时间 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |
| `updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 更新时间 |

约束：`UNIQUE(provider, provider_subject)`。迁移 `0100_identity.sql` 已建立 `idx_auth_identities_user_id` 索引。

## basic_profiles — frozen

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `user_id` | `bigint` | 否 | PK；FK → `identity.users(id)` | 与 User 一对一 |
| `display_name` | `varchar(64)` | 是 | — | 普通显示名 |
| `gender` | `varchar(16)` | 是 | CHECK null 或 `male/female/other/unspecified` | 基础性别资料 |
| `birth_date` | `date` | 是 | — | 出生日期 |
| `country_code` | `char(2)` | 是 | — | 国家代码 |
| `region_code` | `varchar(32)` | 是 | — | 地区代码 |
| `avatar_media_id` | `uuid` | 是 | Media/Asset logical UUID 引用（无跨域物理 FK，D-152）；类型已冻结于 `0100_identity.sql` | 基础头像媒体 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |
| `updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 更新时间 |

职业、学校、身高、交友目的、感情状态、自我介绍和多张照片不进入本表。

## learning_profiles — frozen

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `user_id` | `bigint` | 否 | PK；FK → `identity.users(id)` | 与 User 一对一 |
| `native_language` | `varchar(8)` | 否 | 语言对 CHECK | 母语 |
| `learning_language` | `varchar(8)` | 否 | 语言对 CHECK | 固定学习语言 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |

CHECK 只允许 `(native_language='lo' AND learning_language='zh')` 或 `(native_language='zh' AND learning_language='lo')`。当前不提供切换操作。

## otp_challenges — frozen（迁移 `1220_identity_auth_runtime.sql`）

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | Challenge ID |
| `user_id` | `bigint` | 是 | FK → `identity.users(id)` ON DELETE RESTRICT | 关联用户（可空） |
| `phone_number` | `varchar(32)` | 否 | — | E.164 手机号 |
| `purpose` | `varchar(32)` | 否 | CHECK `login/bind_phone/change_phone` | 用途 |
| `code_hash` | `varchar(255)` | 否 | — | 验证码 hash，禁止明文 |
| `status` | `varchar(16)` | 否 | DEFAULT `pending`; CHECK `pending/verified/expired/cancelled/locked` | 状态；`verified` 与 `verified_at` 强一致（见时间约束） |
| `attempt_count` | `integer` | 否 | DEFAULT `0`; CHECK `>= 0` | 已尝试次数 |
| `max_attempts` | `smallint` | 否 | DEFAULT `5`; CHECK `> 0` | 最大尝试数 |
| `expires_at` | `timestamptz` | 否 | — | 到期时间 |
| `verified_at` | `timestamptz` | 是 | — | 验证成功时间；替代旧 `consumed_at` 列 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |

约束：`CHECK (attempt_count <= max_attempts)`；时间约束 `(status='verified' AND verified_at IS NOT NULL) OR (status<>'verified' AND verified_at IS NULL)`。索引：`(phone_number,purpose,created_at DESC)`、`(expires_at) WHERE status='pending'`、`(status,created_at DESC)`。

发送频率、锁定策略、清理周期由实现阶段决定（列与约束已冻结）。

## sessions — frozen（迁移 `1220_identity_auth_runtime.sql`）

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | Session ID |
| `user_id` | `bigint` | 否 | FK → `identity.users(id)` ON DELETE RESTRICT | 所属 User |
| `device_id` | `bigint` | 是 | FK → `identity.devices(id)` ON DELETE RESTRICT | 关联 Device（可空） |
| `refresh_token_hash` | `varchar(255)` | 否 | UNIQUE | 可撤销 Refresh Token hash |
| `status` | `varchar(16)` | 否 | DEFAULT `active`; CHECK `active/revoked/expired` | Session 状态 |
| `expires_at` | `timestamptz` | 否 | — | 到期时间 |
| `last_active_at` | `timestamptz` | 是 | — | 最近活跃 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |
| `revoked_at` | `timestamptz` | 是 | — | 撤销时间 |
| `revocation_reason` | `varchar(64)` | 是 | 与 `status='revoked'` 强一致 | 撤销原因 |

约束：`(status='revoked' AND revoked_at IS NOT NULL AND revocation_reason IS NOT NULL) OR (status<>'revoked' AND revoked_at IS NULL AND revocation_reason IS NULL)`。索引：`(user_id,status,created_at DESC)`、`(device_id,created_at DESC) WHERE device_id IS NOT NULL`、`(expires_at) WHERE status='active'`。

本表支持单设备退出、全部设备退出、账户停用后强制失效、设备查询和 Refresh Token 撤销（列与约束已冻结）。

## devices — frozen（迁移 `1220_identity_auth_runtime.sql`）

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | Device ID |
| `user_id` | `bigint` | 否 | FK → `identity.users(id)` ON DELETE RESTRICT | 所属 User |
| `installation_id` | `uuid` | 否 | UNIQUE | 客户端安装标识 |
| `platform` | `varchar(16)` | 否 | CHECK `android/ios` | 客户端平台（首期 Android） |
| `device_name` | `varchar(128)` | 是 | — | 设备显示名 |
| `app_version` | `varchar(32)` | 是 | — | App 版本 |
| `push_token` | `text` | 是 | UNIQUE WHERE `push_token IS NOT NULL AND revoked_at IS NULL` | 推送 Token |
| `first_seen_at` | `timestamptz` | 否 | DEFAULT `now()` | 首次出现时间 |
| `last_seen_at` | `timestamptz` | 是 | — | 最近出现时间 |
| `revoked_at` | `timestamptz` | 是 | — | 撤销时间 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |
| `updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 更新时间 |

索引：`(user_id, last_seen_at DESC)`、`(push_token) WHERE push_token IS NOT NULL AND revoked_at IS NULL`。用途包括推送、登录安全、Session 关联、多设备管理、风控和版本统计（列与约束已冻结）。

## admin_credentials — frozen base + ADR-031 forward extension

后台登录凭据表；密码以 scrypt hash 存储，明文密码永不落库（Stage 1/5 三方漂移修复补齐，此前 `domains/` 未收录）。

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | 内部 ID |
| `user_id` | `bigint` | 否 | UNIQUE; FK → `identity.users(id)` ON DELETE RESTRICT | 关联后台用户 |
| `username` | `varchar(100)` | 否 | UNIQUE; CHECK `btrim(username) <> ''` | 登录用户名 |
| `password_hash` | `varchar(255)` | 否 | CHECK `btrim(password_hash) <> ''` | scrypt 密码 hash |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |
| `updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 更新时间 |
| `password_change_required` | `boolean` | 否 | DEFAULT `false`; 后续前向迁移新增 | `true` 时后台认证仅允许完成密码修改；成功修改后原子置回 `false` |

`password_change_required` 不改写冻结 `1260_admin_credentials.sql`。ADR-031 批准以向前 migration 加入该状态；管理员重置写入临时密码 hash 时置为 `true`，目标强制改密成功时置回 `false`。明文密码永不持久化。

## 关系总览

```text
users 1 ─ * auth_identities
users 1 ─ 1 basic_profiles
users 1 ─ 1 learning_profiles
users 1 ─ 1 admin_credentials
users 1 ─ * devices
users 1 ─ * sessions
devices 1 ─ * sessions（device_id 可空，已冻结）
```
