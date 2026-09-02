# Canonical Spec: Identity

> **Status**: CANONICAL (baseline) | **Maintained by**: Product Forge spec-merge
> **Last merged**: 2026-09-02
> **Source**: specs/001-user-login (merged as initial baseline)
> This is the living source of truth for how the Identity domain behaves NOW.
> Deltas from future features/change-requests are merged here.

## Overview

Identity domain covers user roots, authentication (Phone OTP + Facebook),
session lifecycle, devices, basic profiles, learning direction, and account
lifecycle. It is the platform's foundational user-identity domain.

Canonical fact owners:
- `identity.users`, `identity.auth_identities`, `identity.basic_profiles`, `identity.learning_profiles` — `database/migrations/0100_identity.sql`
- `identity.otp_challenges`, `identity.devices`, `identity.sessions` — `database/migrations/1220_identity_auth_runtime.sql`

## Functional Requirements

### FR-001: Phone number E.164 normalization
系统 MUST 支持将用户输入的手机号标准化解析为国际 E.164 规范格式，并对非法格式在入口处进行拒绝。

### FR-002: OTP challenge issuance
系统 MUST 为手机号登录生成 6 位纯数字验证码，验证码有效期为 5 分钟，且同一个手机号在同一业务用途下只允许存在一个处于 pending 状态的挑战。

### FR-003: OTP request rate limiting
系统 MUST 实施验证码申请频控规则：重发冷却时间 60 秒，单手机号每 30 分钟上限 5 次，每 24 小时上限 10 次，单 IP 每 30 分钟上限 20 次。

### FR-004: Anti account-enumeration
系统 MUST 在申请验证码接口上实施防账号枚举保护，无论手机号是否已注册，成功受理时均返回相同的安全响应结构，不得泄露账号注册状态。

### FR-005: Atomic auth transaction
系统 MUST 在同一原子事务内完成验证码核销、身份识别或创建、设备登记与会话创建，严禁分离为"先验证得到临时凭据，后续再完成业务"的断裂流程。

### FR-006: OTP attempt limit
系统 MUST 校验验证码尝试次数，单次挑战最多允许尝试 5 次；输错累加计数，达到上限后挑战状态自动转为 `locked` 并拒绝后续任何尝试。

### FR-007: New-user learning direction
针对未注册手机号，系统 MUST 在初次认证时要求提供固定的语言学习方向，且仅允许 `lo -> zh`（老挝语母语学中文）或 `zh -> lo`（中文母语学老挝语）两种双向对之一；创建用户实体时必须同步初始化基础资料（`basic_profiles`）与学习档案（`learning_profiles`）。

### FR-008: Immutable learning direction
系统 MUST 保证学习方向一旦在注册时确定，在后续登录与常规业务中终身不可修改；已有用户在登录请求中若提供冲突的学习方向，系统必须返回不可变冲突错误并拒绝。

### FR-009: Facebook authentication
系统 MUST 支持接收 Facebook 认证凭据并在服务端适配器中验证，通过解析稳定的提供商主体标识（`provider_subject`）完成老用户登录或新用户注册，且严禁直接信任客户端上报的主体标识。

### FR-010: Device binding
系统 MUST 支持在登录过程中可选绑定设备信息（`installation_id` UUID、平台 `android`/`ios`、设备名、App 版本与推送凭证），并维护设备的首次与最后活跃时间。

### FR-011: Access & Refresh token issuance
系统 MUST 签发有效期为 15 分钟的无状态 Access Token（包含公开用户 UUID），以及存活期为 30 天滑动窗口的可撤销 Refresh Token。

### FR-012: Mandatory refresh rotation
系统 MUST 在每次使用 Refresh Token 刷新时执行强制凭证轮换（Rotation），签发新 Refresh Token 并使旧 Token 立即失效，同时将会话过期时间向后顺延 30 天。

### FR-013: Token hash-only persistence
系统 MUST 仅在数据库中持久化验证码与 Refresh Token 的安全单向散列值（Hash），严禁在数据库、持久化存储、系统日志或 Outbox 事件中明文记录 Raw 验证码与 Raw Refresh Token。

### FR-014: Single-session logout
系统 MUST 支持单会话退出操作，根据传入的当前刷新凭证将对应会话标记为 `revoked`，记录撤销时间与原因 `user_logout`，该接口必须保持幂等与安全重试友好。

### FR-015: Logout-all-sessions
系统 MUST 支持已认证用户一键登出所有设备操作，在原子事务中将该用户下所有 `active` 状态的会话置为 `revoked`，强制失效全端刷新凭据。

### FR-016: Account status enforcement
系统 MUST 在用户认证与会话刷新的所有路径中校验用户账户状态：仅允许 `active` 账户正常登录与续签；当状态为 `disabled` 或 `closed` 时必须坚决拒绝并返回对应的明确拒绝错误。

### FR-017: User-registered domain event
系统 MUST 在新用户成功注册时，同事务通过系统 Outbox 可靠写入 `identity.user_registered.v1` 领域事件，供下游学习、分析与消息系统消费。

## Key Entities

- **User**: 平台核心用户主体，只维护全局公开标识符（`public_id` UUID）、内部主键与账户生命周期状态（`active`, `disabled`, `closed`）。
- **AuthIdentity**: 用户的外部登录认证身份，记录提供商类型（`phone` 或 `facebook`）、标准化主体标识（如 E.164 手机号或 Facebook Subject）、绑定时间与最后登录时间，与 User 为多对一关系。
- **OtpChallenge**: 手机短信验证码挑战记录，包含关联手机号、业务用途（`login`, `bind_phone`, `change_phone`）、验证码哈希（禁止明文）、状态、已尝试次数、最大尝试次数及到期时间。
- **Device**: 客户端安装与物理设备映射，由客户端生成的不可变 `installation_id` UUID 作为唯一标识，记录运行平台、系统版本、推送令牌及活跃时间戳。
- **Session**: 服务端可撤销的会话实例，维护关联用户、关联设备、Refresh Token 单向哈希、会话到期时间（默认 30 天滑动）、状态及撤销原因。
- **LearningProfile**: 用户固定语言学习方向档案，与 User 一对一，强约束记录用户的母语与目标学习语言。
- **BasicProfile**: 用户的基本公开资料实体，包含显示昵称、性别、生日、地区与头像媒体标识等信息。

## State Machines

### State Machine: OtpChallenge

- **States**: `pending`, `verified`, `expired`, `cancelled`, `locked`
- **Initial**: `pending`
- **Terminal**: `verified`, `expired`, `cancelled`, `locked`
- **Owning FR**: FR-002, FR-005, FR-006
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| `pending` | `verified` | 验证码匹配成功 AND 未过期 AND 尝试次数未超限 | 认证事务中成功核销 |
| `pending` | `locked` | 尝试次数累加达到最大限制（5次） | 连续多次输错验证码 |
| `pending` | `cancelled` | 冷却期后申请新验证码 OR 短信通道发送失败 | 发起同手机号新挑战或发送补偿 |
| `pending` | `expired` | 当前时间已超过到期时间（创建+5分钟） | 挑战自然过期 |

### State Machine: Session

- **States**: `active`, `revoked`, `expired`
- **Initial**: `active`
- **Terminal**: `revoked`, `expired`
- **Owning FR**: FR-011, FR-012, FR-014, FR-015, FR-016
- **Transitions**:

| From | To | Guard | Event |
| --- | --- | --- | --- |
| `active` | `active` | 提交正确的旧 Refresh Token 且会话未过期未撤销且账户状态正常 | 成功执行刷新与轮换操作（更新 Token Hash 并延长过期时间 30 天） |
| `active` | `revoked` | 用户主动退出当前会话 OR 一键退出所有会话 OR 账户被停用/关闭 | 触发 Logout、LogoutAll 或账户状态变更 |
| `active` | `expired` | 当前时间已超过会话 `expires_at` 且未在有效期内获得续签 | 会话自然过期 |

## Contract References

### Contract: Database Frozen Core Schema
- **Path**: `database/migrations/0100_identity.sql`
- **Kind**: migration
- **Symbol**: `identity.users`, `identity.auth_identities`, `identity.basic_profiles`, `identity.learning_profiles`
- **Notes**: 规定了用户公钥 UUID、账户状态约束（`active`, `disabled`, `closed`）、身份唯一性索引 `(provider, provider_subject)`、以及学习方向语言对 CHECK 约束。

### Contract: Database Frozen Runtime Auth Schema
- **Path**: `database/migrations/1220_identity_auth_runtime.sql`
- **Kind**: migration
- **Symbol**: `identity.otp_challenges`, `identity.devices`, `identity.sessions`
- **Notes**: 物理数据库事实。约束验证码状态迁移强一致性、`attempt_count <= max_attempts`、Refresh Token Hash 唯一约束、会话撤销状态与原因非空约束。

### Contract: Identity Canonical Flows & Domain Model
- **Path**: `docs/docs/developer/reference/domains/identity/flows.md` & `docs/docs/developer/reference/domains/identity/model.md`
- **Kind**: markdown
- **Symbol**: 认证流程与业务模型
- **Notes**: 冻结了游客无本地服务单、手机号 E.164、学习方向终身固定、Access Token 15 分钟 + Refresh Token 30 天滑动、强制 Rotation 等核心领域事实。

### Contract: Identity Use Cases Behavioral Contract
- **Path**: `docs/docs/developer/reference/contracts/identity/IDENTITY_USE_CASES.md`
- **Kind**: markdown
- **Symbol**: `UC-ID-001` (RequestPhoneOtp), `UC-ID-002` (AuthenticateWithPhoneOtp), `UC-ID-003` (AuthenticateWithFacebook), `UC-ID-004` (RefreshSession), `UC-ID-005` (LogoutCurrentSession), `UC-ID-006` (LogoutAllSessions)
- **Notes**: 规定了事务边界、并发控制锁机制、防枚举要求、Outbox 写入时机以及测试场景要求。

### Contract: Identity HTTP API Specification
- **Path**: `docs/docs/developer/reference/contracts/identity/IDENTITY_API.md`
- **Kind**: markdown
- **Symbol**: `POST /api/v1/identity/phone-otp`, `POST /api/v1/identity/auth/phone`, `POST /api/v1/identity/auth/facebook`, `POST /api/v1/identity/sessions/refresh`, `POST /api/v1/identity/sessions/logout`, `POST /api/v1/identity/sessions/logout-all`
- **Notes**: 规定了统一 Base Prefix、请求与响应体格式、错误码映射规范、防枚举响应及 HTTP 状态码标准。

### Contract: Mobile Screen Pages Contract
- **Path**: `docs/docs/developer/reference/mobile/login.md` & `docs/docs/developer/reference/mobile/otp.md`
- **Kind**: markdown
- **Symbol**: `mobile-login` (/login), `mobile-otp` (/otp)
- **Notes**: 移动端用户交互路径规范，包含从手机号登录页提交凭据到 OTP 验证页输入 6 位数字码的导航流程。

## Change Log

| Date | Source | FR-* Added | FR-* Modified | FR-* Removed |
| --- | --- | --- | --- | --- |
| 2026-09-02 | 001-user-login (initial baseline) | FR-001 ~ FR-017 | — | — |
