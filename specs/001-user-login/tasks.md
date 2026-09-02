# Tasks: 用户登录与会话 (User Login & Session)

**Input**: Design documents from `specs/001-user-login/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`

**Tests**: 需求明确要求各环节具备可验证性与边界安全防护，本任务清单包含契约测试、单元测试与集成测试任务。

**Organization**: 任务严格按 User Story 组织，各故事独立可测试、可独立交付。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件、无未完成的前置依赖）
- **[Story]**: 归属的用户故事（[US1], [US2], [US3], [US4]）
- 描述中必须包含明确的目标文件路径

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: 准备前后端共享类型、路由定义与测试环境底座

- [x] T001 [P] 验证数据库物理迁移 `database/migrations/0100_identity.sql` 与 `1220_identity_auth_runtime.sql` 在测试数据库完全执行
- [x] T002 [P] 确认后端 Identity 模块目录结构与 Fastify 路由注册底座 `apps/backend/src/modules/identity/http/index.ts`
- [x] T003 [P] 确认移动端 Auth 存储基础设施与类型导入 `apps/mobile/src/auth/storage/tokenStore.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心领域值对象、单向哈希服务与数据库 Advisory Lock 支持，所有 User Story 的公共阻塞前置

- [x] T004 [P] 验证并完善电话号码 E.164 解析与品牌类型 `apps/backend/src/modules/identity/domain/auth.ts`
- [x] T005 [P] 验证并完善 6 位纯数字 OTP 解析与单向哈希工具 `apps/backend/src/modules/identity/domain/otp.ts`
- [x] T006 [P] 验证并完善 Opaque Refresh Token 生成与 SHA-256 存储哈希工具 `apps/backend/src/modules/identity/domain/session.ts`
- [x] T007 [P] 验证并完善固定双向学习语言对 Zod 校验逻辑 `apps/backend/src/modules/identity/domain/learning.ts`
- [x] T008 实现 PostgreSQL 事务级 Advisory Lock 辅助服务 `apps/backend/src/modules/identity/infrastructure/advisory-lock.ts`
- [x] T009 验证 Foundation Outbox Writer 集成与事件类型定义 `apps/backend/src/modules/identity/application/services/identity-events.ts`

**Checkpoint**: 基础模型、安全哈希与锁机制就绪，各 User Story 可以独立进行开发与验收。

---

## Phase 3: User Story 1 - 手机验证码注册与登录 (Priority: P1) 🎯 MVP

**Goal**: 用户提供规范 E.164 手机号，通过 60 秒冷却、5 分钟 TTL、防枚举保护的短信验证码完成身份验证；老用户直接登录，新用户指定 `lo/zh` 学习方向并创建完整档案；单事务核销验证码并签发短期 Access Token 与 Refresh Token。

**Independent Test**: 用户通过 `POST /api/v1/identity/phone-otp` 获取验证码，调用 `POST /api/v1/identity/auth/phone` 验证。新用户成功初始化 `users`, `learning_profiles`, `basic_profiles`, `sessions` 并触发 `identity.user_registered.v1`；老用户成功关联设备与会话并更新最后登录时间；连续 5 次输错后挑战锁定。

### Tests for User Story 1 🧪
- [x] T010 [P] [US1] 编写手机号验证码申请与防枚举契约测试 `apps/backend/test/modules/identity/request-phone-otp.contract.test.ts`
- [x] T011 [P] [US1] 编写手机号 OTP 认证与首次注册事务集成测试 `apps/backend/test/modules/identity/authenticate-phone.integration.test.ts`
- [x] T012 [P] [US1] 编写验证码 5 次输错锁定与 60s 冷却频控单元测试 `apps/backend/test/modules/identity/otp-limits.unit.test.ts`

### Implementation for User Story 1
- [x] T013 [P] [US1] 完善手机验证码申请仓储与并发互斥锁实现 `apps/backend/src/modules/identity/infrastructure/otp-challenge-repository.ts`
- [x] T014 [US1] 实现验证码申请用例及频控（30m 5次/24h 10次/IP 20次）`apps/backend/src/modules/identity/application/use-cases/request-phone-otp.ts`
- [x] T015 [US1] 完善手机验证码核销、新旧用户分支与会话创建应用用例 `apps/backend/src/modules/identity/application/use-cases/authenticate-with-phone-otp.ts`
- [x] T016 [US1] 挂载并校验 Fastify 路由 `POST /api/v1/identity/phone-otp` 与 `POST /api/v1/identity/auth/phone` 于 `apps/backend/src/modules/identity/http/routes.ts`
- [x] T017 [P] [US1] 移动端实现手机号输入页面组件 `apps/mobile/src/screens/auth/LoginScreen.tsx`
- [x] T018 [US1] 移动端实现 6 位 OTP 验证码输入、倒计时与认证提交页面 `apps/mobile/src/screens/auth/OtpScreen.tsx`
- [x] T019 [US1] 将 `Login` 与 `Otp` 屏幕挂载至移动端路由栈 `apps/mobile/src/navigation/RootNavigator.tsx`

**Checkpoint**: 此时 User Story 1 已完全闭环，新老用户均可通过手机验证码注册/登录并进入主页，可作为独立 MVP 发布与演示。

---

## Phase 4: User Story 2 - 会话无感刷新与令牌轮换 (Priority: P2)

**Goal**: 客户端在短期 Access Token (15m) 过期后，使用存储在底层安全钥匙串中的 Refresh Token 自动续签；服务端执行强制单次轮换（ALWAYS Rotation），作废旧 Token、延长会话 30 天滑动窗口并返回全新 Refresh Token。

**Independent Test**: 使用有效 Refresh Token 请求 `POST /api/v1/identity/sessions/refresh`，成功返回新 Access Token 与全新 Refresh Token；重复使用已消费的旧 Refresh Token 必返回 401 `INVALID_CREDENTIAL`；账户停用时刷新必被拒绝。

### Tests for User Story 2 🧪
- [x] T020 [P] [US2] 编写会话刷新与单次强制轮换契约与并发重放测试 `apps/backend/test/modules/identity/refresh-session.contract.test.ts`
- [x] T021 [P] [US2] 编写移动端 Session Bootstrap 与 Token 刷新单元测试 `apps/mobile/src/auth/session/__tests__/sessionBootstrap.test.ts`

### Implementation for User Story 2
- [x] T022 [P] [US2] 实现 Session 仓储中的行级锁查询与 Hash 轮换更新 `apps/backend/src/modules/identity/infrastructure/session-repository.ts`
- [x] T023 [US2] 实现会话刷新应用用例逻辑（校验有效性、检查用户状态、生成新 Token 对、顺延 30 天过期时间）`apps/backend/src/modules/identity/application/use-cases/session-device-lifecycle.ts`
- [x] T024 [US2] 挂载并校验 Fastify 路由 `POST /api/v1/identity/sessions/refresh` 于 `apps/backend/src/modules/identity/http/routes.ts`
- [x] T025 [P] [US2] 移动端实现 `IdentitySessionAdapter` 并在应用启动时注册 `apps/mobile/src/auth/session/identityAdapter.ts`
- [x] T026 [US2] 移动端配置 Axios 响应拦截器：捕获 401 自动触发静默续签或降级登出 `apps/mobile/src/api/client/httpClient.ts`

**Checkpoint**: 访问令牌过期后的自动续签与凭证轮换已完整实现，移动端具备平滑无感的安全保持能力。

---

## Phase 5: User Story 3 - 当前设备退出与全端登出 (Priority: P3)

**Goal**: 用户可主动退出当前设备登录（将会话状态置为 `revoked`，撤销原因 `user_logout`，保持幂等重试）；或一键登出所有已登录设备（批量撤销该用户全部活跃会话），强制全端刷新凭证失效。

**Independent Test**: 调用 `POST /api/v1/identity/sessions/logout` 返回 204，原 Token 立即无法用于刷新；多设备登录状态下调用 `POST /api/v1/identity/sessions/logout-all` 返回 204，数据库中该用户的所有 sessions 均更新为 `revoked`。

### Tests for User Story 3 🧪
- [x] T027 [P] [US3] 编写单设备退出与全端登出契约测试 `apps/backend/test/modules/identity/logout.contract.test.ts`
- [x] T028 [P] [US3] 编写移动端主动登出状态清理测试 `apps/mobile/src/auth/context/__tests__/AuthProvider.test.tsx`

### Implementation for User Story 3
- [x] T029 [P] [US3] 在仓储层实现单个会话撤销与基于 `user_id` 的批量会话撤销 `apps/backend/src/modules/identity/infrastructure/session-repository.ts`
- [x] T030 [US3] 完善单设备退出用例与全端登出用例 `apps/backend/src/modules/identity/application/use-cases/session-device-lifecycle.ts`
- [x] T031 [US3] 挂载并校验 Fastify 路由 `POST /api/v1/identity/sessions/logout` 与 `POST /api/v1/identity/sessions/logout-all` 于 `apps/backend/src/modules/identity/http/routes.ts`
- [x] T032 [US3] 移动端 `AuthProvider` 对接触发 `signOut` 逻辑，清理内存 Access Token 与安全存储 Refresh Token `apps/mobile/src/auth/context/AuthProvider.tsx`
- [x] T033 [US3] 移动端设置页添加“退出登录”与“退出所有设备”交互按钮及调用绑定 `apps/mobile/src/screens/settings/SettingsScreen.tsx`

**Checkpoint**: 单端安全退出与全端紧急注销功能完备，会话生命周期闭环受控。

---

## Phase 6: User Story 4 - 第三方 Facebook 账号登录 (Priority: P4)

**Goal**: 支持接收前端上报的 Facebook Opaque 凭据，在服务端适配器中验证并解析出不可伪造的 `provider_subject`；老用户直接登录，新用户结合指定学习方向完成注册；未配置真实服务时支持安全降级与测试 Fake 模式。

**Independent Test**: 提交有效 Facebook Credential 请求 `POST /api/v1/identity/auth/facebook`，新老用户均正确签发令牌并建立会话；未配置真实凭证且非测试模式时返回 503 `PROVIDER_UNAVAILABLE`；伪造 subject 必被拒绝。

### Tests for User Story 4 🧪
- [x] T034 [P] [US4] 编写 Facebook 认证契约与降级处理测试 `apps/backend/test/modules/identity/authenticate-facebook.contract.test.ts`

### Implementation for User Story 4
- [x] T035 [P] [US4] 完善 Facebook 凭证服务端校验适配器与 Fake 契约驱动 `apps/backend/src/modules/identity/application/services/facebook-verifier.ts`
- [x] T036 [US4] 完善 Facebook 认证与新用户建档应用用例 `apps/backend/src/modules/identity/application/use-cases/authenticate-with-facebook.ts`
- [x] T037 [US4] 挂载并校验 Fastify 路由 `POST /api/v1/identity/auth/facebook` 于 `apps/backend/src/modules/identity/http/routes.ts`
- [x] T038 [US4] 移动端登录页增加 Facebook 登录按钮交互与事件占位 `apps/mobile/src/screens/auth/LoginScreen.tsx`

**Checkpoint**: 国际化第三方社交登录途径就绪，老用户直接登录，新用户安全初始化。

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 安全加固、日志脱敏、端到端自动化验收与架构对齐审计

- [x] T039 [P] 全局审计确保 Raw OTP 与 Raw Refresh Token 绝无明文落库、不入日志、不入 Outbox `apps/backend/src/modules/identity/`
- [x] T040 [P] 执行 quickstart.md 中的端到端全链路验证场景脚本 `specs/001-user-login/quickstart.md`
- [x] T041 运行后端 Identity 模块测试套件确保 100% 通过 `pnpm --filter @zhlao/backend test`
- [x] T042 运行移动端 Auth 模块测试套件确保 100% 通过 `pnpm --filter @zhlao/mobile test`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: 无依赖，立即开始。
- **Foundational (Phase 2)**: 依赖 Phase 1，**强阻塞后续所有用户故事**。
- **User Stories (Phase 3+)**: 统一依赖 Phase 2 完成。
  - **US1 (P1)**: 优先实施（核心 MVP）。
  - **US2 (P2)**: 依赖 Session 基础，可在 US1 后立即实施或与 US1 协同验证。
  - **US3 (P3)**: 依赖 US1 与 US2 生成的有效 Session。
  - **US4 (P4)**: 复用 US1 的新用户建档逻辑，独立验证 Facebook 凭证校验。
- **Polish (Phase 7)**: 依赖期望交付的所有用户故事完成。

### Parallel Opportunities ⚡
- Phase 2 中的所有领域类型定义与哈希工具（T004 ~ T007）可全量并行开发。
- 每个 User Story 内的契约测试与单元测试（如 T010, T011, T012）可先于实现代码并行编写。
- 移动端界面（T017, T018）可与后端用例（T013, T014, T015）并行开发。

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. 完成 Phase 1: Setup 与 Phase 2: Foundational（基础阻断项）。
2. 完成 Phase 3: User Story 1（手机验证码注册与登录）。
3. 按照 `quickstart.md` 验证场景 A 进行独立端到端检验。
4. 验证通过即可达成系统 MVP 闭环。
