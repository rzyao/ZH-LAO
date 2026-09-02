# Research & Technical Decisions: 用户登录与会话 (User Login & Session)

**Feature Branch**: `001-user-login` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

本文档记录 Phase 0 技术决策、架构约束与设计依据。严格遵守项目宪法（Constitution Principles I–XI），所有决策均锚定自现有的冻结数据库迁移（`0100_identity.sql`, `1220_identity_auth_runtime.sql`）、已审计领域事实（`domains/identity/`）、已审计实现轨文档（`IDENTITY_USE_CASES.md`, `IDENTITY_API.md`）以及现有代码工程事实。

---

## 决策 1: 认证通信协议与 API 路由体系

- **Decision**: 采用 RESTful JSON API，继承现有已审计的 HTTP Contract 与路由前缀 `/api/v1/identity`。
- **Rationale**:
  1. `IDENTITY_API.md` §8-9 已冻结全部公共端点：
     - `POST /api/v1/identity/phone-otp` (申请验证码)
     - `POST /api/v1/identity/auth/phone` (手机号验证码登录/注册)
     - `POST /api/v1/identity/auth/facebook` (Facebook 凭证登录/注册)
     - `POST /api/v1/identity/sessions/refresh` (刷新会话与令牌轮换)
     - `POST /api/v1/identity/sessions/logout` (当前会话退出)
     - `POST /api/v1/identity/sessions/logout-all` (全端会话退出)
  2. 后端 Fastify 已在 `apps/backend/src/modules/identity/http/routes.ts` 中完成对应路由骨架定义，与 Foundation 统一错误 Envelope 和 Request Context 严格对齐。
- **Alternatives Considered**:
  - 自定义 RPC 或 GraphQL: 违反项目已有 HTTP Contract 规范，被否决。
  - 拆分独立 auth microservice: 项目采用模块化单体架构（Modular Monolith），不引入跨进程网络开销。

---

## 决策 2: 手机号规范化与验证码挑战互斥模型

- **Decision**: 手机号在领域入口统一标准化为 E.164 字符串（通过 `libphonenumber-js/min`）；并发申请时使用 PostgreSQL 事务级 Advisory Lock `(phone_number + purpose)` 保证同一时刻该手机号和用途下仅存在一个有效的待验证挑战。
- **Rationale**:
  1. 遵从 `domains/identity/model.md` 冻结事实，直接保存规范化号码，不拆存国家码与号码。
  2. 遵从 `IDENTITY_USE_CASES.md` §5：通过数据库 Advisory Lock 覆盖“读取旧挑战 $\rightarrow$ 冷却/频控判断 $\rightarrow$ 取消旧 pending $\rightarrow$ 插入新挑战”的临界区，杜绝多节点/多请求并发产生多个可消费验证码。
  3. 遵从防账号枚举原则（`IDENTITY_API.md` §11），无论手机号是否存在，接口成功响应结构均为 `{"status": "accepted", "retry_after_seconds": 60}`。
- **Alternatives Considered**:
  - 纯应用层内存锁: 无法在多进程/水平扩展容器环境下生效。
  - Redis 分布式锁: 宪法明确规定当前 Phase 不引入 Redis/Kafka 解决问题（`IDENTITY_USE_CASES.md` §2 原则 16）。

---

## 决策 3: 会话模型、令牌生命周期与轮换策略 (Session & Token Rotation)

- **Decision**:
  - **Access Token**: 短期 JWT，有效时长 15 分钟（`ACCESS_TOKEN_TTL = 900s`），包含 `public_id` UUID 声明。
  - **Refresh Token**: 密码学安全随机字符串（Opaque Token），在数据库中仅持久化其 SHA-256 哈希值（`refresh_token_hash`），存活期采用 30 天滑动窗口（`SESSION_TTL = 30 days`）。
  - **Rotation**: 每次使用 Refresh Token 续签成功后，旧 Token 立即作废，签发全新 Token，且过期时间延长 30 天；同一旧 Token 并发刷新时采用数据库行级排他锁（`FOR UPDATE`），保证恰好一个成功。
- **Rationale**:
  1. 遵从 `domains/identity/flows.md` 与 `database/migrations/1220_identity_auth_runtime.sql` 物理约束。
  2. 保护凭证安全，数据库被拖库或日志泄露时无法逆向出有效 Refresh Token。
  3. 客户端已在 `apps/mobile/src/auth/storage/tokenStore.ts` 中实现：Access Token 仅保存在内存中，Refresh Token 存储在操作系统安全钥匙串（Keychain / Keystore）中，严禁写入普通 AsyncStorage。
- **Alternatives Considered**:
  - 无状态长期 JWT: 无法实现单设备踢出、全端登出与封禁即时生效。
  - Token Family 历史链表: 现有 frozen schema 没有家族追踪表，不私自增删物理表（Constitution 原则 I & VI）。

---

## 决策 4: 语言学习方向不可变约束与首次注册原子化

- **Decision**: 首次注册与老用户登录在 `AuthenticateWithPhoneOtp` / `AuthenticateWithFacebook` 中以单事务原子完成。首次注册时创建 `users`、`auth_identities`、`learning_profiles` 与 `basic_profiles`；学习方向严格受限为 `(lo, zh)` 或 `(zh, lo)`，已有用户传入冲突方向时返回 409 `LEARNING_DIRECTION_IMMUTABLE`。
- **Rationale**:
  1. 遵从 `database/migrations/0100_identity.sql` 的 `learning_profiles_language_pair_check` 物理约束。
  2. 遵从 `domains/identity/model.md`：UI 界面语言、母语与目标学习语言为三维独立语义，学习方向注册后不可变更。
  3. 新用户注册同事务生成 `basic_profiles` 空记录，保证下游系统在用户存在时即可安全读取基础资料，消除孤儿记录状态。
- **Alternatives Considered**:
  - 登录完成后异步跳转独立页面绑定学习方向: 产生不完整账户的“半就绪”脏状态，违反聚合完整性。

---

## 决策 5: 移动端架构适配器模式 (Mobile Session Bootstrap & Identity Adapter)

- **Decision**: 在移动端实现符合 `apps/mobile/src/auth/session/identityAdapter.ts` 接口定义的 `IdentitySessionAdapter`，并注入给 `bootstrapSession` 与 `AuthProvider`。
- **Rationale**:
  1. 移动端 Foundation 已建立清晰边界：`sessionBootstrap` 在启动时检查本地安全存储的 Refresh Token，并通过 `IdentitySessionAdapter.restoreSession` 完成静默登录。
  2. 未登录或会话失效时平滑降级为 `anonymous` 状态，驱动 `RootNavigator` 路由分流。
- **Alternatives Considered**:
  - 在 UI 组件内直接调用底层 Axios 进行登录状态拼接: 破坏了移动端分层架构与会话单例管理。

---

## 决策 6: 冲突与风险分析 (Conflict & Drift Verification)

- **Conflict Status**: **NO CONFLICT (无冲突)**。
- **审查事实确认**:
  - `spec.md` 中的所有需求（FR-001 ~ FR-017、US-001 ~ US-004、SC-001 ~ SC-007）与 `domains/identity/` 领域事实、`0100_identity.sql`/`1220_identity_auth_runtime.sql` 物理事实、以及 `IDENTITY_API.md`/`IDENTITY_USE_CASES.md` 契约完全吻合。
  - 没有引入任何超出 spec 范围的技术臆造。
  - 满足 Constitution 原则 II（现有代码是工程现实而非产品权威）：后端已有实现是既有资产，但本方案严格以 spec 和 frozen authority 为准绳进行映射与验证。
