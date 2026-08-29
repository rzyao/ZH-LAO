---
status: frozen
last_updated: 2026-08-30
schema: identity
---

# Identity 字段级数据库规格

状态说明：核心四表在会话中已给出 SQL 级定义；辅助三表已确认字段，但没有决定的类型、默认值和数据库约束逐项标为 `designing`。

## users — frozen

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `bigint generated always as identity` | 否 | PK | 内部 User ID |
| `public_id` | `varchar(32)` | 否 | UNIQUE | 对外 User ID；生成格式待定 |
| `status` | `varchar(32)` | 否 | DEFAULT `active`; CHECK `active/disabled/closed` | 只表达账户状态 |
| `registered_at` | `timestamptz` | 否 | DEFAULT `now()` | 注册时间 |
| `last_active_at` | `timestamptz` | 是 | — | 最近活跃时间 |
| `created_at` | `timestamptz` | 否 | DEFAULT `now()` | 创建时间 |
| `updated_at` | `timestamptz` | 否 | DEFAULT `now()` | 更新时间；自动更新机制待实现阶段决定 |

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

约束：`UNIQUE(provider, provider_subject)`。是否额外索引 `user_id` 由 migration 设计阶段决定。

## basic_profiles — frozen

| 字段 | 类型 | Null | 默认/约束 | 说明 |
| --- | --- | --- | --- | --- |
| `user_id` | `bigint` | 否 | PK；FK → `identity.users(id)` | 与 User 一对一 |
| `display_name` | `varchar(64)` | 是 | — | 普通显示名 |
| `gender` | `varchar(16)` | 是 | CHECK null 或 `male/female/other/unspecified` | 基础性别资料 |
| `birth_date` | `date` | 是 | — | 出生日期 |
| `country_code` | `char(2)` | 是 | — | 国家代码 |
| `region_code` | `varchar(32)` | 是 | — | 地区代码 |
| `avatar_media_id` | `bigint` | 是 | FK 目标尚未冻结 | 基础头像媒体 |
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

## otp_challenges — frozen table / designing types

| 字段 | 已确认语义 | 类型与约束状态 |
| --- | --- | --- |
| `id` | Challenge ID | `bigint identity PK`，由全局规范确定 |
| `phone_number` | E.164 手机号 | 类型、长度、索引 `designing` |
| `purpose` | `login/bind_phone/change_phone` | 候选值已确认；类型与 CHECK `designing` |
| `code_hash` | 验证码 hash，禁止明文 | 类型 `designing` |
| `expires_at` | 到期时间 | `timestamptz` 由全局时间规范确定 |
| `attempt_count` | 已尝试次数 | 类型、默认值、上限 `designing` |
| `consumed_at` | 成功消费时间 | 可空 `timestamptz` |
| `created_at` | 创建时间 | `timestamptz`；默认值尚未在该表 SQL 中冻结 |

发送频率、最大尝试数、锁定策略、清理周期和索引尚未决定。

## sessions — frozen table / designing types

| 字段 | 已确认语义 | 类型与约束状态 |
| --- | --- | --- |
| `id` | Session ID | `bigint identity PK` |
| `user_id` | 所属 User | `bigint FK → users` |
| `device_id` | 关联 Device | `bigint FK → devices`；是否可空尚未明确 |
| `refresh_token_hash` | 可撤销 Refresh Token hash | 类型、唯一性、轮换规则 `designing` |
| `status` | Session 状态 | 值域、类型、默认值 `designing` |
| `expires_at` | 到期时间 | `timestamptz` |
| `last_active_at` | 最近活跃 | 可空 `timestamptz` |
| `created_at` | 创建时间 | `timestamptz` |
| `revoked_at` | 撤销时间 | 可空 `timestamptz` |

本表必须支持单设备退出、全部设备退出、账户停用后强制失效、设备查询和 Refresh Token 撤销。

## devices — frozen table / designing types

| 字段 | 已确认语义 | 类型与约束状态 |
| --- | --- | --- |
| `id` | Device ID | `bigint identity PK` |
| `user_id` | 所属 User | `bigint FK → users` |
| `installation_id` | 客户端安装标识 | 类型、唯一范围 `designing` |
| `platform` | 客户端平台；首期 Android | 类型、CHECK `designing` |
| `device_name` | 设备显示名 | 类型与长度 `designing` |
| `app_version` | App 版本 | 类型与长度 `designing` |
| `push_token` | 推送 Token | 类型、唯一性、轮换 `designing` |
| `last_seen_at` | 最近出现时间 | 可空 `timestamptz` |
| `created_at` | 创建时间 | `timestamptz` |

用途包括推送、登录安全、Session 关联、多设备管理、风控和版本统计。

## 关系总览

```text
users 1 ─ * auth_identities
users 1 ─ 1 basic_profiles
users 1 ─ 1 learning_profiles
users 1 ─ * devices
users 1 ─ * sessions
devices 1 ─ * sessions（device_id 可空性 designing）
```
