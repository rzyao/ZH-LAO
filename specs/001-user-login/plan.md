# Implementation Plan: 用户登录与会话 (User Login & Session)

**Branch**: `001-user-login` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-user-login/spec.md`

## Summary

实现基于手机号验证码（Phone OTP）与第三方 Facebook 的用户准入认证、首次注册、以及以单次 Refresh Token 强制轮换（Rotation）为核心的 30 天滑动会话生命周期管理。

技术方案直接复用并扩展项目已审计的 Identity 领域架构：
- **后端**: Node.js 22 + TypeScript + Fastify，采用 PostgreSQL 事务级 Advisory Lock 解决验证码并发与频控竞争，结合单一原子事务完成核销、用户建档（`learning_profiles` 固定老挝语/中文学习方向与 `basic_profiles` 初始化）及会话签发，通过 Foundation Outbox 发布领域注册事件。
- **移动端**: React Native (Expo 53) + TypeScript + React Navigation 7，实现 `IdentitySessionAdapter` 挂载到 `sessionBootstrap`，遵循 Token 隔离规范（Access Token 仅内存保存，Refresh Token 持久化于操作系统安全钥匙串），并提供符合规范的登录/OTP 验证页 UI 流。

---

## Technical Context

**Language/Version**: TypeScript 5.8+, Node.js 22+ (Backend), React 19 / React Native 0.79 (Mobile).

**Primary Dependencies**: Fastify 5.x, PostgreSQL driver (`pg`), Zod 4.x, `libphonenumber-js/min`, Axios, Expo SecureStore (`expo-secure-store`), React Navigation 7.

**Storage**: PostgreSQL 16+（核心物理表：`identity.users`, `identity.auth_identities`, `identity.basic_profiles`, `identity.learning_profiles`, `identity.otp_challenges`, `identity.devices`, `identity.sessions`, `infrastructure.system_outbox_events`）。

**Testing**: Vitest / Node.js test runner (Backend), Jest / React Native Testing Library (Mobile).

**Target Platform**: Node.js Linux Container (Backend), Android / iOS (Mobile).

**Project Type**: Monorepo with Web/Mobile Service & Application (`apps/backend`, `apps/mobile`).

**Performance Goals**: 验证码与登录认证请求响应 p95 < 200ms；并发单次 Refresh 成功率恰好 1 个；验证码与 Refresh Token 零明文落库（100% Hash 存储）。

**Constraints**:
- 不引入 Redis 或外部队列，频控与排他锁完全依托 PostgreSQL 事务机制。
- 学习方向只允许 `(lo, zh)` 或 `(zh, lo)`，终身不可修改。
- 严禁在日志、事件或持久化介质中打印或写入 Raw 验证码与 Raw Refresh Token。

**Scale/Scope**: 支持高并发短信防刷（60s 冷却，单手机 30m 5次/24h 10次，单 IP 20次），支持全端活跃会话一键吊销。

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 宪法原则 (Principle) | 检查项与规则 | 状态 | 实施/规划依据 |
|---|---|:---:|---|
| **I. 权威优先级** | Spec/Plan 绝不覆盖物理迁移与领域事实 | `PASS` | 严格依循 `0100_identity.sql`、`1220_identity_auth_runtime.sql` 与 `domains/identity/` |
| **II. 现有代码非需求权威** | 不从现有代码反推需求，冲突必报 | `PASS` | 仅以 `spec.md` 为唯一需求来源，代码仅作为工程现实参考 |
| **III. 需求 ID 稳定性** | 保持 `FR-001` ~ `FR-017` 原生稳定 ID | `PASS` | 计划所有任务与追踪严格映射原始需求 ID |
| **IV. 可验证性** | 具备明确 Given/When/Then 与测试输入 | `PASS` | 验收用例与 quickstart 验证场景全覆盖 |
| **V. 状态机强制** | 涉及生命周期的实体必须有明确状态机 | `PASS` | `OtpChallenge`（5状态）与 `Session`（3状态）合法跃迁全约束 |
| **VI. 真实契约映射** | 契约只引用真实存在的文件与符号，不臆造 | `PASS` | 映射真实端点与物理迁移列，无空想符号 |
| **VII. 决策预算 (LOCKED)** | LOCKED 决策严禁修改，私有拆解受控 | `PASS` | 锁定表列、API 路径与事务边界，严禁篡改 |
| **VIII. 冲突即停止 (STOP)** | 发现冲突立即上报，严禁自行平替 | `PASS` | 无未决冲突（状态为 NO CONFLICT） |
| **IX. 证据现实** | 交付以端到端和测试映射结果为证据 | `PASS` | 输出 quickstart.md 明确自动化与手动验证脚本 |
| **X. Grounding Gate** | 锚定当前 main 分支基线提交 | `PASS` | 锚定 Base Commit `379f79f936eb752a0937d6330cddf8eb3c678880` |
| **XI. 单一事实所有权** | Identity 拥有用户与认证事实，禁止跨域直写 | `PASS` | 跨域消费仅通过 Outbox 发布领域事件 |

---

## Locked Decisions *(per Constitution Principle VII)*

| Decision | Source | Why LOCKED |
|---|---|---|
| 统一 API 前缀 `/api/v1/identity` 及端点集合 | `IDENTITY_API.md` §8-9 | 保证全平台端侧契约一致性，禁止私自增减公共认证路由 |
| 统一使用公开 `public_id` UUID 作为外部标识 | `0100_identity.sql`, `domains/identity/model.md` | 隐藏内部 `bigint` 主键，防止主键遍历与跨域物理强耦合 |
| 手机号统一规范化为 E.164 格式 | `domains/identity/model.md`, `IDENTITY_USE_CASES.md` §2 | 保证国际手机号码唯一性及电信通道合规性 |
| 学习方向双向对限制且终身不可变 | `0100_identity.sql` (CHECK), `domains/identity/model.md` | 教学核心聚合约束，本 Phase 明确不支持切换 |
| 验证码 6 位数字 / 5 分钟 TTL / 5 次锁定 / 60 秒冷却 | `1220_identity_auth_runtime.sql`, `IDENTITY_USE_CASES.md` §4 | 平台统一防爆破与防刷安全策略基线 |
| 短期 Access Token (15m JWT) + 30 天滑动会话 | `domains/identity/flows.md`, `IDENTITY_USE_CASES.md` §11 | 权衡移动端无感访问体验与端点撤销控制能力 |
| 强制单次 Refresh Token 轮换 (ALWAYS Rotation) | `domains/identity/flows.md`, `1220_identity_auth_runtime.sql` | 彻底防范 Token 重放与中间人窃取攻击 |
| 验证码与 Refresh Token 仅保存单向 Hash (禁止明文) | `1220_identity_auth_runtime.sql`, `IDENTITY_USE_CASES.md` §2 | 凭据防泄露黄金法则，严禁明文入库、入日志、入 Outbox |
| 验证码核销、新用户建档、会话签发同事务原子完成 | `IDENTITY_USE_CASES.md` §6, §9 | 消除中间孤儿状态，杜绝产生可复用的已验证票据漏洞 |
| 移动端 Access Token 仅存内存，Refresh Token 进钥匙串 | `apps/mobile/src/auth/storage/tokenStore.ts` | 移动操作系统安全防御最佳实践，严禁存入 AsyncStorage |

---

## Authority Snapshot

- **Base Commit**: `379f79f936eb752a0937d6330cddf8eb3c678880`
- **Scope Type / ID**: `feature:login` / `domain:identity`
- **Referenced Authority Docs**:
  - `docs/docs/domains/identity/model.md`
  - `docs/docs/domains/identity/flows.md`
  - `docs/docs/domains/identity/database.md`
  - `docs/docs/development/02-identity/IDENTITY_USE_CASES.md`
  - `docs/docs/development/02-identity/IDENTITY_API.md`
  - `docs/docs/mobile/login.md` & `docs/docs/mobile/otp.md`
  - `database/migrations/0100_identity.sql`
  - `database/migrations/1220_identity_auth_runtime.sql`
- **Existing Code / Schema / API / Contracts Checked**:
  - `apps/backend/src/modules/identity/`: 确认已有 Fastify 路由、领域对象及应用用例结构。
  - `apps/mobile/src/auth/`: 确认已存在 `tokenStore`、`identityAdapter` 接口与 `sessionBootstrap`。
  - 增量工作仅为：完善端到端验证测试、健全边界异常捕获、以及补齐移动端交互页面与适配器注册。

---

## Project Structure

### Documentation (this feature)

```text
specs/001-user-login/
├── spec.md              # 业务需求规格说明书
├── plan.md              # 架构实现计划书 (本文件)
├── research.md          # Phase 0 技术决策与研究记录
├── data-model.md        # Phase 1 字段级数据模型与状态机规范
├── quickstart.md        # Phase 1 端到端验证与测试指引
├── contracts/           # Phase 1 契约定义
│   ├── http-api.md      # 后端 HTTP API 规范
│   └── mobile-session.md# 移动端适配器与存储契约
├── checklists/
│   └── requirements.md  # 规格质量核对清单
└── tasks.md             # Phase 2 实施任务分解 (由 /speckit-tasks 生成)
```

### Source Code Layout

```text
apps/backend/src/
├── modules/identity/
│   ├── domain/               # 领域对象、值对象与校验 (account, auth, otp, session, learning, device)
│   ├── application/
│   │   ├── ports/            # 仓储与适配器端口定义 (identity-repositories.ts)
│   │   ├── services/         # 内部辅助领域服务 (otp-services, token-services, facebook-verifier)
│   │   └── use-cases/        # 核心应用用例 (request-phone-otp, authenticate-with-phone-otp, etc.)
│   ├── infrastructure/       # 数据库查询实现与原子事务编排
│   └── http/                 # Fastify 路由分发、Zod 请求校验与安全响应包装 (routes.ts)
└── tests/modules/identity/   # Identity 模块单元与集成测试

apps/mobile/src/
├── auth/
│   ├── storage/tokenStore.ts # 钥匙串与内存凭证存储
│   ├── session/
│   │   ├── identityAdapter.ts# 身份会话恢复适配器接口
│   │   └── sessionBootstrap.ts# 启动会话自动恢复
│   └── context/AuthProvider.tsx # 全局认证状态上下文
├── screens/auth/             # 认证交互界面
│   ├── LoginScreen.tsx       # 手机号输入与获取验证码
│   └── OtpScreen.tsx         # 6 位数字验证码提交与认证
└── navigation/RootNavigator.tsx # 路由鉴权分流
```

---

## 阶段规划 (Phases)

### Phase 0: Outline & Research (已完成)
- 完成技术选型决策，消除所有不确定性，产出 `research.md`。

### Phase 1: Design & Contracts (已完成)
- 提取数据模型、状态机与约束，产出 `data-model.md`。
- 定义服务端 HTTP 契约与移动端会话适配器契约，产出 `contracts/http-api.md` 与 `contracts/mobile-session.md`。
- 编制端到端测试与集成验证指南，产出 `quickstart.md`。

### Phase 2: Tasks & Implementation (待执行)
- 由后续 `/speckit.tasks` 生成依赖有序的任务清单 `tasks.md`。
- 进入 `/speckit.implement` 编码与测试落地。
