---
status: implemented
phase: 1
phase_name: Application Foundation
last_updated: 2026-08-30
depends_on: PostgreSQL V2 Baseline PASS
exit_gate: FOUNDATION_GATE
authority: MASTER_DEVELOPMENT_PLAN.md
---

# ZH-LAO V2 — APPLICATION FOUNDATION PLAN

> 目标文件路径：`docs/docs/development/v2/01-foundation/APPLICATION_FOUNDATION_PLAN.md`
>
> 本文是 `PHASE 1 — Application Foundation` 的详细实施分计划。  
> 本 Phase 只建立应用运行基础设施和后续 Domain 的统一施工边界，**不实现任何具体业务 Domain 功能**。

---

# 1. 计划地位

本计划服从以下既有事实源，优先级不得在 Phase 1 内被改变：

1. `docs/docs/development/v2/MASTER_DEVELOPMENT_PLAN.md`
2. `database/v2/` 冻结 PostgreSQL Baseline
3. `docs/docs/architecture/overview.md`
4. `docs/docs/architecture/domain-map.md`
5. `docs/docs/architecture/database.md`
6. 各 Domain 已冻结设计文档
7. ADR / Design Register 中已生效的最终决策

如本计划与 Master Plan、冻结数据库契约或最终 Domain 设计冲突：

> **以上级冻结事实源为准，本计划必须修订，不允许反向修改上级设计以适配实现。**

Phase 1 不允许产生隐式 `MASTER PLAN REVISION`。

---

# 2. Phase 状态与进入条件

当前状态：

- PostgreSQL V2 Baseline：`COMPLETE / PASS`
- Application Foundation：`COMPLETE / PASS`
- Identity：`NOT_STARTED`

进入 Phase 1 实施前必须满足：

- [x] PostgreSQL V2 Baseline Gate = `PASS`
- [x] Cross-Domain FK = 0
- [x] Logical UUID Violation = 0
- [x] Frozen migrations 已形成权威数据库契约
- [x] `infrastructure.assets` 已存在
- [x] `infrastructure.system_outbox_events` 已存在
- [x] 本 `APPLICATION_FOUNDATION_PLAN.md` 完成审核
- [x] Phase 已按本计划实施并通过 Foundation Gate

未经计划审核，不进入代码实施。

---

# 3. Phase 目标

Phase 1 的唯一目标是：

> 建立一个可启动、可连接 PostgreSQL V2、可安全执行事务、可承载后续 11 个 Domain、具备统一 API/日志/错误/测试/Outbox/Asset/后台任务基础的模块化单体应用骨架。

完成以后，后续 Domain Phase 不再重复解决：

- 应用如何启动；
- 配置如何加载；
- PostgreSQL 如何连接；
- 事务如何执行；
- Repository 如何取得数据库执行器；
- logical UUID 如何生成与验证；
- Outbox 如何在事务中写入；
- Outbox 如何被后台 Worker 投递；
- Asset canonical metadata 如何访问；
- HTTP 服务如何创建；
- 请求上下文如何建立；
- 错误如何统一输出；
- 日志如何统一记录；
- Authentication middleware 如何挂载；
- 后台 Worker 如何启动/停止；
- Integration Test DB 如何自动建立；
- 冻结 migration 如何用于应用测试；
- liveness/readiness 如何判断；
- Domain 模块之间的代码边界如何守护。

---

# 4. 明确非目标

本 Phase **禁止实现业务功能**。

不得实现：

- 注册
- OTP 业务流程
- 登录 / 登出
- Session 业务逻辑
- Device 管理业务
- 用户资料业务
- Platform Feature Flag 业务
- Operations RBAC 业务
- 课程 / Lesson / 内容 CRUD
- 学习进度
- 用户翻译业务
- TTS 生产业务
- Audio Slot / Task / Review 业务
- Social Profile / Follow / Match
- 动态 / 点赞 / 评论
- Chat Conversation / Message
- Gift
- Order / Payment / Wallet / Refund
- Reward
- Report / Moderation / Enforcement / Appeal
- 大规模 C 端或 B 端开发
- 全项目 API 设计
- WebSocket 业务协议
- Push 业务
- 搜索业务
- 推荐算法
- 生产环境部署工程
- Redis / Kafka / RabbitMQ 等额外基础设施

允许出现的 HTTP endpoint 仅限技术基础 endpoint，例如：

- `/health/live`
- `/health/ready`

允许存在 Authentication **骨架**，但不允许在本 Phase 实现 Identity 登录业务。

---

# 5. 仓库现状调查结论

## 5.1 当前仓库结构

当前主干已经存在：

```text
ZH-LAO/
├── database/v2/
├── docs/
├── scripts/
├── .gitignore
└── README.md
```

当前正式应用后端运行时尚未建立。

因此 Phase 1 的性质是：

> **建立新的 Application Foundation。**

不是：

> 对已有完整后端进行大规模迁移、拆解或重构。

## 5.2 已有 Node / PostgreSQL 基础

`database/v2` 已有独立 Node.js ESM 工具包，使用：

- `pnpm`
- Node.js ESM
- `pg`
- forward-only migration runner
- PostgreSQL advisory lock
- migration hash 校验
- database audit
- disposable validation database

该工具包继续作为：

> **数据库结构安装、验证与审计的唯一权威入口。**

Phase 1 不复制第二套 migration system。

## 5.3 PostgreSQL Baseline

当前数据库基线已冻结：

- 一个 PostgreSQL 主数据库
- 11 个业务 Schema
- 122 张业务表
- `infrastructure.assets`
- `infrastructure.system_outbox_events`
- 17 个 baseline migration
- PostgreSQL 18 baseline
- 跨 Domain physical FK = 0
- 跨 Domain logical reference = UUID

冻结 migration 不允许被 Phase 1 修改。

如果 Foundation 实施确实发现生产数据库需要新增结构：

1. 先确认不是应用实现问题；
2. 形成明确设计变更；
3. 在 `database/v2/migrations/` 增加新的 forward-only migration；
4. 重新执行完整 database audit；
5. 不修改 0000–1240 已冻结 migration。

---

# 6. Foundation 技术基线

以下是 Phase 1 的应用层技术基线。计划审核通过后即冻结为 Foundation 实现选择；后续 Domain 默认继承，不在每个 Domain 重选框架。

## 6.1 Runtime

采用：

- Node.js
- TypeScript
- ESM
- pnpm
- 单后端模块化单体

理由：

- 与现有 `database/v2` Node / ESM / pnpm 工具链一致；
- 适合单人开发；
- 不引入多语言后端运维负担；
- 可以用同一运行时承载 HTTP API 与 Worker；
- 不改变已确定的模块化单体架构。

## 6.2 HTTP Framework

采用：

- Fastify

Foundation 只建立：

- server bootstrap
- request lifecycle
- request id
- error handler
- health routes
- auth hook 接口
- route registration convention

不在本 Phase 建立业务路由。

## 6.3 PostgreSQL Client

采用：

- `pg` / node-postgres

Phase 1 **不引入 ORM 作为数据库 schema authority**。

原因：

- PostgreSQL V2 migration 已经是冻结物理事实源；
- 不允许由 ORM schema 重新定义 122 张业务表；
- Repository 必须适配数据库，而不是让数据库适配 ORM；
- 直接 SQL 更容易审计 Domain → Schema ownership。

后续如某 Domain 确需 query builder，只能作为查询实现工具，不能成为第二套 schema/migration authority。

## 6.4 Configuration Validation

采用：

- 环境变量作为部署配置入口；
- Zod 负责应用启动时配置校验；
- 生产秘密只来自环境或未来 secret provider；
- `.env` 不提交；
- `.env.example` 只保存占位符。

## 6.5 Logging

采用：

- Pino
- Fastify request logger 与应用 logger 统一

## 6.6 Tests

采用：

- Vitest
- Node integration tests
- 真 PostgreSQL Integration Test DB
- 不使用 SQLite 代替 PostgreSQL

## 6.7 UUID

采用：

- Node `crypto.randomUUID()` 生成 application logical UUID
- 所有 cross-domain / API / Event / Outbox logical identifier 使用 UUID

Foundation 不发明自定义短 ID。

---

# 7. 目标应用目录

Phase 1 建议新增：

```text
ZH-LAO/
├── apps/
│   └── backend/
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.example
│       ├── src/
│       │   ├── main.ts
│       │   ├── worker.ts
│       │   │
│       │   ├── bootstrap/
│       │   │   ├── build-app.ts
│       │   │   ├── build-worker.ts
│       │   │   └── shutdown.ts
│       │   │
│       │   ├── config/
│       │   │   ├── env.ts
│       │   │   └── schema.ts
│       │   │
│       │   ├── http/
│       │   │   ├── server.ts
│       │   │   ├── request-context.ts
│       │   │   └── health-routes.ts
│       │   │
│       │   ├── auth/
│       │   │   ├── auth-context.ts
│       │   │   ├── authentication-provider.ts
│       │   │   └── auth-hook.ts
│       │   │
│       │   ├── database/
│       │   │   ├── pool.ts
│       │   │   ├── executor.ts
│       │   │   ├── transaction-manager.ts
│       │   │   └── postgres-errors.ts
│       │   │
│       │   ├── ids/
│       │   │   └── uuid.ts
│       │   │
│       │   ├── errors/
│       │   │   ├── app-error.ts
│       │   │   └── error-handler.ts
│       │   │
│       │   ├── logging/
│       │   │   └── logger.ts
│       │   │
│       │   ├── events/
│       │   │   ├── domain-event.ts
│       │   │   ├── event-handler.ts
│       │   │   └── handler-registry.ts
│       │   │
│       │   ├── outbox/
│       │   │   ├── outbox-writer.ts
│       │   │   ├── outbox-repository.ts
│       │   │   └── outbox-publisher.ts
│       │   │
│       │   ├── assets/
│       │   │   ├── asset-record.ts
│       │   │   ├── asset-repository.ts
│       │   │   └── object-storage.ts
│       │   │
│       │   ├── jobs/
│       │   │   ├── worker-host.ts
│       │   │   ├── job.ts
│       │   │   └── job-registry.ts
│       │   │
│       │   └── modules/
│       │       └── README.md
│       │
│       └── test/
│           ├── unit/
│           ├── integration/
│           └── support/
│               ├── test-database.ts
│               ├── migrate-test-database.ts
│               └── test-app.ts
│
├── database/v2/          # 保持数据库权威，不搬迁
└── docs/
```

说明：

1. Phase 1 不提前创建 11 个空业务模块。
2. 每个 Domain 到自己的 Phase 时再创建：
   `src/modules/<domain>/...`
3. `modules/README.md` 只冻结模块目录规范和 import 规则。
4. `database/v2` 不移动、不复制、不重写 migration runner。
5. 不建立一个巨大的 `common-service`。

---

# 8. Domain 模块结构约定

后续每个 Domain 默认使用：

```text
src/modules/<domain>/
├── domain/
├── application/
├── infrastructure/
├── http/
└── public/
```

语义：

- `domain/`
  - Domain entities
  - value objects
  - domain rules
  - domain events
- `application/`
  - use cases
  - application services
  - ports
  - orchestration
- `infrastructure/`
  - repository implementations
  - external adapters
- `http/`
  - Domain API adapter
- `public/`
  - 允许其他 Domain 使用的明确 application/read contract
  - event contracts
  - 不暴露内部 Repository

跨 Domain import 原则：

```text
Domain A
  ──允许──> Domain B / public

Domain A
  ──禁止──> Domain B / domain
  ──禁止──> Domain B / infrastructure
  ──禁止──> Domain B / repository
```

Repository 数据访问原则：

```text
Identity Repository    -> identity.*
Content Repository     -> content.*
Learning Repository    -> learning.*
...
```

禁止：

```text
LearningRepository -> UPDATE content.*
ChatRepository     -> UPDATE social.*
RewardsRepository  -> UPDATE commerce.*
```

`infrastructure.*` 只允许由明确的 Foundation technical adapter 访问：

- Asset Infrastructure adapter
- Outbox Infrastructure adapter

不得成为任意 Domain 跨域 SQL 后门。

---

# 9. Configuration / Environment 规范

## 9.1 环境分类

至少支持：

- `development`
- `test`
- `production`

不根据环境静默改变核心业务规则。

## 9.2 Foundation 配置

至少定义：

```text
APP_ENV
APP_HOST
APP_PORT

DATABASE_URL
DATABASE_POOL_MIN
DATABASE_POOL_MAX
DATABASE_CONNECTION_TIMEOUT_MS
DATABASE_IDLE_TIMEOUT_MS

LOG_LEVEL

OUTBOX_POLL_INTERVAL_MS
OUTBOX_BATCH_SIZE
OUTBOX_LEASE_MS

SHUTDOWN_TIMEOUT_MS
```

Asset provider 的生产 credential 在尚未启用具体 provider 时不得强制要求。

## 9.3 启动校验

应用启动时：

1. 读取 `process.env`
2. Zod 校验
3. 形成不可变 typed config
4. 缺少 required config 立即启动失败
5. 日志只输出非敏感配置摘要
6. 绝不输出 `DATABASE_URL` 完整凭据、token、secret

---

# 10. PostgreSQL Connection Pool

实现统一 `PgPool`。

要求：

- 应用只创建有限数量 pool；
- HTTP 与 Worker 可以各自有明确 pool 生命周期；
- pool 参数全部来自 typed config；
- 启动阶段不把每个请求创建新连接；
- graceful shutdown 必须 `pool.end()`；
- readiness 必须通过 pool 执行轻量数据库检查；
- pool error 必须进入统一 logger；
- 不允许 Domain 自己 `new Pool()`。

禁止：

```text
modules/identity/... -> new Pool()
modules/chat/...     -> new Pool()
```

必须：

```text
Application Bootstrap
       ↓
Shared PgPool
       ↓
Transaction / Repository
```

---

# 11. Transaction Infrastructure

建立统一：

```ts
TransactionManager.run(callback)
```

概念流程：

```text
pool.connect()
    ↓
BEGIN
    ↓
callback(transaction executor)
    ↓
COMMIT
```

失败：

```text
callback throws
    ↓
ROLLBACK
    ↓
rethrow original application error
```

要求：

- transaction executor 与普通 pool executor 使用统一查询接口；
- Repository 可以在普通读场景使用 pool executor；
- 需要原子写入时必须使用 transaction executor；
- Outbox Writer 必须能接收同一个 transaction executor；
- transaction 不允许吞异常；
- rollback 失败必须记录；
- connection 必须在 finally release；
- 不默认建立跨 Domain 巨型 transaction。

Foundation 不使用“隐式全局事务上下文”掩盖事务边界。

优先：

> Application Service 明确开启 transaction，并把 transaction-scoped executor 传给参与者。

---

# 12. Repository Convention

Foundation 只定义 Repository 施工规范和测试模式，不实现业务 Repository。

Repository 必须：

- 隶属于一个 Domain；
- 明确知道自己可访问的 Schema；
- 通过统一 DB executor 执行 SQL；
- 不直接处理 HTTP；
- 不负责跨 Domain orchestration；
- 不在 Repository 中发送外部消息；
- 不自己建立 Pool；
- 参数化 SQL；
- 显式列出 SELECT / INSERT / UPDATE 字段；
- 不使用 `SELECT *` 作为长期正式实现；
- 将 PostgreSQL row 映射成 Domain/Application 所需结构；
- 保持 SQL 对 Frozen Physical Contract 可审计。

测试模式使用：

> test-only schema / test fixture table

用于验证：

- query executor
- transaction
- rollback
- repository mapping

不得为了 Foundation 测试新增生产业务表。

---

# 13. UUID Contract

Foundation 提供统一 UUID utility。

要求：

- logical UUID 在 application 层生成；
- `public_id`
- `event_id`
- Outbox `id`
- Outbox `aggregate_id`
- 其他跨域 logical identifier

均使用标准 UUID。

跨 Domain 禁止：

```text
internal bigint id
```

API / Event / Outbox 不允许意外暴露内部连续 BIGINT。

建立测试：

- UUID 格式校验；
- 新 ID 唯一性 smoke test；
- Outbox aggregate ID 仅接受 UUID；
- cross-domain contract fixture 不接受 number / bigint。

---

# 14. Unified Error Handling

建立基础 `AppError`：

最少包含：

```text
code
message
httpStatus
expose
details?
cause?
```

HTTP 错误响应统一：

```json
{
  "error": {
    "code": "FOUNDATION_EXAMPLE",
    "message": "Human-readable message",
    "request_id": "..."
  }
}
```

规则：

- 4xx 可按错误类型向客户端暴露安全信息；
- 未识别异常统一 500；
- 500 不向客户端返回 stack；
- stack 只进入服务端日志；
- PostgreSQL raw error 不直接返回客户端；
- request_id 必须进入错误响应与服务端日志；
- Domain Phase 后续扩展 domain-specific error code，不复制另一套 error envelope。

---

# 15. Logging / Request Context

每个 HTTP 请求至少建立：

```text
request_id
method
path
status_code
duration_ms
```

后续有身份后可附加：

```text
auth_subject_id
session_id
operator_id
```

但 Phase 1 不伪造业务身份。

Outbox / Worker 日志至少支持：

```text
event_id
event_type
source_domain
aggregate_id
job_name
attempt
```

必须做敏感字段 redaction：

- authorization
- cookie
- password
- OTP
- access token
- refresh token
- database credential
- provider secret

禁止使用散落的 `console.log` 作为正式日志方案。

---

# 16. API Foundation

Fastify application factory 必须与 process 启动分离：

```text
buildApp()
```

用于：

- production startup
- integration tests
- future Domain route registration

`main.ts` 只负责：

1. load config
2. create dependencies
3. build app
4. listen
5. register shutdown

Foundation HTTP route 仅：

```text
GET /health/live
GET /health/ready
```

API 基础规范：

- JSON
- UTF-8
- request id
- unified error envelope
- typed route registration convention
- API prefix 为后续 `/api/v1/...` 预留
- 不在 Foundation 生成业务 CRUD endpoint

---

# 17. Authentication Infrastructure Skeleton

本 Phase 只定义认证接入骨架。

建立：

```text
AuthenticationProvider
AuthContext
auth hook / guard
```

职责：

```text
HTTP Request
    ↓
Authentication Provider
    ↓
AuthContext
    ↓
Application Use Case
```

Foundation 不负责：

- OTP
- password
- auth identity 查询
- session refresh
- device state
- operator RBAC
- user ban rule

这些在 Identity / Operations / Trust Phase 中实现。

要求：

- 没有注册 AuthenticationProvider 时，受保护业务路由不得错误地“默认通过”；
- health route 必须保持 public；
- AuthContext 中只能使用 stable logical UUID；
- 不把数据库内部 BIGINT user id 当成 auth identity。

---

# 18. Outbox Writer

`infrastructure.system_outbox_events` 是全系统唯一 transactional outbox。

Foundation 必须实现一个唯一 Outbox Writer。

写入字段严格适配 frozen table：

```text
id
event_id
source_domain
event_type
aggregate_type
aggregate_id
payload
headers
occurred_at
available_at
```

写入原则：

> Domain canonical write + Outbox insert 必须使用同一个 PostgreSQL transaction executor。

示意：

```text
BEGIN
  UPDATE domain canonical data
  INSERT infrastructure.system_outbox_events
COMMIT
```

禁止：

```text
COMMIT domain write
↓
另起 transaction 写 outbox
```

Foundation integration test 必须证明：

1. 业务 probe + outbox 同时 commit；
2. transaction rollback 时两者同时消失；
3. event_id UNIQUE 生效；
4. payload / headers 只能是 JSON object；
5. aggregate_id 为 UUID。

---

# 19. Outbox Publisher

模块化单体首期不引入 Kafka / RabbitMQ。

采用：

> PostgreSQL Outbox + Application Worker + in-process handler registry

流程：

```text
Worker
  ↓
claim available unpublished event
  ↓
Event Handler Registry
  ↓
registered consumer
  ↓
success -> published_at
failure -> last_error / available_at retry
```

要求：

- 使用数据库级并发安全 claim；
- 多 Worker 时不得长期双重占有同一事件；
- 使用现有 `available_at` 作为重试/lease 时间基础；
- `attempt_count` 每次实际 claim/attempt 更新；
- 失败写 `last_error`；
- 成功写 `published_at`；
- handler 接收稳定 `event_id`，供未来 Domain 做幂等；
- unknown event type 不允许静默丢弃；
- shutdown 时停止 claim 新事件并等待有限时间完成当前事件。

Foundation 不实现具体业务 consumer。

只建立 test handler 验证 Publisher。

---

# 20. Asset Infrastructure Access

物理文件 canonical metadata 唯一归：

```text
infrastructure.assets
```

Foundation 建立：

```text
AssetRepository
ObjectStorage interface
```

AssetRepository 只操作 `infrastructure.assets`。

Domain 后续只保存：

```text
asset_id UUID
```

不复制：

- bucket
- storage_key
- checksum
- mime type
- size
- physical URL canonical metadata

到各业务表。

Phase 1 只要求：

- 根据 asset UUID 查询 canonical asset metadata；
- 创建/更新 asset lifecycle 的 technical access 能力；
- storage provider 抽象存在；
- 测试 adapter 可用；
- 不提供 Social/Chat/Audio 业务上传 API。

生产对象存储 provider 的完整业务上传策略可以由后续实际使用 Asset 的 Phase 继续落地，但不得改变 canonical ownership。

---

# 21. Background Job Foundation

建立独立 Worker entry：

```text
src/worker.ts
```

Worker Host 负责：

- 启动后台 runner；
- 注册技术任务；
- lifecycle；
- signal handling；
- graceful shutdown；
- structured logging；
- testability。

Phase 1 至少注册：

- Outbox Publisher

后续 Domain 可以注册：

- retry job
- cleanup job
- scheduled job
- projection job

但 Foundation 不实现任何业务 job。

首期不新增 Redis，只因为“以后可能需要”而引入 Redis 属于过早基础设施。

---

# 22. Integration Test Database

这是 Phase 1 的关键产物。

测试必须使用真实 PostgreSQL。

流程：

```text
ADMIN_DATABASE_URL
    ↓
create unique disposable database
    ↓
run database/v2 frozen migrations
    ↓
run integration tests
    ↓
run database audit / required checks
    ↓
drop disposable database
```

要求：

- 每次测试库名称唯一；
- 从干净数据库开始；
- 不依赖开发者本地已有 schema；
- 不复用生产库；
- 测试失败时明确打印 test database 名称和阶段；
- 正常结束自动删除；
- 可选 debug 模式允许保留失败库；
- migration 使用 `database/v2` 现有 runner，不复制 migration 逻辑。

Integration Test DB 至少验证：

- migrations from zero
- app connection
- pool
- transaction commit
- transaction rollback
- repository pattern
- UUID
- outbox writer
- outbox publisher
- asset repository
- readiness

---

# 23. Migration Integration

应用自身不得在启动时“偷偷自动修改数据库 schema”。

推荐职责分离：

```text
Deployment / Test Setup
    ↓
database/v2 migrate
    ↓
Backend starts
```

应用启动可以执行：

- schema compatibility check
- required table existence check
- migration version/readiness check

但不得自动生成或修改业务表。

生产启动与 migration 解耦，避免多个实例同时隐式执行 schema migration。

---

# 24. Health / Readiness

## 24.1 Liveness

`GET /health/live`

只表示：

> process/event loop 可响应。

不得因为外部依赖短暂失败就返回 liveness fail 导致无限重启。

预期：

```text
200
{
  "status": "ok"
}
```

## 24.2 Readiness

`GET /health/ready`

至少检查：

- config 已加载；
- PostgreSQL pool 可获取连接；
- `SELECT 1` 成功；
- 必需 frozen infrastructure table 可见；
- 应用尚未进入 shutdown。

如 DB 不可用：

```text
503
```

readiness 不执行昂贵全库 audit。

---

# 25. Graceful Shutdown

API 与 Worker 都必须处理：

- `SIGTERM`
- `SIGINT`

API 顺序：

```text
stop accepting new requests
↓
drain in-flight requests
↓
close Fastify
↓
close PostgreSQL pool
```

Worker 顺序：

```text
stop claiming new jobs/events
↓
wait bounded in-flight work
↓
close pool
```

shutdown 超时不得无限挂死。

---

# 26. Architecture Boundary Enforcement

仅靠文档不足以长期防止模块越界。

Phase 1 必须增加自动化检查，至少覆盖：

1. Domain module 不允许 import 其他 Domain 的 `infrastructure/`；
2. Domain module 不允许 import 其他 Domain 的 repository；
3. cross-domain import 只能进入对方 `public/`；
4. shared technical layer 不得依赖业务 Domain；
5. business module 不允许直接 import `pg.Pool` 后自行创建 pool；
6. 不允许业务 Controller 直接执行 SQL；
7. migration 目录只由 database tool 管理。

实现方式可使用：

- ESLint import boundary rules；
- architecture test；
- 两者组合。

不得为了规则检查引入过度复杂的 monorepo build system。

---

# 27. CI Foundation

Phase 1 结束时至少应有自动 CI 验证路径：

```text
install
↓
typecheck
↓
lint
↓
unit tests
↓
start PostgreSQL
↓
fresh V2 migrations
↓
database audit
↓
backend integration tests
↓
foundation gate checks
```

任何：

- migration failure
- illegal cross-domain FK
- TypeScript error
- lint boundary violation
- test failure

均使 CI fail。

Phase 1 不负责完整 production deployment pipeline。

---

# 28. Task 实施顺序

以下顺序是正式实施顺序。除非发现 Blocker，不并行跳步。

## FND-01 — 创建 Application Package

目标：

- 建立 `apps/backend`
- TypeScript / ESM / pnpm
- build / dev / typecheck / lint / test scripts
- `main.ts`
- `worker.ts`

验收：

- [ ] dependency install PASS
- [ ] TypeScript compile PASS
- [ ] empty application bootstrap PASS
- [ ] unit test runner PASS

不做业务模块。

---

## FND-02 — Configuration / Environment

目标：

- typed config
- Zod validation
- `.env.example`
- secret redaction policy

测试：

- [ ] valid config PASS
- [ ] missing DATABASE_URL fails fast
- [ ] invalid port fails fast
- [ ] secret 不出现在 config dump

---

## FND-03 — Logging / Request Context

目标：

- Pino logger
- request_id
- child logger convention
- sensitive field redaction

测试：

- [ ] request_id automatically exists
- [ ] structured JSON log PASS
- [ ] authorization / secret redaction PASS

---

## FND-04 — PostgreSQL Pool

目标：

- single pool factory
- pool config
- pool lifecycle
- readiness query

测试：

- [ ] V2 PostgreSQL connection PASS
- [ ] pool acquire/release PASS
- [ ] DB unavailable error PASS
- [ ] pool shutdown PASS

---

## FND-05 — Database Executor / Transaction Manager

目标：

- common query executor
- transaction-scoped executor
- commit / rollback
- error propagation

测试：

- [ ] commit PASS
- [ ] rollback PASS
- [ ] connection release PASS
- [ ] thrown error preserved
- [ ] rollback failure logged

---

## FND-06 — UUID Foundation

目标：

- single logical UUID generator/validator

测试：

- [ ] UUID format PASS
- [ ] contract rejects bigint as logical UUID
- [ ] outbox aggregate UUID validation PASS

---

## FND-07 — Repository Convention + Probe

目标：

- repository implementation convention
- test-only probe repository
- SQL parameterization
- row mapping pattern

测试：

- [ ] repository read/write against test schema PASS
- [ ] transaction-scoped repository PASS

完成后删除任何不必要的 production probe code；test fixture 只留在 test support。

---

## FND-08 — Error Foundation

目标：

- AppError
- database error normalization boundary
- HTTP error envelope

测试：

- [ ] known 4xx mapping PASS
- [ ] unknown 500 mapping PASS
- [ ] stack 不泄漏给客户端
- [ ] request_id included

---

## FND-09 — Fastify API Foundation

目标：

- `buildApp()`
- server bootstrap
- request lifecycle
- health routes

测试：

- [ ] app boots
- [ ] `/health/live` = 200
- [ ] `/health/ready` with DB = 200
- [ ] `/health/ready` without DB = 503

---

## FND-10 — Authentication Skeleton

目标：

- AuthenticationProvider
- AuthContext
- protected-route hook contract
- fail-closed behavior

测试：

- [ ] health remains public
- [ ] protected test route without provider is denied
- [ ] test provider can inject logical UUID principal

测试路由不得成为正式业务 API。

---

## FND-11 — Outbox Writer

目标：

- typed DomainEvent envelope
- OutboxRepository
- transaction-bound writer

测试：

- [ ] canonical probe + outbox commit atomically
- [ ] rollback removes both
- [ ] duplicate event_id rejected
- [ ] JSON object constraint PASS

---

## FND-12 — Worker Host

目标：

- worker lifecycle
- registry
- shutdown
- logging

测试：

- [ ] worker starts/stops
- [ ] no registered work does not crash
- [ ] shutdown stops accepting new work

---

## FND-13 — Outbox Publisher

目标：

- claim
- dispatch
- success marking
- retry/backoff
- unknown event handling

测试：

- [ ] unpublished event dispatched
- [ ] published_at set on success
- [ ] attempt_count increments
- [ ] failure records last_error
- [ ] failed event becomes retryable
- [ ] two publisher instances do not permanently double-claim one row

---

## FND-14 — Asset Infrastructure Access

目标：

- asset DB model
- AssetRepository
- ObjectStorage port
- test adapter

测试：

- [ ] create/read asset canonical metadata
- [ ] storage key uniqueness respected
- [ ] status transition DB constraints respected
- [ ] Domain-like fixture only stores asset UUID

不实现业务上传 endpoint。

---

## FND-15 — Integration Test DB Automation

目标：

- disposable PostgreSQL DB
- call frozen migration runner
- teardown
- optional failure retention

测试：

- [ ] clean DB create PASS
- [ ] 17 baseline migrations PASS
- [ ] fresh DB app integration PASS
- [ ] teardown PASS

---

## FND-16 — Migration / Schema Compatibility Check

目标：

- backend readiness 能确认 required baseline 可用
- 不由 backend 修改 schema

测试：

- [ ] correct V2 DB PASS
- [ ] empty DB readiness FAIL
- [ ] incomplete baseline readiness FAIL
- [ ] application does not auto-create business tables

---

## FND-17 — Architecture Boundary Automation

目标：

- module import rules
- DB access rules
- no cross-domain internal imports
- no per-domain Pool

测试：

- [ ] legal fixture PASS
- [ ] forbidden cross-domain import fixture FAIL
- [ ] forbidden direct pool creation rule FAIL

---

## FND-18 — Full Foundation Verification

执行：

```text
typecheck
lint
unit tests
integration tests
fresh database migration
database audit
foundation architecture audit
health/readiness tests
outbox tests
asset tests
shutdown tests
```

全部 PASS 后才能进入 Audit / Report。

---

## FND-19 — Implementation Report + Exit Gate

生成：

```text
docs/docs/development/v2/01-foundation/
├── APPLICATION_FOUNDATION_PLAN.md
└── APPLICATION_FOUNDATION_REPORT.md
```

报告至少包含：

- Scope completed
- Files changed
- Technical decisions
- Database changes（预期为 none；如有必须列新 migration）
- Tests
- Integration DB evidence
- Outbox evidence
- Asset evidence
- Architecture boundary evidence
- Known limitations
- TECH_DEBT
- OUT_OF_SCOPE_FINDING
- Exit Gate result

完成后停止，不自动进入 Identity。

---

# 29. 文件变更范围

Phase 1 允许主要修改：

```text
apps/backend/**
docs/docs/development/v2/01-foundation/**
docs/docs/development/v2/DEVELOPMENT_PROGRESS.md
.gitignore
CI workflow files
```

必要时可新增：

```text
database/v2/migrations/<new incremental migration>.sql
```

但只有遇到已经确认的 Foundation blocker 才允许。

禁止：

- 修改 `0000`–`1240` 已冻结 migration；
- 重写 11 个 Domain 数据库；
- 提前实现 `src/modules/identity` 等完整业务模块；
- 大规模修改产品文档；
- 因 Foundation 顺手重构所有文档或数据库工具。

---

# 30. 保留 / 新增 / 替换

## 保留

- `database/v2`
- 现有 17 个 migration
- migration hash / advisory lock 机制
- database audit
- PostgreSQL 18 baseline
- `infrastructure.assets`
- `infrastructure.system_outbox_events`
- 11 Domain Schema
- 全局 logical UUID / no cross-domain FK 规则

## 新增

- `apps/backend`
- TypeScript application runtime
- Fastify API foundation
- typed config
- common PostgreSQL pool
- transaction manager
- repository convention
- UUID utility
- error handling
- logging
- request context
- Authentication skeleton
- Outbox Writer
- Outbox Publisher
- Worker Host
- Asset technical access
- Integration Test DB automation
- architecture boundary tests
- health/readiness

## 替换

当前不存在需要“替换”的正式应用基础设施。

若实施调查发现仓库中存在未纳入当前主干事实源的零散旧 application code：

> 不自动迁移、不自动保留。

先判断它是否属于当前 V2 产品与架构，再由对应 Phase 明确处理。

---

# 31. Foundation 测试矩阵

| 能力 | Unit | Integration | Fresh DB | Failure Path |
|---|---:|---:|---:|---:|
| Config | ✅ | — | — | ✅ |
| Logger | ✅ | ✅ | — | ✅ |
| UUID | ✅ | — | — | ✅ |
| DB Pool | — | ✅ | ✅ | ✅ |
| Transaction | — | ✅ | ✅ | ✅ |
| Repository Pattern | ✅ | ✅ | ✅ | ✅ |
| API Boot | ✅ | ✅ | — | ✅ |
| Error Handler | ✅ | ✅ | — | ✅ |
| Auth Skeleton | ✅ | ✅ | — | ✅ |
| Outbox Writer | ✅ | ✅ | ✅ | ✅ |
| Outbox Publisher | ✅ | ✅ | ✅ | ✅ |
| Asset Access | ✅ | ✅ | ✅ | ✅ |
| Worker Lifecycle | ✅ | ✅ | — | ✅ |
| Migration Integration | — | ✅ | ✅ | ✅ |
| Health / Readiness | ✅ | ✅ | ✅ | ✅ |
| Architecture Boundary | ✅ | — | — | ✅ |

---

# 32. Foundation Exit Gate

只有下列条件全部满足，才能：

```text
FOUNDATION_GATE = PASS
```

## 32.1 Application

- [ ] Application boots
- [ ] Worker boots
- [ ] clean shutdown PASS
- [ ] TypeScript typecheck PASS
- [ ] lint PASS

## 32.2 Database

- [ ] V2 PostgreSQL connection PASS
- [ ] connection pool PASS
- [ ] fresh DB migration PASS
- [ ] database audit PASS
- [ ] frozen migration 未被修改
- [ ] illegal cross-domain FK = 0
- [ ] logical UUID violation = 0

## 32.3 Transaction / Repository

- [ ] transaction commit integration test PASS
- [ ] transaction rollback integration test PASS
- [ ] repository test pattern PASS
- [ ] Repository ownership convention documented
- [ ] Domain 无独立 Pool pattern

## 32.4 UUID

- [ ] UUID contract PASS
- [ ] API/Event logical ID 不使用 internal BIGINT

## 32.5 Outbox

- [ ] Outbox Writer integration PASS
- [ ] same-transaction guarantee PASS
- [ ] Outbox Publisher integration PASS
- [ ] retry behavior PASS
- [ ] publisher concurrency behavior PASS

## 32.6 Asset

- [ ] Asset infrastructure access PASS
- [ ] canonical metadata ownership PASS
- [ ] Domain fixture only uses asset_id logical UUID

## 32.7 HTTP / Error / Logging

- [ ] unified error handling PASS
- [ ] logging baseline PASS
- [ ] request_id PASS
- [ ] sensitive-data redaction PASS
- [ ] `/health/live` PASS
- [ ] `/health/ready` PASS
- [ ] readiness failure path PASS

## 32.8 Auth / Jobs

- [ ] Authentication skeleton PASS
- [ ] unauthenticated protected route fail-closed PASS
- [ ] Background Worker Foundation PASS

## 32.9 Tests

- [ ] unit tests PASS
- [ ] integration tests PASS
- [ ] Test DB automation PASS
- [ ] Fresh DB test PASS
- [ ] CI foundation PASS
- [ ] architecture boundary tests PASS

## 32.10 Documentation

- [ ] `APPLICATION_FOUNDATION_REPORT.md` 已生成
- [ ] `DEVELOPMENT_PROGRESS.md` 已更新
- [ ] Remaining Issues 已列出
- [ ] TECH_DEBT 均有 owner phase + removal condition
- [ ] OUT_OF_SCOPE_FINDING 均已记录
- [ ] 无未解决 Foundation blocker

只有全部通过：

```text
APPLICATION_FOUNDATION = COMPLETE
FOUNDATION_GATE = PASS
```

才允许开始：

```text
PHASE 2 — Identity Domain
```

---

# 33. Gate 失败规则

存在以下任一情况：

- 事务不能保证 rollback；
- Outbox 无法与 canonical write 同事务；
- fresh DB 无法启动应用；
- Repository boundary 无法约束；
- Asset canonical ownership 被重复；
- protected route 默认放行；
- 应用必须修改 frozen migration 才能运行；
- 出现跨 Domain physical FK；
- logical UUID contract 被破坏；
- integration tests 依赖人工预置数据库；
- readiness 无法正确识别数据库不可用；

则：

```text
FOUNDATION_GATE = FAIL
```

不得以：

```text
“后面 Identity 再补”
```

作为通过理由。

如果仅存在不阻塞后续 Domain 的明确技术债务，可记录：

```text
PASS_WITH_BLOCKERS
```

但依据 Master Plan：

> 后续依赖 Phase 只能在 `PASS` 时开始。

因此实际进入 Identity 前仍必须消除 blocker 并重新取得 `PASS`。

---

# 34. Blocker 判定

Foundation 真正 blocker 包括：

- Frozen spec conflict
- Database physical contract 与应用无法兼容
- Unknown canonical owner
- 无法维护 data integrity
- 必需 cross-domain contract 无定义
- Critical security problem
- Foundation architecture 无法承载后续 Domain
- Outbox 原子性无法实现
- UUID 边界无法维持

普通 implementation bug 不属于 spec blocker，应在本 Phase 修复。

---

# 35. 风险与控制

## RISK-01 — Foundation 变成“大重构”

控制：

- 当前仓库没有正式业务应用运行时，因此只新增 foundation；
- 不扫描并改写全部未来 Domain；
- 不提前实现业务。

## RISK-02 — Shared Layer 变成 Common Service

控制：

Shared technical layer 白名单仅限：

- config
- DB
- transaction
- UUID
- error
- logging
- HTTP infrastructure
- auth skeleton
- outbox
- asset technical access
- worker/jobs
- test infrastructure

不得放入：

- 用户
- 课程
- 社交
- 聊天
- 钱包
- 奖励
- 审核业务规则

## RISK-03 — ORM 反向控制数据库

控制：

- frozen migration 是唯一 schema authority；
- Foundation 使用 `pg`；
- 不生成第二套 entity schema migration。

## RISK-04 — Outbox Publisher 过度复杂

控制：

- 首期只做 PostgreSQL polling publisher；
- 不引入 Kafka/RabbitMQ；
- 先满足 10k 注册用户量级；
- 真实负载出现后再评估 broker。

## RISK-05 — Background Job 提前引入 Redis

控制：

- Phase 1 使用 Worker Host；
- Outbox 已由 PostgreSQL 持久化；
- 无真实需求不增加 Redis 运维面。

## RISK-06 — Test 使用 mock DB 掩盖 PostgreSQL 问题

控制：

- 核心 persistence 测试必须跑真 PostgreSQL；
- SQLite 不作为替代；
- fresh DB migration 是 Gate。

## RISK-07 — Authentication Skeleton 被误当正式 Auth

控制：

- skeleton 只定义 provider/hook/context；
- Identity Phase 才实现 OTP / Session / Device；
- protected route 默认 fail-closed。

## RISK-08 — Asset Adapter 侵入 Domain

控制：

- `infrastructure.assets` 唯一 canonical owner；
- Domain 只持有 asset UUID；
- storage provider details 不泄漏进 Domain Entity。

---

# 36. Definition of Done

Phase 1 的 Definition of Done：

> 在一台干净开发/CI 环境中，从空 PostgreSQL 数据库开始，可以自动执行冻结 V2 migration，启动 ZH-LAO Backend 和 Worker，成功连接数据库，正确执行 commit/rollback，使用统一 Repository pattern，生成 logical UUID，在同一事务中写入 Outbox，后台安全投递 Outbox，读取/维护 Asset canonical metadata，输出结构化日志和统一错误，提供 liveness/readiness，运行完整 unit/integration tests，并通过 architecture boundary 检查；全过程不实现任何具体业务 Domain 功能，也不修改冻结数据库主体设计。

---

# 37. Phase 完成后的唯一下一步

Foundation Gate 通过后：

1. 更新 `DEVELOPMENT_PROGRESS.md`
2. 将 Application Foundation 标记：
   - `COMPLETE`
   - Gate `PASS`
3. 停止当前 Phase
4. 不自动实现 Identity
5. 下一次明确任务应是制定：

```text
docs/docs/development/v2/02-identity/
├── IDENTITY_IMPLEMENTATION_PLAN.md
├── IDENTITY_USE_CASES.md
└── IDENTITY_API.md
```

Identity 计划审核通过后，才开始 PHASE 2 实施。

---

# 38. 最终施工顺序摘要

```text
PLAN REVIEW
    ↓
FND-01 Application Package
    ↓
FND-02 Config / Environment
    ↓
FND-03 Logging / Request Context
    ↓
FND-04 PostgreSQL Pool
    ↓
FND-05 Transaction
    ↓
FND-06 UUID
    ↓
FND-07 Repository Pattern
    ↓
FND-08 Error Handling
    ↓
FND-09 API Foundation / Health
    ↓
FND-10 Authentication Skeleton
    ↓
FND-11 Outbox Writer
    ↓
FND-12 Worker Host
    ↓
FND-13 Outbox Publisher
    ↓
FND-14 Asset Infrastructure
    ↓
FND-15 Integration Test DB
    ↓
FND-16 Migration Compatibility
    ↓
FND-17 Architecture Boundaries
    ↓
FND-18 Full Verification
    ↓
FND-19 Report / Audit
    ↓
FOUNDATION_GATE
```

只有：

```text
FOUNDATION_GATE = PASS
```

才能进入下一 Phase。
